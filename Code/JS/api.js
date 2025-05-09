// api.js
import {getCurrentEndDate, getCurrentStartDate, validateDates} from "./date.js";

// Fetches precipitation data from the API based on the level (county, state, region) and date range
export async function fetchPrecipitationData(level = "county", start = "2023-12-10", end = "2024-12-10") {
    // Validate the dates before making the API call
    const validationResult = validateDates(start, end);
    if (!validationResult.isValid) {
        console.error(validationResult.message);
        return null;
    }

    // Ensure the level is one of the expected values
    const validLevels = ["county", "state", "region"];
    if (!validLevels.includes(level)) {
        console.error(`Invalid level: ${level}. Expected one of ${validLevels.join(", ")}.`);
        return null;
    }

    // Use default dates if not provided
    if (!start) {
        start = getCurrentStartDate();
    }
    if (!end) {
        end = getCurrentEndDate();
    }

    // Set Start and End dates
    start = getCurrentStartDate();
    end = getCurrentEndDate();


    // Construct the URL for the API request
    const url = `PHP/api.php?action=get_precipitation&level=${level}&start=${start}&end=${end}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status !== "success") {
            console.error("Error fetching data:", data.message);
            return null;
        }
        console.log("Precipitation data:", data.data);
        return data.data || [];
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}
