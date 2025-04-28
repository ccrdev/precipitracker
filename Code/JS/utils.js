// utils.js

// Converts millimeters to inches.
export function convertToInches(mm) {
    return mm / 25.4; // 1 inch = 25.4 mm
}

// Computes the average precipitation for a set of records.
export function computeAverageForArea(records) {
    if (records.length === 0) return 0;
    const total = records.reduce((sum, record) => sum + convertToInches(Number(record.precipitation_amount)), 0);
    return total / records.length;
}

// Styles a GeoJSON feature based on average precipitation.
export function styleFeature(feature, precipitationData, level, boundaries) {
    const areaPrecipitationData = filterPrecipitationData(feature, precipitationData, level);
    const avgValue = computeAverageForArea(areaPrecipitationData);
    const fillColor = determineFillColor(avgValue, boundaries);

    return {
        color: "#555",
        weight: 1,
        fillOpacity: 0.7,
        fillColor: fillColor
    };
}

// Filters precipitation data for a specific feature based on the level.
function filterPrecipitationData(feature, precipitationData, level) {
    switch (level) {
        case "county":
            // Convert to string and pad state and county IDs for comparison
            return precipitationData.filter(r =>
                String(r.state_id).padStart(2, '0') === feature.properties.STATEFP &&
                String(r.county_id).padStart(3, '0') === feature.properties.COUNTYFP
            );
        case "state":
            // Convert to string and pad state IDs for comparison
            return precipitationData.filter(r =>
                String(r.state_id).padStart(2, '0') === feature.properties.STATEFP
            );
        case "region":
            // Assuming region_id does not need padding but ensure it is treated as a string if necessary
            return precipitationData.filter(r =>
                String(r.region_id) === feature.properties.GEOID
            );
        default:
            return [];
    }
}


// Determines the fill color for a feature based on the average precipitation value and dynamic boundaries.
export function determineFillColor(avgValue, boundaries) {
    if (avgValue > boundaries[4]) {
        return "#00429d";
    } else if (avgValue > boundaries[3]) {
        return "#4771b2";
    } else if (avgValue > boundaries[2]) {
        return "#73a2c6";
    } else if (avgValue > boundaries[1]) {
        return "#a5d5d8";
    } else {
        return "#dceebb";
    }
}

// Binds a popup to each feature with average precipitation data.
export function bindPopupToFeature(feature, layer, precipitationData, level) {
    const areaPrecipitationData = filterPrecipitationData(feature, precipitationData, level);
    const avgValue = computeAverageForArea(areaPrecipitationData);
    const label = formatFeatureLabel(feature, level);
    const precipitationText = avgValue.toFixed(2) + " inches";

    layer.bindPopup(`
        <strong>${label}</strong><br>
        <strong>Average Precipitation:</strong> ${precipitationText}
    `);
}

// Formats a label for a feature based on its level.
function formatFeatureLabel(feature, level) {
    switch (level) {
        case "county":
            return `${feature.properties.NAME} (County)`;
        case "state":
            return `${feature.properties.NAME} (State)`;
        case "region":
            return feature.properties.name || `${feature.properties.NAME} (Region)`;
        default:
            return "No data";
    }
}

// Calculates dynamic boundary values for the color ranges based on min and max precipitation values.
export function calculateDynamicBoundaries(minValue, maxValue) {
    const range = maxValue - minValue;
    return [
        minValue,
        minValue + range * 0.25,
        minValue + range * 0.5,
        minValue + range * 0.75,
        maxValue
    ];
}

// Updates the legend based on the dynamic boundaries
// Basic code which interferes with the legend design 
export function updateLegend(boundaries) {
    const legend = document.getElementById("legend");
    legend.innerHTML = ""; // Clear the existing legend

    const colors = ["#dceebb", "#a5d5d8", "#73a2c6", "#4771b2", "#00429d"];
    for (let i = 0; i < boundaries.length - 1; i++) {
        const legendItem = document.createElement("div");
        legendItem.innerHTML = `
            <span style="background-color: ${colors[i]}; width: 20px; height: 20px; display: inline-block;"></span>
            ${boundaries[i].toFixed(2)} - ${boundaries[i + 1].toFixed(2)} inches
        `;
        legend.appendChild(legendItem);
    }
}
