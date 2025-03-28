<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'DBConnection.php';

// Read query parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';
$start  = isset($_GET['start']) ? $_GET['start'] : '2023-12-10';
$end    = isset($_GET['end']) ? $_GET['end'] : '2024-12-10';

try {
    if ($action === 'get_precipitation') {
        // Query precipitation records within the date range
        $query = "
            SELECT state_id, county_id, precipitation_amount
            FROM precipitationrecords
            WHERE precipitation_amount > 0
              AND timestamp BETWEEN :start AND :end
        ";

        $params = ['start' => $start, 'end' => $end];

        $data = DBConnection::query($query, $params);

        echo json_encode(["status" => "success", "data" => $data]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
