<?php
require_once 'DBConnection.php';

try {
    // Test connection
    echo "<h2>Testing Database Connection...</h2>";
    $pdo = DBConnection::connect();
    if ($pdo) {
        echo "<p>Connection to the database was successful!</p>";
    } else {
        echo "<p>Connection failed.</p>";
    }

    
    echo "<h2>Testing Query Execution...</h2>";
    $testQuery = "SELECT * FROM regions LIMIT 5"; 
    $results = DBConnection::query($testQuery);

    if (!empty($results)) {
        echo "<pre>";
        print_r($results);
        echo "</pre>";
    } else {
        echo "<p>No data found in the 'regions' table.</p>";
    }
} catch (Exception $e) {
    echo "<p>Error: " . $e->getMessage() . "</p>";
}

// Close the connection
DBConnection::disconnect();

