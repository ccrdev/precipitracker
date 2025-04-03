// main.js
import { initializeMap } from './map.js';
import { loadLayerByZoom } from './dataLayer.js';

let currentStartDate = '2023-12-10';
let currentEndDate = '2024-12-10';

function main() {
    console.log("Initializing Precipi-Tracker...");
    const map = initializeMap();

    // Load the initial layer based on the default zoom level
    map.whenReady(() => loadLayerByZoom());

    // Listen for zoom and move events to load the appropriate layer
    map.on("zoomend", loadLayerByZoom);
    map.on("moveend", loadLayerByZoom);

    // Handle form submission for date range updates
    const form = document.getElementById("main");
    form.addEventListener("submit", function(e) {
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
        loadLayerByZoom();
    });
}
main();
