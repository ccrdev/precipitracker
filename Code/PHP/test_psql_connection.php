<?php
$servername = "localhost"; 
$username   = "ptracker";  
$password   = "super-secret-password"; 
$dbname     = "ptracker";  

try {
    // Establish connection using PDO
    $pdo = new PDO("pgsql:host=$servername;dbname=$dbname", $username, $password);

    // Set error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected successfully to PostgreSQL database: $dbname";

    // Fetch the first row from the regions table to confirm queries work
    $stmt = $pdo->query("SELECT * FROM regions");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo "Successfully retrieved data from regions table:";
        print_r($row);
    } else {
        echo "The regions table is empty.";
    }

} catch (PDOException $e) {
    // Catch and display error messages
    echo "Error: " . $e->getMessage();
}

?>
