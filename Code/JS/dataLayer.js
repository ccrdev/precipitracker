// dataLayer.js
import {
    getMap,
    setGeoJsonLayer,
    setCurrentGeoJsonFile,
    setCurrentDataLevel,
    setLastBounds,
    getLastBounds,
    getCurrentGeoJsonFile,
    getCurrentDataLevel,
    getGeoJsonLayer
} from './map.js';
import { fetchPrecipitationData } from './api.js';
import { styleFeature, bindPopupToFeature } from './utils.js';
import { getCurrentStartDate, getCurrentEndDate } from './date.js';

// Store last loaded dates
let lastStartDate = null;
let lastEndDate = null;

async function loadLayerOnEvent() {
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
    const boundsUnchanged = mapBounds.equals(getLastBounds());
    const zoomAndLevelUnchanged = (geoJsonFile === getCurrentGeoJsonFile() && level === getCurrentDataLevel());
    const datesUnchanged = (startDate === lastStartDate && endDate === lastEndDate);

    // Check if the view (bounds, zoom/level) and dates are all unchanged
    if (boundsUnchanged && zoomAndLevelUnchanged && datesUnchanged) {
        console.log("Same layer already loaded, bounds, and dates unchanged.");
        return;
    }

    // Update stored state
    setCurrentGeoJsonFile(geoJsonFile);
    setCurrentDataLevel(level);
    setLastBounds(mapBounds);
    lastStartDate = startDate;
    lastEndDate = endDate;

    // Clear existing layer
    const geoJsonLayer = getGeoJsonLayer();
    if (geoJsonLayer && map.hasLayer(geoJsonLayer)) {
        map.removeLayer(geoJsonLayer);
    }
    setGeoJsonLayer(null);

    // Fetch precipitation data with current date range
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

    const newLayer = L.geoJson(filteredGeoJson, {
        style: feature => styleFeature(feature, precipitationData, level),
        onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationData, level)
    });

    setGeoJsonLayer(newLayer.addTo(map));
}

export { loadLayerOnEvent };
