// map.js

/**
 * @fileoverview
 * Manages the Leaflet map instance and associated state for the Precipi-Tracker application.
 * 
 * This module handles map initialization, state tracking for GeoJSON layers, 
 * and helper functions to access or update the current view and data level context.
 */

// Internal map and state references (not exposed directly)
let map = null;
let geoJsonLayer = null;
let currentGeoJsonFile = null;
let currentDataLevel = null;
let lastBounds = null;

/**
 * Initializes the Leaflet map instance with a default view and base layer.
 * Adds zoom controls positioned at the bottom-left of the screen.
 * 
 * @function initializeMap
 * @returns {L.Map} The initialized Leaflet map instance.
 */
export function initializeMap() {
    map = L.map("map", { zoomControl: false }).setView([37.8, -96], 4);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        minZoom: 3,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({
        position: 'bottomleft'
    }).addTo(map);

    return map;
}

/**
 * Gets the current Leaflet map instance.
 * 
 * @function getMap
 * @returns {L.Map|null} The map object, or null if not initialized.
 */
export function getMap() {
    return map;
}

/**
 * Sets the current GeoJSON layer reference in state.
 * 
 * @function setGeoJsonLayer
 * @param {L.Layer|null} layer - The Leaflet GeoJSON layer to set, or null to clear.
 */
export function setGeoJsonLayer(layer) {
    geoJsonLayer = layer;
}

/**
 * Gets the current GeoJSON layer object from state.
 * 
 * @function getGeoJsonLayer
 * @returns {L.Layer|null} The current GeoJSON layer, or null if not set.
 */
export function getGeoJsonLayer() {
    return geoJsonLayer;
}

/**
 * Sets the file path for the current GeoJSON data source.
 * 
 * @function setCurrentGeoJsonFile
 * @param {string} file - Path to the GeoJSON file currently in use.
 */
export function setCurrentGeoJsonFile(file) {
    currentGeoJsonFile = file;
}

/**
 * Gets the file path of the current GeoJSON data source.
 * 
 * @function getCurrentGeoJsonFile
 * @returns {string|null} File path string or null if not set.
 */
export function getCurrentGeoJsonFile() {
    return currentGeoJsonFile;
}

/**
 * Sets the current data level (e.g., "county", "state", "region").
 * 
 * @function setCurrentDataLevel
 * @param {string} level - The geographic level of the current dataset.
 */
export function setCurrentDataLevel(level) {
    currentDataLevel = level;
}

/**
 * Gets the current data level in use.
 * 
 * @function getCurrentDataLevel
 * @returns {string|null} The geographic data level or null if not set.
 */
export function getCurrentDataLevel() {
    return currentDataLevel;
}

/**
 * Sets the map bounds from the last successful layer update.
 * Used to avoid unnecessary reloading.
 * 
 * @function setLastBounds
 * @param {L.LatLngBounds} bounds - The Leaflet bounds object from the last view.
 */
export function setLastBounds(bounds) {
    lastBounds = bounds;
}

/**
 * Gets the last stored map bounds used for layer comparison.
 * 
 * @function getLastBounds
 * @returns {L.LatLngBounds|null} The most recent map bounds or null if not set.
 */
export function getLastBounds() {
    return lastBounds;
}

/**
 * Export all functions as a default object (optional for flexible import patterns).
 */
export default {
    initializeMap,
    getMap,
    setGeoJsonLayer,
    getGeoJsonLayer,
    setCurrentGeoJsonFile,
    getCurrentGeoJsonFile,
    setCurrentDataLevel,
    getCurrentDataLevel,
    setLastBounds,
    getLastBounds
};
