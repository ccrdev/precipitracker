<?php
class DBConnection {
    private static $pdo = null;

    // Load configuration from JSON file
    private static function loadConfig() {
        $configPath = __DIR__ . '../config.json';
        if (!file_exists($configPath)) {
            die(json_encode(["status" => "error", "message" => "Configuration file missing"]));
        }
        return json_decode(file_get_contents($configPath), true);
    }

    // Establish a PDO connection
    public static function connect() {
        if (self::$pdo === null) {
            $config = self::loadConfig();
            try {
                self::$pdo = new PDO(
                    "pgsql:host=" . $config['DB_HOST'] . 
                    ";port=" . $config['DB_PORT'] . 
                    ";dbname=" . $config['DB_NAME'],
                    $config['DB_USER'],
                    $config['DB_PASSWORD'],
                    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                );
            } catch (PDOException $e) {
                die(json_encode(["status" => "error", "message" => "Database connection failed: " . $e->getMessage()]));
            }
        }
        return self::$pdo;
    }

    public static function query($sql, $params = []) {
        $stmt = self::connect()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function disconnect() {
        self::$pdo = null;
    }
}
