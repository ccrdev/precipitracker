// main.js

/**
 * @fileoverview
 * Main entry point for the Precipi-Tracker web application.
 * 
 * This script:
 * - Initializes the Leaflet map
 * - Loads the appropriate precipitation layer based on the current view and zoom level
 * - Listens for map interaction events (zoom/pan) to update the displayed data
 * - Handles user form submissions to update the precipitation date range
 */

/**
 * Initializes and returns the Leaflet map instance.
 * Responsible for creating the base map with tiles and default settings.
 */
import { initializeMap } from './map.js';

/**
 * Loads precipitation data and displays it as a GeoJSON layer on the map.
 * Automatically determines the geographic level (county/state/region) based on zoom.
 */
import { loadLayerOnEvent } from './dataLayer.js';

/**
 * Functions for handling the global date range state and validation.
 * - setCurrentStartDate: updates the start date in shared state.
 * - setCurrentEndDate: updates the end date in shared state.
 * - validateDates: checks if a date range is valid and within allowed bounds.
 */
import {
    setCurrentEndDate,
    setCurrentStartDate,
    validateDates
} from './date.js';

/**
 * Entry point for the Precipi-Tracker application.
 * 
 * Initializes the Leaflet map, sets up event listeners for map movements
 * and zooming, and handles user input for custom date ranges.
 * 
 * @function main
 */
function main() {
    console.log("Initializing Precipi-Tracker...");

    // Initialize the map instance and assign to local variable (used only for event binding)
    const map = initializeMap();

    /**
     * Load the initial GeoJSON layer when the map is ready.
     * This ensures precipitation data is rendered on page load.
     */
    map.whenReady(() => loadLayerOnEvent());

    /**
     * Re-render the layer whenever the map is zoomed or panned.
     * The data granularity (county/state/region) and bounds depend on zoom level and map view.
     */
    map.on("zoomend", loadLayerOnEvent);
    map.on("moveend", loadLayerOnEvent);

    /**
     * Handles date range form submission.
     * 
     * Prevents default form submission behavior, validates user-entered dates,
     * sets the new range into shared state, and reloads the precipitation layer.
     */
    const form = document.getElementById("main");
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const startInput = document.getElementById("start-date").value;
        const endInput = document.getElementById("end-date").value;

        // Validate start and end dates
        const validationResult = validateDates(startInput, endInput);
        if (!validationResult.isValid) {
            alert(validationResult.message);
            return;
        }

        // Update global state with validated dates
        setCurrentStartDate(startInput);
        setCurrentEndDate(endInput);

        // Reload layer with the new date range
        loadLayerOnEvent();
    });
}

// Invoke the main function to start the app
main();
