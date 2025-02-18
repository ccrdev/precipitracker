<?php
class DBConnection {
    private static $host = "localhost";
    private static $dbname = "ptracker";
    private static $user = "ptracker";
    private static $password = "super-secret-password";
    private static $port = "5432";
    private static $pdo = null;

    // Establish a PDO connection
    public static function connect() {
        if (self::$pdo === null) {
            try {
                self::$pdo = new PDO(
                    "pgsql:host=" . self::$host . ";port=" . self::$port . ";dbname=" . self::$dbname,
                    self::$user,
                    self::$password,
                    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                );
            } catch (PDOException $e) {
                die(json_encode(["status" => "error", "message" => "Database connection failed: " . $e->getMessage()]));
            }
        }
        return self::$pdo;
    }

    // Execute a SELECT query with optional parameters
    public static function query($sql, $params = []) {
        $stmt = self::connect()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Close the connection
    public static function disconnect() {
        self::$pdo = null;
    }
}

