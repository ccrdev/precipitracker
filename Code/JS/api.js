// api.js

// Fetches precipitation data from the API based on the level (county, state, region) and date range
export async function fetchPrecipitationData(level = "county", start = "2023-12-10", end = "2024-12-10") {
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
