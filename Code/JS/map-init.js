console.log("Initializing Precipi-Tracker...");

// Global variables
let map = null;
let geoJsonLayer = null;
let currentGeoJsonFile = null;
let currentDataLevel = null;
let lastBounds = null;
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
async function loadLayerByZoom() {
    let geoJsonFile, level;

    const zoom = map.getZoom();  // Get the current zoom level

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

    // Check if the file/level hasn't changed and the bounds are the same as last time
    const mapBounds = map.getBounds();
    if (
        geoJsonFile === currentGeoJsonFile &&
        level === currentDataLevel &&
        mapBounds.equals(lastBounds)  // Only return if bounds are the same
    ) {
        console.log("Same layer already loaded and bounds unchanged.");
        return;  // No need to reload if everything is the same
    }

    // Clear the current layer (always reset it when bounds or zoom level change)
    currentGeoJsonFile = geoJsonFile;
    currentDataLevel = level;
    lastBounds = mapBounds;  // Update last known bounds

    // Ensure the previous geoJsonLayer is removed
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);  // Properly clear out the existing layer
        geoJsonLayer = null;
    }

    // Fetch precipitation data
    const precipitationData = await fetchPrecipitationData(level, currentStartDate, currentEndDate);
    if (!precipitationData) return;

    // Fetch GeoJSON data
    const geojson = await fetch(geoJsonFile).then(res => res.json());

    // Filter out features that are outside the map bounds
    const filteredFeatures = geojson.features.filter(feature => {
        const layer = L.geoJson(feature);  // Create temporary layer for the feature
        const featureBounds = layer.getBounds();  // Get the feature's bounds
        return mapBounds.intersects(featureBounds);  // Only keep features within the visible bounds
    });

    // Construct a new "FeatureCollection" with only the filtered features
    const filteredGeoJson = {
        type: "FeatureCollection",
        features: filteredFeatures
    };

    // Filter the precipitation data for the visible features
    let validFeatureIds = new Set();

    if (level === "county") {
        // Filter based on county (stateFIPS + countyFIPS)
        validFeatureIds = new Set(
            filteredFeatures.map(f => `${f.properties.STATEFP}-${f.properties.COUNTYFP?.padStart(3, '0')}`)
        );
    } else if (level === "state") {
        // Filter based on state (stateFIPS)
        validFeatureIds = new Set(
            filteredFeatures.map(f => f.properties.STATEFP)
        );
    } else if (level === "region") {
        // Filter based on region (GEOID or region_id)
        validFeatureIds = new Set(
            filteredFeatures.map(f => f.properties.GEOID)
        );
    }

    const filteredPrecipitationData = precipitationData.filter(record => {
        let key = null;

        if (level === "county") {
            key = String(record.state_id).padStart(2, '0') + "-" + String(record.county_id).padStart(3, '0');
        } else if (level === "state") {
            key = String(record.state_id).padStart(2, '0');
        } else if (level === "region") {
            key = String(record.region_id);
        }

        return validFeatureIds.has(key);
    });

    // Add the filtered GeoJSON data to the map
    geoJsonLayer = L.geoJson(filteredGeoJson, {
        style: feature => styleFeature(feature, filteredPrecipitationData, level),
        onEachFeature: (feature, layer) =>
            bindPopupToFeature(feature, layer, filteredPrecipitationData, level)
    }).addTo(map);
}

// Function to compute average precipitation for a given set of records (county, state, region)
function computeAverageForArea(records) {
    // Check if records are empty
    if (records.length === 0) return 0;
    // Calculate the average precipitation
    const total = records.reduce((sum, record) => sum + (convertToInches(Number(record.precipitation_amount)) || 0), 0);
    // Return the average value
    return total / records.length;
}

// Function to convert precipitation from mm to inches
function convertToInches(mm) {
    return mm / 25.4;  // 1 inch = 25.4 mm
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

        // Directly return the records for further processing
        console.log("Precipitation data:", data.data);
        return data.data || [];

    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

// Bind popups and style features based on precipitation values
function styleFeature(feature, precipitationData, level) {
    let areaPrecipitationData = [];
    let avgValue = 0;

    // Handle different levels (county, state, region)
    if (level === "county") {
        const stateFIPS = feature.properties.STATEFP;
        const countyFIPS = feature.properties.COUNTYFP?.padStart(3, '0');
        areaPrecipitationData = precipitationData.filter(
            r => String(r.state_id).padStart(2, '0') === stateFIPS &&
                String(r.county_id).padStart(3, '0') === countyFIPS
        );
        avgValue = computeAverageForArea(areaPrecipitationData);
    } else if (level === "state") {
        const stateFIPS = feature.properties.STATEFP;
        areaPrecipitationData = precipitationData.filter(
            r => String(r.state_id).padStart(2, '0') === stateFIPS
        );
        avgValue = computeAverageForArea(areaPrecipitationData);
    } else if (level === "region") {
        const regionGEOID = feature.properties.GEOID;
        areaPrecipitationData = precipitationData.filter(
            r => String(r.region_id) === String(regionGEOID)
        );
        avgValue = computeAverageForArea(areaPrecipitationData);
    }

    const fillColor = avgValue > 2.0 ? "#00429d" :
        avgValue > 1.0 ? "#4771b2" :
            avgValue > 0.5 ? "#73a2c6" :
                avgValue > 0.25 ? "#a5d5d8" :
                    "#dceebb";

    return { color: "#555", weight: 1, fillOpacity: 0.7, fillColor: fillColor };
}

// Bind popup to each feature with average precipitation data
function bindPopupToFeature(feature, layer, precipitationData, level) {
    let label = "No data";
    let avgValue = 0;
    let areaPrecipitationData = [];

    // Handle county level
    if (level === "county") {
        const stateFIPS = feature.properties.STATEFP;
        const countyFIPS = feature.properties.COUNTYFP?.padStart(3, '0');
        areaPrecipitationData = precipitationData.filter(
            r => String(r.state_id).padStart(2, '0') === stateFIPS &&
                String(r.county_id).padStart(3, '0') === countyFIPS
        );
        // Compute average for the county
        avgValue = computeAverageForArea(areaPrecipitationData);
        label = `${feature.properties.NAME} County`;

        // Handle state level
    } else if (level === "state") {
        const stateFIPS = feature.properties.STATEFP;
        areaPrecipitationData = precipitationData.filter(
            r => String(r.state_id).padStart(2, '0') === stateFIPS
        );
        // Compute average for the state
        avgValue = computeAverageForArea(areaPrecipitationData);
        label = feature.properties.NAME + " (State)";

        // Handle region level
    } else if (level === "region") {
        const regionGEOID = feature.properties.GEOID;
        areaPrecipitationData = precipitationData.filter(
            r => String(r.region_id) === String(regionGEOID)
        );
        // Compute average for the region
        avgValue = computeAverageForArea(areaPrecipitationData);
        label = feature.properties.name || `Region ${regionGEOID}`;
    }

    // Format the average precipitation value
    const precipitation = avgValue !== null && !isNaN(avgValue)
        ? avgValue.toFixed(2) + " inches"
        : "No data";

    // Bind the popup to the layer
    layer.bindPopup(`
        <strong>${label}</strong><br>
        <strong>Average Precipitation:</strong> ${precipitation}
    `);
}

// Main entry point
function main() {
    // Initialize the map
    map = initializeMap();

    // Load the initial layer based on the default zoom level
    map.whenReady(() => {
        loadLayerByZoom();
    });

    // Listen for zoom and move events to load the appropriate layer
    map.on("moveend", () => {
        console.log("Map moved, loading new layer based on updated bounds...");
        loadLayerByZoom();  // Trigger reloading layer on move
    });

    map.on("zoomend", () => {
        console.log("Zoom level changed, loading new layer...");
        loadLayerByZoom();  // Trigger reloading layer on zoom
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

        if (new Date(startInput) > new Date(endInput)) {
            alert("Start date cannot be after end date.");
            return;
        }

        if (new Date(startInput) < new Date("2023-12-10") || new Date(endInput) > new Date("2024-12-10")) {
            alert("Please select dates between 2023-12-10 and 2024-12-10.");
            return;
        }

        currentStartDate = startInput;
        currentEndDate = endInput;

        // Force reload with new dates
        currentGeoJsonFile = null;
        loadLayerByZoom();
    });
}

// Start the app
main();
