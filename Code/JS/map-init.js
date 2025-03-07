// JS/map-init.js

console.log("Initializing Precipi-Tracker with client caching...");

// 1) Initialize Leaflet map
const map = L.map("map").setView([37.8, -96], 4);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

/**
 * Fetches the partial GeoJSON (counties with precipitation) from server,
 * with client-side caching in localStorage.
 */
async function fetchPartialGeoJsonWithCache() {
  // Define your localStorage keys and cache lifetime
  const CACHE_KEY = "partialGeoJsonData";
  const CACHE_TIME_KEY = "partialGeoJsonTime";
  const CACHE_LIFETIME_MS = 3600 * 1000; // e.g., 1 hour in milliseconds

  // Check for an existing cached item
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  if (cachedData && cachedTime) {
    const age = Date.now() - parseInt(cachedTime, 10);
    if (age < CACHE_LIFETIME_MS) {
      // Cache is still valid; parse and return the cached data
      console.log("Using cached precipitation data...");
      return JSON.parse(cachedData);
    }
  }

  // If we get here, we either have no cache or it's expired => fetch from server
  console.log("Fetching fresh precipitation data from the server...");
  const response = await fetch("PHP/api.php?action=get_precipitation_geojson");
  const result = await response.json();

  if (result.status === "success") {
    // Save the result in localStorage
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  }

  return result; // Return the fetched data
}

/**
 * Main function: Get partial GeoJSON from cache or server,
 * then add it to the map with styling and popups.
 */
fetchPartialGeoJsonWithCache()
  .then(result => {
    if (result.status !== "success") {
      console.error("Server error:", result.message);
      return;
    }

    // Partial (filtered) GeoJSON from the server
    console.log("Merged GeoJSON data:", result.data);
    const partialGeoJson = result.data;

    // Define a style function based on precipitation_amount
    function styleFeature(feature) {
      const precip = feature.properties.precipitation_amount || 0;
      let color;
      if (precip > 2.0) {
        color = "#00429d"; // dark
      } else if (precip > 1.0) {
        color = "#4771b2";
      } else if (precip > 0.5) {
        color = "#73a2c6";
      } else if (precip > 0.25) {
        color = "#a5d5d8";
      } else {
        color = "#dceebb";
      }

      return {
        color: "#555",
        weight: 1,
        fillOpacity: 0.7,
        fillColor: color
      };
    }

    // Define popup logic
    function onEachFeature(feature, layer) {
      const props = feature.properties;
      layer.bindPopup(`
        <strong>County:</strong> ${props.NAME}<br>
        <strong>State FIPS:</strong> ${props.STATEFP}<br>
        <strong>County FIPS:</strong> ${props.COUNTYFP}<br>
        <strong>Precipitation:</strong> ${
          props.precipitation_amount !== null
            ? props.precipitation_amount.toFixed(2) + " inches"
            : "No data"
        }
      `);
    }

    // Add the partial GeoJSON to the map
    L.geoJson(partialGeoJson, {
      style: styleFeature,
      onEachFeature: onEachFeature
    }).addTo(map);
  })
  .catch(error => {
    console.error("Error loading precipitation data:", error);
  });
