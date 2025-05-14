// dataLayer.js

/**
 * @fileoverview
 * Handles dynamic loading and rendering of precipitation data layers
 * based on the user's current map view, zoom level, and selected date range.
 * 
 * This module:
 * - Selects the appropriate GeoJSON file (county, state, or region level)
 *   depending on the map zoom level.
 * - Fetches precipitation data from the backend API.
 * - Filters visible geographic features based on map bounds.
 * - Computes average precipitation and applies a color scale.
 * - Styles each feature and binds popup information to it.
 * - Prevents unnecessary reloads if the map view and data context have not changed.
 */

import {
    getCurrentDataLevel,
    getCurrentGeoJsonFile,
    getGeoJsonLayer,
    getLastBounds,
    getMap,
    setCurrentDataLevel,
    setCurrentGeoJsonFile,
    setGeoJsonLayer,
    setLastBounds
} from "./map.js";

import { fetchPrecipitationData } from "./api.js";
import { bindPopupToFeature, computeAverageForArea, filterPrecipitationData, styleFeature } from "./utils.js";
import { getCurrentEndDate, getCurrentStartDate } from "./date.js";

let lastStartDate = null;
let lastEndDate = null;
let isLayerUpdating = false; // Flag to prevent concurrent layer updates

/**
 * Loads and renders a new precipitation layer on the map when a change in view,
 * zoom level, or date range is detected. Automatically selects the correct
 * GeoJSON level (county, state, region) based on the current zoom level.
 * 
 * Prevents redundant rendering if the view or data is unchanged. 
 * Updates the internal map state, fetches required data, and styles features
 * based on precipitation averages for the selected time range.
 * 
 * Steps:
 * 1. Abort if an update is already running.
 * 2. Determine appropriate data granularity (geo level) from zoom.
 * 3. Compare current bounds, zoom, and date range with previous values.
 * 4. If changed, fetch precipitation and GeoJSON data.
 * 5. Style, filter, and bind each feature based on precipitation stats.
 * 6. Add the new layer to the map.
 * 
 * @async
 * @function loadLayerOnEvent
 * @returns {Promise<void>} Does not return data; updates the map directly.
 */
export async function loadLayerOnEvent() {
    if (isLayerUpdating) return; // Avoid concurrent updates

    isLayerUpdating = true;

    const mapInstance = getMap();
    const startDate = getCurrentStartDate();
    const endDate = getCurrentEndDate();
    const currentZoom = mapInstance.getZoom();

    // Select GeoJSON file and data level based on zoom
    let geoJsonFilePath, dataLevel;
    if (currentZoom >= 8) {
        geoJsonFilePath = "./US_Counties.geojson";
        dataLevel = "county";
    } else if (currentZoom >= 5) {
        geoJsonFilePath = "./US_States.geojson";
        dataLevel = "state";
    } else {
        geoJsonFilePath = "./US_Regions.geojson";
        dataLevel = "region";
    }

    // Check if map view, data level, or date range has changed
    const mapBounds = mapInstance.getBounds();
    const viewUnchanged =
        mapBounds.equals(getLastBounds()) &&
        geoJsonFilePath === getCurrentGeoJsonFile() &&
        dataLevel === getCurrentDataLevel() &&
        startDate === lastStartDate &&
        endDate === lastEndDate;

    if (viewUnchanged) {
        console.log("View, zoom/level, and dates unchanged; skipping reload.");
        isLayerUpdating = false;
        return;
    }

    // Update internal state with current parameters
    setCurrentGeoJsonFile(geoJsonFilePath);
    setCurrentDataLevel(dataLevel);
    setLastBounds(mapBounds);
    lastStartDate = startDate;
    lastEndDate = endDate;

    // Remove existing layer, if any
    const previousLayer = getGeoJsonLayer();
    if (previousLayer && mapInstance.hasLayer(previousLayer)) {
        mapInstance.removeLayer(previousLayer);
    }
    setGeoJsonLayer(null); // Clear previous reference

    // Fetch precipitation records for current parameters
    const precipitationData = await fetchPrecipitationData(dataLevel, startDate, endDate);
    if (!precipitationData) {
        isLayerUpdating = false;
        return;
    }

    // Fetch and parse appropriate GeoJSON file
    const geoJsonResponse = await fetch(geoJsonFilePath);
    const geoJsonObject = await geoJsonResponse.json();

    // Filter features within current map view
    const visibleFeatures = geoJsonObject.features.filter(feature => {
        const featureBounds = L.geoJson(feature).getBounds();
        return mapBounds.intersects(featureBounds);
    });

    // Determine the maximum average precipitation to normalize coloring
    const maximumAverage = visibleFeatures.length
        ? Math.max(
            ...visibleFeatures.map(feature => {
                const records = filterPrecipitationData(feature, precipitationData, dataLevel);
                return computeAverageForArea(records);
            })
        )
        : 0;

    // Create and add a new styled GeoJSON layer with popups
    const newLayer = L.geoJSON(
        { type: "FeatureCollection", features: visibleFeatures },
        {
            style: feature => styleFeature(feature, precipitationData, dataLevel, maximumAverage),
            onEachFeature: (feature, layer) =>
                bindPopupToFeature(feature, layer, precipitationData, dataLevel)
        }
    ).addTo(mapInstance);

    // Update map state with the new layer
    setGeoJsonLayer(newLayer);
    isLayerUpdating = false;
}