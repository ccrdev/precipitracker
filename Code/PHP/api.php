<?php
// Allow access from any origin (CORS) and return JSON content
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Include the database connection utility
require_once 'DBConnection.php';

// Read 'action' and 'level' from URL query parameters
$action = $_GET['action'] ?? '';
$level = $_GET['level'] ?? 'region'; // Default is now region-level instead of county

try {
    if ($action === 'get_precipitation') {
        // Define the SQL query based on the requested level
        if ($level === 'state') {
            // State-level aggregation
            $query = "
                SELECT 
                    state_id, 
                    NULL as county_id, 
                    SUM(precipitation_amount) AS precipitation_amount
                FROM precipitationrecords
                WHERE precipitation_amount > 0 AND state_id IS NOT NULL
                GROUP BY state_id
            ";

        } elseif ($level === 'region') {
            // Region-level aggregation
            $query = "
                SELECT 
                    region_id, 
                    NULL as state_id, 
                    NULL as county_id, 
                    SUM(precipitation_amount) AS precipitation_amount
                FROM precipitationrecords
                WHERE precipitation_amount > 0 AND region_id IS NOT NULL
                GROUP BY region_id
            ";

        } else {
            // county-level aggregation
            $query = "
                SELECT 
                    state_id, 
                    county_id, 
                    precipitation_amount
                FROM precipitationrecords
                WHERE precipitation_amount > 0
            ";
        }

        // Run query and return result
        $data = DBConnection::query($query);

        // Return success response
        echo json_encode([
            "status" => "success",
            "data" => $data
        ]);
    } else {
        // Invalid action response
        echo json_encode([
            "status" => "error",
            "message" => "Invalid action"
        ]);
    }

} catch (Exception $e) {
    // Return exception error response
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
