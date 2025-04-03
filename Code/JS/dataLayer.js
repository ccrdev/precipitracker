// dataLayer.js
import {
    getMap,
    setGeoJsonLayer,
    setCurrentGeoJsonFile,
    setCurrentDataLevel,
    setLastBounds,
    getLastBounds,
    getCurrentGeoJsonFile, getCurrentDataLevel, getGeoJsonLayer
} from './map.js';
import { fetchPrecipitationData } from './api.js'; // Assume you have this function implemented in api.js
import { styleFeature, bindPopupToFeature } from './utils.js'; // Utility functions
import { getCurrentStartDate, getCurrentEndDate } from './date.js'; // Date functions

async function loadLayerByZoom() {
    const map = getMap();
    let geoJsonFile, level;
    const zoom = map.getZoom();

    if (zoom >= 8) {
        geoJsonFile = "./US_Counties.geojson";
        level = "county";
    } else if (zoom >= 5) {
        geoJsonFile = "./US_States.geojson";
        level = "state";
    } else {
        geoJsonFile = "./US_Regions.geojson";
        level = "region";
    }

    // Clear the existing layer every time this function runs
    if (getGeoJsonLayer()) {
        map.removeLayer(getGeoJsonLayer());
        setGeoJsonLayer(null); // Ensure the old layer is discarded
    }

    // Load new data and update layer
    const precipitationData = await fetchPrecipitationData(level, getCurrentStartDate(), getCurrentEndDate());
    if (!precipitationData) return;

    const response = await fetch(geoJsonFile);
    const geojson = await response.json();

    const filteredFeatures = geojson.features.filter(feature => {
        const layer = L.geoJson(feature);
        const featureBounds = layer.getBounds();
        return map.getBounds().intersects(featureBounds);
    });

    const filteredGeoJson = {
        type: "FeatureCollection",
        features: filteredFeatures
    };

    const newLayer = L.geoJson(filteredGeoJson, {
        style: feature => styleFeature(feature, precipitationData, level),
        onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationData, level)
    });

    setGeoJsonLayer(newLayer.addTo(map));
}

export { loadLayerByZoom };
