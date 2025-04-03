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
export function styleFeature(feature, precipitationData, level) {
    const areaPrecipitationData = filterPrecipitationData(feature, precipitationData, level);
    const avgValue = computeAverageForArea(areaPrecipitationData);
    const fillColor = determineFillColor(avgValue);

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


// Determines the fill color for a feature based on the average precipitation value.
function determineFillColor(avgValue) {
    if (avgValue > 2.0) {
        return "#00429d";
    } else if (avgValue > 1.0) {
        return "#4771b2";
    } else if (avgValue > 0.5) {
        return "#73a2c6";
    } else if (avgValue > 0.25) {
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
            return `${feature.properties.NAME} County`;
        case "state":
            return `${feature.properties.NAME} State`;
        case "region":
            return feature.properties.name || `Region ${feature.properties.NAME}`;
        default:
            return "No data";
    }
}
