// utils.js

// Converts millimeters to inches.
export function convertToInches(mm) {
    return mm / 25.4; // 1 inch = 25.4 mm
}

// Computes the average precipitation for a set of records.
export function computeAverageForArea(records) {
    if (records.length === 0) return 0;
    const total = records.reduce((sum, record) => sum + convertToInches(Number(record.precipitation_amount)), 0);
    return total / records.length;
}

// Filters precipitation data for a specific feature based on the level.
export function filterPrecipitationData(feature, precipitationData, level) {
    switch (level) {
        case "county":
            // Convert to string and pad state and county IDs for comparison
            return precipitationData.filter(r =>
                String(r.state_id).padStart(2, '0') === feature.properties.STATEFP &&
                String(r.county_id).padStart(3, '0') === feature.properties.COUNTYFP
            );
        case "state":
            // Convert to string and pad state IDs for comparison
            return precipitationData.filter(r =>
                String(r.state_id).padStart(2, '0') === feature.properties.STATEFP
            );
        case "region":
            // Assuming region_id does not need padding but ensure it is treated as a string if necessary
            return precipitationData.filter(r =>
                String(r.region_id) === feature.properties.GEOID
            );
        default:
            return [];
    }
}

// Simple color interpolation for fill color
function interpolateColor(max, value) {
    // If max is 0 (no data), return baby blue color
    if (max === 0 || isNaN(value)) return `rgb(173, 216, 230)`; // Baby blue if no data or invalid value

    const ratio = Math.min(value / max, 1);  // Ensure the ratio stays between 0 and 1
    // Interpolate from baby blue (173, 216, 230) to dark blue (0, 0, 255)
    const r = Math.round(173 + ratio * (0 - 173));  // Red component
    const g = Math.round(216 + ratio * (0 - 216));  // Green component
    const b = Math.round(230 + ratio * (255 - 230));  // Blue component
    return `rgb(${r},${g},${b})`;
}


// Styles a GeoJSON feature based on average precipitation.
export function styleFeature(feature, data, level, maxAvg) {
    const records = filterPrecipitationData(feature, data, level);
    const avg = computeAverageForArea(records)
    const color = interpolateColor(maxAvg, avg);
    console.log(`Feature: ${feature.properties.NAME}, Avg Precipitation: ${avg}, Color: ${color}`);

    return {
        color: "#555",
        weight: 1,
        fillOpacity: 0.7,
        fillColor: color
    };
}

// Binds a popup showing the feature’s name and average precipitation in inches and millimeters.
export function bindPopupToFeature(feature, layer, data, dataLevel) {
    const featureRecords = filterPrecipitationData(feature, data, dataLevel);
    const featureAverageInches = computeAverageForArea(featureRecords);
    const featureAverageMM = (featureAverageInches * 25.4);

    const featureLabel = formatFeatureLabel(feature, dataLevel);

    layer.bindPopup(`
      <strong>${featureLabel}</strong><br>
      <strong>Average Precipitation:</strong> ${featureAverageInches.toFixed(2)} inches (${featureAverageMM.toFixed(1)} mm)
    `);
}

// Helper to produce a human‐readable label.
function formatFeatureLabel(feature, dataLevel) {
    const name = feature.properties.NAME;
    if (dataLevel === "county") {
        return `${name} (County)`;
    }
    if (dataLevel === "state") {
        return `${name} (State)`;
    }
    // for regions some GeoJSON use .name, others .NAME
    if (dataLevel === "region") {
        return feature.properties.name
            ? `${feature.properties.name} (Region)`
            : `${name} (Region)`;
    }
    return "No data";
}