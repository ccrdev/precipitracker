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

// Modified by Austin H 3/21/2025
// Fetch precipitation data
async function fetchPrecipitationData() {
    //Handles the date range when the form is submitted, shouldnt affect first load
    if (startDate && endDate) {
        const url = `PHP/api.php?action=get_precipitation&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;

        return fetch(url)
        .then(response => response.json())
        .then(precipitationData => {
            console.log("Precipitation Data:", precipitationData);

            if (precipitationData.status !== "success") {
                console.error("Error fetching precipitation data:", precipitationData.message);
                return null;
            }

            return precipitationData.data; // Return the data for further processing
        })
        .catch(error => {
            console.error("Error fetching precipitation data:", error);
            return null;
        })
    } else {
        //Normal code we had before
    return fetch("PHP/api.php?action=get_precipitation")
        .then(response => response.json())
        .then(precipitationData => {
            console.log("Precipitation Data:", precipitationData);

            if (precipitationData.status !== "success") {
                console.error("Error fetching precipitation data:", precipitationData.message);
                return null;
            }

            return precipitationData.data; // Return the data for further processing
        })
        .catch(error => {
            console.error("Error fetching precipitation data:", error);
            return null;
        });
    }
}

// Load GeoJSON and apply precipitation data
function loadGeoJSON(map, precipitationData) {
    fetch("./US_Counties.geojson")
        .then(response => response.json())
        .then(geojsonData => {
            console.log("GeoJSON Data Loaded:", geojsonData);

            L.geoJson(geojsonData, {
                style: feature => styleFeature(feature, precipitationData),
                onEachFeature: (feature, layer) => bindPopupToFeature(feature, layer, precipitationData)
            }).addTo(map);
        })
        .catch(error => console.error("Error loading GeoJSON:", error));
}

// Added by Austin H 3/21/2025
// Add an event listener to the form
document.getElementById("date-range-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the form from reloading the page

    // Get the selected start and end dates
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    if (!startDate || !endDate) {
        alert("Please select both a start and end date.");
        return;
    }

    console.log(`Fetching data for date range: ${startDate} to ${endDate}`);

    // Fetch precipitation data with the date range
    const precipitationData = await fetchPrecipitationData(startDate, endDate);

    //Not certain if needed
    if (precipitationData) {
        // Clear the existing map layers (if needed)
        map.eachLayer((layer) => {
            if (layer instanceof L.GeoJSON || layer instanceof L.Marker || layer instanceof L.Circle) {
                map.removeLayer(layer);
            }
        });

        // Reload GeoJSON with the new precipitation data
        loadGeoJSON(map, precipitationData);
    }
});

// Define styles based on precipitation data (in inches)
function styleFeature(feature, precipitationData) {
    console.log("Feature Properties:", feature.properties);

    if (!feature.properties || !feature.properties.STATEFP || !feature.properties.COUNTYFP) {
        console.warn("Missing STATEFP or COUNTYFP:", feature);
        return { color: "gray", weight: 1, fillOpacity: 0.3, fillColor: "gray" };
    }

    // Extract STATEFP and COUNTYFP
    const stateFIPS = feature.properties.STATEFP;
    const countyFIPS = feature.properties.COUNTYFP.padStart(3, '0');

    console.log("Processed STATEFP:", stateFIPS, "Processed COUNTYFP:", countyFIPS);

    // Find matching precipitation data
    const precipitationRecord = precipitationData.find(
        record => String(record.state_id).padStart(2, '0') === stateFIPS &&
            String(record.county_id).padStart(3, '0') === countyFIPS
    );

    console.log("Matched Precipitation Record:", precipitationRecord);

    // Assign color based on precipitation amount (in inches)
    const precipitation = precipitationRecord ? precipitationRecord.precipitation_amount : 0;
    const color = precipitation > 2.0 ? "#00429d" :  // Dark blue
                  precipitation > 1.0 ? "#4771b2" :  // Medium blue
                  precipitation > 0.5 ? "#73a2c6" :  // Light blue
                  precipitation > 0.25 ? "#a5d5d8" :  // Pale blue
                  "#dceebb";  // Very light blue

    return { color: "#555", weight: 1, fillOpacity: 0.7, fillColor: color };
}

// Bind popups to show precipitation information (in inches)
function bindPopupToFeature(feature, layer, precipitationData) {
    const stateFIPS = feature.properties.STATEFP || "Unknown";
    const countyFIPS = feature.properties.COUNTYFP ? feature.properties.COUNTYFP.padStart(3, '0') : "Unknown";

    // Find matching precipitation data
    const precipitationRecord = precipitationData.find(
        record => String(record.state_id).padStart(2, '0') === stateFIPS &&
            String(record.county_id).padStart(3, '0') === countyFIPS
    );

    // Ensure precipitation amount is a valid number
    const precipitation = precipitationRecord && !isNaN(precipitationRecord.precipitation_amount)
        ? Number(precipitationRecord.precipitation_amount).toFixed(2)
        : "No data";

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
    const precipitationData = await fetchPrecipitationData();

    if (precipitationData) {
        loadGeoJSON(map, precipitationData);
    }
}

// Execute main function
main();
