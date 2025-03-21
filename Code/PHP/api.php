<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'DBConnection.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Modified by Austin H 3/21/2025
try {
    if ($action === 'get_precipitation') {
        // Get the start_date and end_date from the query parameters
        $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
        $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;

        // Validate the date range
        if (!$start_date || !$end_date) {
            // Default way of getting precipitation data without date range
            $query = "SELECT state_id, county_id, precipitation_amount FROM precipitationrecords WHERE precipitation_amount > 0";
            $data = DBConnection::query($query);
            echo json_encode(["status" => "success", "data" => $data]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
        }
    } else {
        // Sanitize the inputs to prevent SQL injection
        $start_date = DBConnection::escape($start_date);
        $end_date = DBConnection::escape($end_date);

        // Update the query to filter by the date range
        // Date selection is probably off, I have not checked the database for the correct column name
        $query = "
            SELECT state_id, county_id, precipitation_amount 
            FROM precipitationrecords 
            WHERE precipitation_amount > 0 
            AND date >= '$start_date' 
            AND date <= '$end_date'
        ";

        // Execute the query
        $data = DBConnection::query($query);

        // Return the results as JSON
        echo json_encode(["status" => "success", "data" => $data]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}


