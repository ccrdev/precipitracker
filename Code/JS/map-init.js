console.log("Initializing Precipi-Tracker...");

// Initialize the map
function initializeMap() {
    const map = L.map("map");

    // Default tile for the map
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    return map;
}

// Handle user geolocation
function enableUserLocation(map) {
    map.locate({ setView: true, maxZoom: 7 });

    map.on("locationfound", (e) => {
        const radius = e.accuracy / 2;
        L.marker(e.latlng).addTo(map);
        L.circle(e.latlng, radius).addTo(map);
    });

    map.on("locationerror", (e) => {
        alert(e.message);
        map.setView([37.8, -96], 4); // Default view if geolocation fails
    });
}

// Fetch precipitation data and convert it into a lookup table
async function fetchPrecipitationData() {
    return fetch("PHP/api.php?action=get_precipitation")
        .then(response => response.json())
        .then(precipitationData => {
            console.log("Precipitation Data:", precipitationData);

            if (precipitationData.status !== "success") {
                console.error("Error fetching precipitation data:", precipitationData.message);
                return null;
            }

            // Convert precipitation data into a lookup map for O(1) access
            const precipitationMap = new Map();
            precipitationData.data.forEach(record => {
                const key = `${String(record.state_id).padStart(2, '0')}-${String(record.county_id).padStart(3, '0')}`;
                precipitationMap.set(key, record.precipitation_amount);
            });

            console.log("Precomputed Precipitation Map:", precipitationMap);
            return precipitationMap;
        })
        .catch(error => {
            console.error("Error fetching precipitation data:", error);
            return null;
        });
}

// Load GeoJSON and apply precipitation data
function loadGeoJSON(map, precipitationMap) {
    fetch("./US_Counties.geojson")
        .then(response => response.json())
        .then(geojsonData => {
            console.log("GeoJSON Data Loaded:", geojsonData);

            L.geoJson(geojsonData, {
                style: feature => styleFeature(feature, precipitationMap),
                onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationMap)
            }).addTo(map);
        })
        .catch(error => console.error("Error loading GeoJSON:", error));
}

// Define styles based on precipitation data (in inches)
function styleFeature(feature, precipitationMap) {
    if (!feature.properties || !feature.properties.STATEFP || !feature.properties.COUNTYFP) {
        return { color: "gray", weight: 1, fillOpacity: 0.3, fillColor: "gray" };
    }

    // Format FIPS codes
    const stateFIPS = feature.properties.STATEFP;
    const countyFIPS = feature.properties.COUNTYFP.padStart(3, '0');
    const key = `${stateFIPS}-${countyFIPS}`;

    // Get precipitation data using O(1) lookup
    const precipitation = precipitationMap.get(key) || 0;

    // Assign color based on precipitation amount
    const color = precipitation > 2.0 ? "#00429d" :
                  precipitation > 1.0 ? "#4771b2" :
                  precipitation > 0.5 ? "#73a2c6" :
                  precipitation > 0.25 ? "#a5d5d8" : "#dceebb";

    return { color: "#555", weight: 1, fillOpacity: 0.7, fillColor: color };
}

// Bind popups to show precipitation information (in inches)
function bindPopupToFeature(feature, layer, precipitationMap) {
    const stateFIPS = feature.properties.STATEFP || "Unknown";
    const countyFIPS = feature.properties.COUNTYFP ? feature.properties.COUNTYFP.padStart(3, '0') : "Unknown";
    const key = `${stateFIPS}-${countyFIPS}`;

    // Get precipitation data using O(1) lookup
    const precipitation = precipitationMap.get(key) ? Number(precipitationMap.get(key)).toFixed(2) : "No data";

    // Bind a popup with precipitation details
    layer.bindPopup(`
        <strong>County:</strong> ${feature.properties.NAME}<br>
        <strong>State FIPS:</strong> ${stateFIPS}<br>
        <strong>County FIPS:</strong> ${countyFIPS}<br>
        <strong>Precipitation:</strong> ${precipitation} inches
    `);
}

// Main execution function
async function main() {
    const map = initializeMap();
    enableUserLocation(map);

    console.log("Fetching precipitation data...");
    const precipitationMap = await fetchPrecipitationData();

    if (precipitationMap) {
        loadGeoJSON(map, precipitationMap);
    }
}

// Execute main function
main();
