// dataLayer.js
import {
    getMap,
    setGeoJsonLayer,
    getGeoJsonLayer,
    setCurrentGeoJsonFile,
    setCurrentDataLevel,
    setLastBounds,
    getLastBounds,
    getCurrentGeoJsonFile,
    getCurrentDataLevel
} from './map.js';
import { fetchPrecipitationData } from './api.js';
import { styleFeature, bindPopupToFeature } from './utils.js';
import { getCurrentStartDate, getCurrentEndDate } from './date.js';

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

    // Explicitly clear existing layer (robust method)
    const existingLayer = getGeoJsonLayer();
    if (existingLayer && map.hasLayer(existingLayer)) {
        map.removeLayer(existingLayer);
    }
    setGeoJsonLayer(null); // Reset the reference immediately

    // Fetch new precipitation data
    const precipitationData = await fetchPrecipitationData(level, getCurrentStartDate(), getCurrentEndDate());
    if (!precipitationData) return;

    // Fetch GeoJSON data and filter features
    const response = await fetch(geoJsonFile);
    const geojson = await response.json();

    const mapBounds = map.getBounds();
    const filteredFeatures = geojson.features.filter(feature => {
        const tempLayer = L.geoJson(feature);
        return mapBounds.intersects(tempLayer.getBounds());
    });

    const filteredGeoJson = {
        type: "FeatureCollection",
        features: filteredFeatures
    };

    // Add new layer to map and save reference
    const newGeoJsonLayer = L.geoJson(filteredGeoJson, {
        style: feature => styleFeature(feature, precipitationData, level),
        onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationData, level)
    });

    newGeoJsonLayer.addTo(map);
    setGeoJsonLayer(newGeoJsonLayer);
    
    // Update state
    setCurrentGeoJsonFile(geoJsonFile);
    setCurrentDataLevel(level);
    setLastBounds(mapBounds);
}

export { loadLayerByZoom };
