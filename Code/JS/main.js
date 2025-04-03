// main.js
import { initializeMap } from './map.js';
import { loadLayerByZoom } from './dataLayer.js';
import { validateDates, setCurrentStartDate, setCurrentEndDate } from './date.js';


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
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const startInput = document.getElementById("start-date").value;
        const endInput = document.getElementById("end-date").value;

        // Validate dates
        const validationResult = validateDates(startInput, endInput);
        if (!validationResult.isValid) {
            alert(validationResult.message);
            return;
        }

        setCurrentStartDate(startInput);
        setCurrentEndDate(endInput);

        // Force reload with new dates
        loadLayerByZoom();
    });
}
main();
