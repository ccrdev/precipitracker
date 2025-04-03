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
    const startDate = getCurrentStartDate();
    const endDate = getCurrentEndDate();
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

    const mapBounds = map.getBounds();
    if (
        geoJsonFile === getCurrentGeoJsonFile() &&
        level === getCurrentDataLevel() &&
        mapBounds.equals(getLastBounds() &&
        startDate === getCurrentStartDate() &&
        endDate === getCurrentEndDate()
    )
    ) {
        console.log("Same layer already loaded and bounds unchanged.");
        return;
    }

    setCurrentGeoJsonFile(geoJsonFile);
    setCurrentDataLevel(level);
    setLastBounds(mapBounds);

    const geoJsonLayer = getGeoJsonLayer();
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }

    const precipitationData = await fetchPrecipitationData(level, startDate, endDate);
    if (!precipitationData) return;

    const response = await fetch(geoJsonFile);
    const geojson = await response.json();

    const filteredFeatures = geojson.features.filter(feature => {
        const layer = L.geoJson(feature);
        const featureBounds = layer.getBounds();
        return mapBounds.intersects(featureBounds);
    });

    const filteredGeoJson = {
        type: "FeatureCollection",
        features: filteredFeatures
    };

    setGeoJsonLayer(L.geoJson(filteredGeoJson, {
        style: feature => styleFeature(feature, precipitationData, level),
        onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationData, level)
    }).addTo(map));
}

export { loadLayerByZoom };
