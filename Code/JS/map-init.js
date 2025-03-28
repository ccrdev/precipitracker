console.log("Initializing Precipi-Tracker...");

// Global variables
let map = null;                    // Leaflet map instance
let geoJsonLayer = null;          // Current GeoJSON layer on the map
let currentGeoJsonFile = null;    // Currently loaded GeoJSON filename
let currentDataLevel = null;      // Current level: 'county', 'state', or 'region'

// Initialize the Leaflet map
function initializeMap() {
    const m = L.map("map").setView([37.8, -96], 4); // Center of US

    // Load OpenStreetMap tile layer
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(m);

    return m;
}

// Load GeoJSON + precipitation data based on zoom level
async function loadLayerByZoom(zoom) {
    let geoJsonFile, level;

    // Determine file and data level based on zoom level
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

    console.log("Zoom:", zoom, "| GeoJSON:", geoJsonFile, "| Level:", level);

    // Avoid reloading the same layer
    if (geoJsonFile === currentGeoJsonFile && level === currentDataLevel) {
        console.log("Same layer already loaded.");
        return;
    }

    // Track current layer
    currentGeoJsonFile = geoJsonFile;
    currentDataLevel = level;

    // Remove existing GeoJSON layer from the map
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
        geoJsonLayer = null;
    }

    // Fetch precipitation data for the given level
    const precipitationData = await fetchPrecipitationData(level);
    if (!precipitationData) {
        console.error("No precipitation data loaded.");
        return;
    }

    // Fetch and parse the appropriate GeoJSON file
    const geojson = await fetch(geoJsonFile).then(res => res.json());

    // Add GeoJSON layer with styling and popups
    geoJsonLayer = L.geoJson(geojson, {
        style: feature => styleFeature(feature, precipitationData, level),
        onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationData, level)
    }).addTo(map);
}

// Fetch precipitation data from the API based on the level (county/state/region)
async function fetchPrecipitationData(level = "county") {
    const url = `PHP/api.php?action=get_precipitation&level=${level}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "success") {
            console.error("Error fetching data:", data.message);
            return null;
        }

        return data.data;
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

// Style map features based on precipitation values and zoom level
function styleFeature(feature, precipitationData, level) {
    let value = 0;

    if (level === "county") {
        // Match using state + county FIPS codes
        const stateFIPS = feature.properties.STATEFP;
        const countyFIPS = feature.properties.COUNTYFP?.padStart(3, '0');

        const record = precipitationData.find(
            r => String(r.state_id).padStart(2, '0') === stateFIPS &&
                 String(r.county_id).padStart(3, '0') === countyFIPS
        );

        value = record ? record.precipitation_amount : 0;

    } else if (level === "state") {
        // Match using state FIPS code
        const stateFIPS = feature.properties.STATEFP;

        const record = precipitationData.find(
            r => String(r.state_id).padStart(2, '0') === stateFIPS
        );

        value = record ? record.precipitation_amount : 0;

    } else if (level === "region") {
        // Match using GEOID in the GeoJSON with region_id from DB
        const regionGEOID = feature.properties.GEOID;

        const record = precipitationData.find(
            r => String(r.region_id).padStart(2, '0') === String(regionGEOID)
        );

        value = record ? record.precipitation_amount : 0;
    }

    // Determine fill color based on value thresholds
    const color = value > 2.0 ? "#00429d" :
                  value > 1.0 ? "#4771b2" :
                  value > 0.5 ? "#73a2c6" :
                  value > 0.25 ? "#a5d5d8" :
                  "#dceebb";

    return { color: "#555", weight: 1, fillOpacity: 0.7, fillColor: color };
}

// Bind popup info to each map feature
function bindPopupToFeature(feature, layer, precipitationData, level) {
    let label = "No data";
    let value = null;

    if (level === "county") {
        const stateFIPS = feature.properties.STATEFP;
        const countyFIPS = feature.properties.COUNTYFP?.padStart(3, '0');

        const record = precipitationData.find(
            r => String(r.state_id).padStart(2, '0') === stateFIPS &&
                 String(r.county_id).padStart(3, '0') === countyFIPS
        );

        value = record?.precipitation_amount;
        label = `${feature.properties.NAME} County`;

    } else if (level === "state") {
        const stateFIPS = feature.properties.STATEFP;

        const record = precipitationData.find(
            r => String(r.state_id).padStart(2, '0') === stateFIPS
        );

        value = record?.precipitation_amount;
        label = feature.properties.NAME + " (State)";

    } else if (level === "region") {
        const regionGEOID = feature.properties.GEOID;

        const record = precipitationData.find(
            r => String(r.region_id).padStart(2, '0') === String(regionGEOID)
        );

        value = record?.precipitation_amount;
        label = feature.properties.name || `Region ${regionGEOID}`;
    }

    const precipitation = value !== null && !isNaN(value)
        ? Number(value).toFixed(2) + " inches"
        : "No data";

    // Attach popup to the layer
    layer.bindPopup(`
        <strong>${label}</strong><br>
        <strong>Precipitation:</strong> ${precipitation}
    `);
}

// Main entry point
function main() {
    map = initializeMap();

    // Load initial layer on map ready
    map.whenReady(() => {
        loadLayerByZoom(map.getZoom());
    });

    // Watch for zoom/move events and reload layers
    map.on("zoomend moveend", () => {
        loadLayerByZoom(map.getZoom());
    });
}

// Run the app
main();
