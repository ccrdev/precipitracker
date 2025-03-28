<?php
// Allow access from any origin (CORS) and return JSON content
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'DBConnection.php';

// Read query parameters using consistent pattern
$action = isset($_GET['action']) ? $_GET['action'] : '';
$level  = isset($_GET['level']) ? $_GET['level'] : 'region';
$start  = isset($_GET['start']) ? $_GET['start'] : '2024-01-01';
$end    = isset($_GET['end']) ? $_GET['end'] : '2024-12-31';

try {
    if ($action === 'get_precipitation') {
        $params = ['start' => $start, 'end' => $end];
        $query = '';

        if ($level === 'state') {
            // Aggregate by state
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
            // Aggregate by region
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

        } else {
            // Raw county-level data (no aggregation)
            $query = "
                SELECT 
                    state_id, 
                    county_id, 
                    precipitation_amount
                FROM precipitationrecords
                WHERE precipitation_amount > 0
                  AND timestamp BETWEEN :start AND :end
            ";
        }

        // Run query with bound parameters
        $data = DBConnection::query($query, $params);

        // Return success response
        echo json_encode([
            "status" => "success",
            "data" => $data
        ]);

    } else {
        // Invalid action fallback
        echo json_encode([
            "status" => "error",
            "message" => "Invalid action"
        ]);
    }

} catch (Exception $e) {
    // Handle any exception and return a JSON error
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
