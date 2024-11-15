<?php
//This should connect to the database and list all of the region names in the regions table.
//To test this, make sure you edit the $username and $password to correctly connect
echo "Connecting to database...<br/>";
$servername = "localhost";
$username   = "ahegarty";
$password   = "password";
$dbname     = "precipdatatest";

$getRegionData = "SELECT * FROM regions;";
try {
    $connection = new PDO("pgsql:host=$servername;dbname=$dbname","$username","$password");
    foreach($connection->query($getRegionData) as $row){
        print_r($row["name"]);
        echo "<br>";
    }
    $connection = null;
}
catch (PDOException $e) {
    print "Error: " . $e->getMessage() . "<br/>";
    die();
}
