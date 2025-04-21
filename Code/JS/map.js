// map.js

let map = null;
let geoJsonLayer = null;
let currentGeoJsonFile = null;
let currentDataLevel = null;
let lastBounds = null;

export function initializeMap() {
    map = L.map("map",{zoomControl:false}).setView([37.8, -96], 4);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    
    L.control.zoom({        // Load custom-positioned zoom buttons 
    position: 'bottomleft'  // options: 'topleft', 'topright', 'bottomleft', 'bottomright'
    }).addTo(map);

    return map;
}

export function getMap() {
    return map;
}

export function setGeoJsonLayer(layer) {
    geoJsonLayer = layer;
}

export function getGeoJsonLayer() {
    return geoJsonLayer;
}

export function setCurrentGeoJsonFile(file) {
    currentGeoJsonFile = file;
}

export function getCurrentGeoJsonFile() {
    return currentGeoJsonFile;
}

export function setCurrentDataLevel(level) {
    currentDataLevel = level;
}

export function getCurrentDataLevel() {
    return currentDataLevel;
}

export function setLastBounds(bounds) {
    lastBounds = bounds;
}

export function getLastBounds() {
    return lastBounds;
}

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
