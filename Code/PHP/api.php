<?php
/**
 * File: api.php
 * 
 * This implements a partial GeoJSON approach with file-based caching.
 * We only return counties that have > 0 precipitation, and we cache the result for a set time.
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'DBConnection.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Customize these to your preferences:
$cacheFile          = __DIR__ . '/../partial_geojson_cache.json';
$cacheTimeInSeconds = 3600; // e.g. 1 hour

try {
    if ($action === 'get_precipitation_geojson') {

        // STEP A: Check if we already have a "fresh" cached file
        if (file_exists($cacheFile)) {
            $lastModified = filemtime($cacheFile);
            $age = time() - $lastModified; // seconds since last update

            if ($age < $cacheTimeInSeconds) {
                // Cache is still fresh; just return the file contents
                $cachedOutput = file_get_contents($cacheFile);
                echo $cachedOutput;
                exit;
            }
        }

        // STEP B: If we reach here, we need to re-generate the partial GeoJSON

        // 1) Query the database for precipitation data (>0)
        $query = "SELECT state_id, county_id, precipitation_amount 
                  FROM precipitationrecords 
                  WHERE precipitation_amount > 0";
        $rows = DBConnection::query($query);

        // Build a lookup array for quick merges
        $precipitationData = [];
        foreach ($rows as $row) {
            $stateFips  = str_pad($row['state_id'], 2, '0', STR_PAD_LEFT);
            $countyFips = str_pad($row['county_id'], 3, '0', STR_PAD_LEFT);
            $key        = $stateFips . $countyFips;
            $precipitationData[$key] = (float) $row['precipitation_amount'];
        }

        // 2) Load the US_Counties.geojson
        $geojsonFilePath = __DIR__ . '/../US_Counties.geojson';
        if (!file_exists($geojsonFilePath)) {
            $output = json_encode([
                "status"  => "error",
                "message" => "GeoJSON file not found on the server."
            ]);
            echo $output;
            exit;
        }

        $fullGeojsonString = file_get_contents($geojsonFilePath);
        $fullGeojson       = json_decode($fullGeojsonString, true);

        if (!isset($fullGeojson['features'])) {
            $output = json_encode([
                "status"  => "error",
                "message" => "Invalid GeoJSON structure."
            ]);
            echo $output;
            exit;
        }

        // 3) Filter out counties not in precipitationData
        $filteredFeatures = [];
        foreach ($fullGeojson['features'] as $feature) {
            if (!isset($feature['properties']['STATEFP']) || !isset($feature['properties']['COUNTYFP'])) {
                continue; // skip
            }
            $stateFips  = $feature['properties']['STATEFP'];
            $countyFips = str_pad($feature['properties']['COUNTYFP'], 3, '0', STR_PAD_LEFT);
            $lookupKey  = $stateFips . $countyFips;

            // Only keep if we have precipitation
            if (isset($precipitationData[$lookupKey])) {
                $feature['properties']['precipitation_amount'] = $precipitationData[$lookupKey];
                $filteredFeatures[] = $feature;
            }
        }

        // Build the partial GeoJSON
        $partialGeoJson = [
            'type'     => 'FeatureCollection',
            'features' => $filteredFeatures
        ];

        // 4) Construct the final JSON response
        $output = json_encode([
            "status" => "success",
            "data"   => $partialGeoJson
        ]);

        // STEP C: Write the fresh result to the cache file
        file_put_contents($cacheFile, $output);

        // STEP D: Return the new data
        echo $output;
        exit;

    } else {
        // Action not recognized
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
        exit;
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit;
}
