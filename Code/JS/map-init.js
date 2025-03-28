console.log("Initializing Precipi-Tracker...");

// Global variables
let map = null;
let geoJsonLayer = null;
let currentGeoJsonFile = null;
let currentDataLevel = null;
let currentStartDate = '2023-12-10';
let currentEndDate = '2024-12-10';

// Initialize the Leaflet map
function initializeMap() {
    const m = L.map("map").setView([37.8, -96], 4);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(m);
    return m;
}

// Load GeoJSON + precipitation data based on zoom level and date
async function loadLayerByZoom(zoom) {
    let geoJsonFile, level;

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
    console.log("Date Range:", currentStartDate, "to", currentEndDate);

    // Avoid reloading same file/level/date
    if (
        geoJsonFile === currentGeoJsonFile &&
        level === currentDataLevel
    ) {
        console.log("Same layer already loaded.");
        return;
    }

    currentGeoJsonFile = geoJsonFile;
    currentDataLevel = level;

    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
        geoJsonLayer = null;
    }

    const precipitationData = await fetchPrecipitationData(level, currentStartDate, currentEndDate);
    if (!precipitationData) return;

    const geojson = await fetch(geoJsonFile).then(res => res.json());

    geoJsonLayer = L.geoJson(geojson, {
        style: feature => styleFeature(feature, precipitationData, level),
        onEachFeature: (feature, layer) =>
            bindPopupToFeature(feature, layer, precipitationData, level)
    }).addTo(map);
}

// Fetch precipitation data from the API based on the level and date range
async function fetchPrecipitationData(level = "county", start = "2023-12-10", end = "2024-12-10") {
    const url = `PHP/api.php?action=get_precipitation&level=${level}&start=${start}&end=${end}`;
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

// Style map features based on precipitation values
function styleFeature(feature, precipitationData, level) {
    let value = 0;

    if (level === "county") {
        const stateFIPS = feature.properties.STATEFP;
        const countyFIPS = feature.properties.COUNTYFP?.padStart(3, '0');
        const record = precipitationData.find(
            r => String(r.state_id).padStart(2, '0') === stateFIPS &&
                 String(r.county_id).padStart(3, '0') === countyFIPS
        );
        value = record ? record.precipitation_amount : 0;

    } else if (level === "state") {
        const stateFIPS = feature.properties.STATEFP;
        const record = precipitationData.find(
            r => String(r.state_id).padStart(2, '0') === stateFIPS
        );
        value = record ? record.precipitation_amount : 0;

    } else if (level === "region") {
        const regionGEOID = feature.properties.GEOID;
        const record = precipitationData.find(
            r => String(r.region_id).padStart(2, '0') === String(regionGEOID)
        );
        value = record ? record.precipitation_amount : 0;
    }

    const color = value > 2.0 ? "#00429d" :
                  value > 1.0 ? "#4771b2" :
                  value > 0.5 ? "#73a2c6" :
                  value > 0.25 ? "#a5d5d8" :
                  "#dceebb";

    return { color: "#555", weight: 1, fillOpacity: 0.7, fillColor: color };
}

// Bind popup info
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

    layer.bindPopup(`
        <strong>${label}</strong><br>
        <strong>Precipitation:</strong> ${precipitation}
    `);
}

// Main entry point
function main() {
    map = initializeMap();

    map.whenReady(() => {
        loadLayerByZoom(map.getZoom());
    });

    map.on("zoomend moveend", () => {
        loadLayerByZoom(map.getZoom());
    });

    // Listen for form submission to update date range
    const form = document.getElementById("main");
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const startInput = document.getElementById("start-date").value;
        const endInput = document.getElementById("end-date").value;

        if (!startInput || !endInput) {
            alert("Please select both start and end dates.");
            return;
        }

        currentStartDate = startInput;
        currentEndDate = endInput;

        // Force reload current layer with new dates
        currentGeoJsonFile = null;
        loadLayerByZoom(map.getZoom());
    });
}

// Start the app
main();
