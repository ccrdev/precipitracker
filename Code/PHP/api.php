<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'DBConnection.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    if ($action === 'get_precipitation') {
        $query = "SELECT state_id, county_id, precipitation_amount FROM precipitationrecords";
        $data = DBConnection::query($query);
        echo json_encode(["status" => "success", "data" => $data]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

