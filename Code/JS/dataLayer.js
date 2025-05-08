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
} from "./map.js";

import { fetchPrecipitationData } from "./api.js";
import {
  styleFeature,
  bindPopupToFeature,
  filterPrecipitationData,
  computeAverageForArea
} from "./utils.js";
import { getCurrentStartDate, getCurrentEndDate } from "./date.js";

let lastStartDate = null;
let lastEndDate = null;
let isLayerUpdating = false; // Flag to prevent concurrent layer updates

export async function loadLayerOnEvent() {
  // If a layer is already being updated, skip this request to prevent stacking
  if (isLayerUpdating) return;

  isLayerUpdating = true; // Set the flag to indicate we're updating the layer

  const mapInstance = getMap();
  const startDate = getCurrentStartDate();
  const endDate = getCurrentEndDate();
  const currentZoom = mapInstance.getZoom();

  // Choose GeoJSON file and dataLevel by zoom level
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

  const mapBounds = mapInstance.getBounds();
  const viewUnchanged =
    mapBounds.equals(getLastBounds()) &&
    geoJsonFilePath === getCurrentGeoJsonFile() &&
    dataLevel === getCurrentDataLevel() &&
    startDate === lastStartDate &&
    endDate === lastEndDate;

  if (viewUnchanged) {
    console.log("View, zoom/level, and dates unchanged; skipping reload.");
    isLayerUpdating = false; // Reset flag after operation
    return;
  }

  // Update stored state
  setCurrentGeoJsonFile(geoJsonFilePath);
  setCurrentDataLevel(dataLevel);
  setLastBounds(mapBounds);
  lastStartDate = startDate;
  lastEndDate = endDate;

  // Remove previous layer if present
  const previousLayer = getGeoJsonLayer();
  if (previousLayer && mapInstance.hasLayer(previousLayer)) {
    mapInstance.removeLayer(previousLayer);
  }

  // Clear the geoJsonLayer in the map.js state
  setGeoJsonLayer(null); // Ensures the previous layer is not lingering

  // Fetch precipitation data and GeoJSON
  const precipitationData = await fetchPrecipitationData(dataLevel, startDate, endDate);
  if (!precipitationData) {
    isLayerUpdating = false; // Reset flag after operation
    return;
  }

  const geoJsonResponse = await fetch(geoJsonFilePath);
  const geoJsonObject = await geoJsonResponse.json();

  // Keep only features visible in current map bounds
  const visibleFeatures = geoJsonObject.features.filter(feature => {
    const featureBounds = L.geoJson(feature).getBounds();
    return mapBounds.intersects(featureBounds);
  });

  // Compute the maximum average precipitation among visible features
  const maximumAverage = visibleFeatures.length
    ? Math.max(
      ...visibleFeatures.map(feature => {
        const records = filterPrecipitationData(feature, precipitationData, dataLevel);
        return computeAverageForArea(records);
      })
    )
    : 0;

  // Create and add the new layer
  const newLayer = L.geoJSON(
    { type: "FeatureCollection", features: visibleFeatures },
    {
      style: feature => styleFeature(feature, precipitationData, dataLevel, maximumAverage),
      onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationData, dataLevel)
    }
  ).addTo(mapInstance);

  // Set the new layer in the map state
  setGeoJsonLayer(newLayer);

  isLayerUpdating = false; // Reset flag after operation is complete
}
