<?php

/**
 * @fileoverview
 * PHP backend API endpoint for Precipi-Tracker.
 * 
 * This script:
 * - Accepts HTTP GET parameters (`action`, `level`, `start`, `end`)
 * - Retrieves and aggregates precipitation data from the database
 *   based on the requested geographic level (region, state, or county)
 * - Returns a JSON response to the frontend
 * 
 * Expected Query Parameters:
 * - action: Required. Currently only supports `get_precipitation`.
 * - level: Optional. One of `region`, `state`, or `county`. Defaults to `region`.
 * - start: Optional. Start date in YYYY-MM-DD format. Defaults to `2024-01-01`.
 * - end:   Optional. End date in YYYY-MM-DD format. Defaults to `2024-12-31`.
 */

header("Access-Control-Allow-Origin: *");       // Allow cross-origin requests
header("Content-Type: application/json");        // Set response content type to JSON

require_once 'DBConnection.php';                // Include database connection handler

// Safely extract GET parameters with defaults
$action = isset($_GET['action']) ? $_GET['action'] : '';
$level  = isset($_GET['level'])  ? $_GET['level']  : 'region';
$start  = isset($_GET['start'])  ? $_GET['start']  : '2024-01-01';
$end    = isset($_GET['end'])    ? $_GET['end']    : '2024-12-31';

try {
    if ($action === 'get_precipitation') {
        $params = ['start' => $start, 'end' => $end];
        $query = '';

        // Choose query based on requested level of aggregation
        if ($level === 'state') {
            $query = "
                SELECT 
                    state_id, 
                    NULL as county_id, 
                    SUM(precipitation_amount) AS precipitation_amount
                FROM precipitationrecords
                WHERE precipitation_amount > 0
                  AND state_id IS NOT NULL
                  AND timestamp BETWEEN :start AND :end
                GROUP BY state_id
            ";
        } elseif ($level === 'region') {
            $query = "
                SELECT 
                    region_id, 
                    NULL as state_id, 
                    NULL as county_id, 
                    SUM(precipitation_amount) AS precipitation_amount
                FROM precipitationrecords
                WHERE precipitation_amount > 0
                  AND region_id IS NOT NULL
                  AND timestamp BETWEEN :start AND :end
                GROUP BY region_id
            ";
        } elseif ($level === 'county') {
            $query = "
                SELECT 
                    county_id, 
                    state_id, 
                    NULL as region_id, 
                    SUM(precipitation_amount) AS precipitation_amount
                FROM precipitationrecords
                WHERE precipitation_amount > 0
                  AND county_id IS NOT NULL
                  AND timestamp BETWEEN :start AND :end
                GROUP BY county_id, state_id
            ";
        }

        // Execute the prepared SQL query with bound parameters
        $data = DBConnection::query($query, $params);

        // Respond with success and data payload
        echo json_encode([
            "status" => "success",
            "data" => $data
        ]);
    } else {
        // Handle invalid or unsupported actions
        echo json_encode([
            "status" => "error",
            "message" => "Invalid action"
        ]);
    }
} catch (Exception $e) {
    // Catch and return any exception as a JSON error response
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
