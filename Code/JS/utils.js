// utils.js

/**
 * @fileoverview
 * Utility functions for data conversion, filtering, styling, and popup generation 
 * in the Precipi-Tracker application. Includes precipitation unit conversions,
 * data filtering by geographic feature, dynamic color interpolation, and popup rendering.
 */

/**
 * Converts a value in millimeters to inches.
 *
 * @function convertToInches
 * @param {number} mm - The precipitation amount in millimeters.
 * @returns {number} The equivalent amount in inches.
 */
export function convertToInches(mm) {
    return mm / 25.4; // 1 inch = 25.4 mm
}

/**
 * Computes the average precipitation from a set of records.
 * Values are converted to inches before averaging.
 *
 * @function computeAverageForArea
 * @param {Array<Object>} records - The list of precipitation records.
 * @returns {number} The average precipitation in inches, or 0 if no records.
 */
export function computeAverageForArea(records) {
    if (records.length === 0) return 0;
    const total = records.reduce(
        (sum, record) => sum + convertToInches(Number(record.precipitation_amount)), 0
    );
    return total / records.length;
}

/**
 * Filters a list of precipitation records to those matching a given feature and data level.
 *
 * @function filterPrecipitationData
 * @param {Object} feature - The GeoJSON feature.
 * @param {Array<Object>} precipitationData - The full list of precipitation records.
 * @param {string} level - The geographic level ("county", "state", or "region").
 * @returns {Array<Object>} A filtered list of records matching the feature.
 */
export function filterPrecipitationData(feature, precipitationData, level) {
    switch (level) {
        case "county":
            return precipitationData.filter(r =>
                String(r.state_id).padStart(2, '0') === feature.properties.STATEFP &&
                String(r.county_id).padStart(3, '0') === feature.properties.COUNTYFP
            );
        case "state":
            return precipitationData.filter(r =>
                String(r.state_id).padStart(2, '0') === feature.properties.STATEFP
            );
        case "region":
            return precipitationData.filter(r =>
                String(r.region_id) === feature.properties.GEOID
            );
        default:
            return [];
    }
}

/**
 * Interpolates between baby blue and dark blue based on a value-to-max ratio.
 * Used to determine the fill color of features based on relative precipitation.
 *
 * @function interpolateColor
 * @param {number} max - The maximum average precipitation across all features.
 * @param {number} value - The average precipitation for the current feature.
 * @returns {string} A CSS rgb() color string.
 */
function interpolateColor(max, value) {
    if (max === 0 || isNaN(value)) return `rgb(173, 216, 230)`; // Baby blue

    const ratio = Math.min(value / max, 1);
    const r = Math.round(173 + ratio * (0 - 173));  // Red component
    const g = Math.round(216 + ratio * (0 - 216));  // Green component
    const b = Math.round(230 + ratio * (255 - 230)); // Blue component

    return `rgb(${r},${g},${b})`;
}

/**
 * Generates a style object for a GeoJSON feature based on average precipitation.
 *
 * @function styleFeature
 * @param {Object} feature - The GeoJSON feature to style.
 * @param {Array<Object>} data - The full set of precipitation records.
 * @param {string} level - The data level ("county", "state", "region").
 * @param {number} maxAvg - The maximum average precipitation for color scaling.
 * @returns {Object} A Leaflet-compatible style object.
 */
export function styleFeature(feature, data, level, maxAvg) {
    const records = filterPrecipitationData(feature, data, level);
    const avg = computeAverageForArea(records);
    const color = interpolateColor(maxAvg, avg);

    console.log(`Feature: ${feature.properties.NAME}, Avg Precipitation: ${avg}, Color: ${color}`);

    return {
        color: "#555",
        weight: 1,
        fillOpacity: 0.7,
        fillColor: color
    };
}

/**
 * Attaches a popup to a Leaflet layer for a given feature.
 * Displays the average precipitation in inches and millimeters.
 *
 * @function bindPopupToFeature
 * @param {Object} feature - The GeoJSON feature.
 * @param {L.Layer} layer - The Leaflet layer for the feature.
 * @param {Array<Object>} data - The precipitation records.
 * @param {string} dataLevel - The data level ("county", "state", "region").
 */
export function bindPopupToFeature(feature, layer, data, dataLevel) {
    const featureRecords = filterPrecipitationData(feature, data, dataLevel);
    const featureAverageInches = computeAverageForArea(featureRecords);
    const featureAverageMM = featureAverageInches * 25.4;

    const featureLabel = formatFeatureLabel(feature, dataLevel);

    layer.bindPopup(`
      <strong>${featureLabel}</strong><br>
      <strong>Average Precipitation:</strong> ${featureAverageInches.toFixed(2)} inches (${featureAverageMM.toFixed(1)} mm)
    `);
}

/**
 * Generates a user-friendly label for a geographic feature based on its level.
 * 
 * @function formatFeatureLabel
 * @param {Object} feature - The GeoJSON feature.
 * @param {string} dataLevel - The data level ("county", "state", "region").
 * @returns {string} A readable label for the feature.
 */
function formatFeatureLabel(feature, dataLevel) {
    const name = feature.properties.NAME;
    if (dataLevel === "county") {
        return `${name} (County)`;
    }
    if (dataLevel === "state") {
        return `${name} (State)`;
    }
    if (dataLevel === "region") {
        return feature.properties.name
            ? `${feature.properties.name} (Region)`
            : `${name} (Region)`;
    }
    return "No data";
}
