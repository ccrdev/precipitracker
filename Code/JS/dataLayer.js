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
  let lastEndDate   = null;
  
  export async function loadLayerOnEvent() {
    const mapInstance     = getMap();
    const startDate       = getCurrentStartDate();
    const endDate         = getCurrentEndDate();
    const currentZoom     = mapInstance.getZoom();
  
    // Choose GeoJSON file and dataLevel by zoom level
    let geoJsonFilePath, dataLevel;
    if (currentZoom >= 8) {
      geoJsonFilePath = "./US_Counties.geojson";
      dataLevel       = "county";
    } else if (currentZoom >= 5) {
      geoJsonFilePath = "./US_States.geojson";
      dataLevel       = "state";
    } else {
      geoJsonFilePath = "./US_Regions.geojson";
      dataLevel       = "region";
    }
  
    const mapBounds = mapInstance.getBounds();
    const viewUnchanged =
      mapBounds.equals(getLastBounds()) &&
      geoJsonFilePath === getCurrentGeoJsonFile() &&
      dataLevel === getCurrentDataLevel() &&
      startDate === lastStartDate &&
      endDate   === lastEndDate;
  
    if (viewUnchanged) {
      console.log("View, zoom/level, and dates unchanged; skipping reload.");
      return;
    }
  
    // Update stored state
    setCurrentGeoJsonFile(geoJsonFilePath);
    setCurrentDataLevel(dataLevel);
    setLastBounds(mapBounds);
    lastStartDate = startDate;
    lastEndDate   = endDate;
  
    // Remove previous layer if present
    const previousLayer = getGeoJsonLayer();
    if (previousLayer && mapInstance.hasLayer(previousLayer)) {
      mapInstance.removeLayer(previousLayer);
    }
  
    // Fetch precipitation data and GeoJSON
    const precipitationData = await fetchPrecipitationData(dataLevel, startDate, endDate);
    if (!precipitationData) return;
  
    const geoJsonResponse = await fetch(geoJsonFilePath);
    const geoJsonObject   = await geoJsonResponse.json();
  
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
        style:        feature => styleFeature(feature, precipitationData, dataLevel, maximumAverage),
        onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationData, dataLevel)
      }
    ).addTo(mapInstance);
  
    setGeoJsonLayer(newLayer);
  }
  