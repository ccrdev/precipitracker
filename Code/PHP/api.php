<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'DBConnection.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    if ($action === 'get_precipitation') {
        $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : null;
        $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : null;

        $query = "SELECT state_id, county_id, precipitation_amount FROM precipitationrecords WHERE precipitation_amount > 0";
        if ($startDate && $endDate) {
            // Add date range filter, query may not work as expected
            $query .= " AND timestamp >= :start_date AND timestamp <= :end_date";
        } 
        $data = DBConnection::query($query);
        echo json_encode(["status" => "success", "data" => $data]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

