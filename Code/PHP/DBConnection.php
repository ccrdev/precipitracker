<?php
class DBConnection {
    private static $pdo = null;

    // Load configuration from JSON file
    private static function loadEnv($filePath = __DIR__ . '/../../../.env') {
        if (!file_exists($filePath)) {
            die(json_encode(["status" => "error", "message" => "Environment file not found: $filePath"]));
        }
    
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
    
            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
    
            if (!array_key_exists($name, $_ENV)) {
                putenv("$name=$value");
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }    

    // Establish a PDO connection
    public static function connect() {
        if (self::$pdo === null) {
            self::loadEnv(); // Load .env once
    
            $host = getenv('DB_HOST');
            $port = getenv('DB_PORT');
            $dbname = getenv('DB_NAME');
            $user = getenv('DB_USER');
            $password = getenv('DB_PASSWORD');
    
            if (!$host || !$port || !$dbname || !$user) {
                die(json_encode(["status" => "error", "message" => "Missing DB credentials"]));
            }
    
            try {
                self::$pdo = new PDO(
                    "pgsql:host=$host;port=$port;dbname=$dbname",
                    $user,
                    $password,
                    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                );
            } catch (PDOException $e) {
                die(json_encode(["status" => "error", "message" => "Connection failed", "error" => $e->getMessage()]));
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
