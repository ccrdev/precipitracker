// api.js

/**
 * @fileoverview
 * Provides API integration for fetching precipitation data from the backend.
 * 
 * Responsibilities:
 * - Validate requested date ranges and geographic levels.
 * - Construct and send a request to the PHP API with query parameters.
 * - Handle response status and parse data for further map rendering.
 * 
 * Assumes:
 * - A PHP endpoint is available at `PHP/api.php?action=get_precipitation`.
 * - Valid levels include "county", "state", and "region".
 */

// Imports date-related utilities for fetching and validating date ranges
import { getCurrentEndDate, getCurrentStartDate, validateDates } from "./date.js";

/**
 * Fetches precipitation data from the backend API.
 * 
 * @param {string} level - Geographic level of data to fetch ("county", "state", or "region"). Defaults to "county".
 *                          If an invalid level is provided, the function will log an error and return null.
 * @param {string} start - Start date in YYYY-MM-DD format. Defaults to current start date.
 * @param {string} end   - End date in YYYY-MM-DD format. Defaults to current end date.
 * 
 * @returns {Promise<Array|null>} Returns an array of precipitation records or null on failure.
 */
export async function fetchPrecipitationData(level = "county", start, end) {
    // Use default dates if not provided
    if (!start) start = getCurrentStartDate();
    if (!end) end = getCurrentEndDate();

    // Validate the resolved date range
    const validationResult = validateDates(start, end);
    if (!validationResult.isValid) {
        console.error(`[fetchPrecipitationData] Invalid date range: ${validationResult.message}`);
        return null;
    }

    // Ensure the level is valid
    const validLevels = ["county", "state", "region"];
    if (!validLevels.includes(level)) {
        console.error(`[fetchPrecipitationData] Invalid level: "${level}". Must be one of: ${validLevels.join(", ")}`);
        return null;
    }

    // Build the API request URL with query parameters
    const url = `PHP/api.php?action=get_precipitation&level=${level}&start=${start}&end=${end}`;

    try {
        // Make the request and parse the response
        const response = await fetch(url);
        const data = await response.json();

        // Check response status
        if (data.status !== "success") {
            console.error(`[fetchPrecipitationData] API returned an error: ${data.message}`);
            return null;
        }

        // Return the fetched data or an empty array
        console.log("[fetchPrecipitationData] Fetched precipitation data:", data.data);
        return data.data || [];
    } catch (err) {
        // Handle network or fetch errors
        console.error("[fetchPrecipitationData] Network or fetch error:", err);
        return null;
    }
}
