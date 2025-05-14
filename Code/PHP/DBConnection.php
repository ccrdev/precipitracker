<?php

/**
 * @fileoverview
 * Provides a static database connection and query interface for the Precipi-Tracker backend.
 * 
 * This class:
 * - Loads environment variables from a `.env` file (custom parser)
 * - Establishes a singleton PDO connection to a PostgreSQL database
 * - Exposes static `query()` and `disconnect()` methods for safe DB interaction
 * 
 * Usage:
 * DBConnection::query($sql, $params);
 * DBConnection::disconnect();
 */

class DBConnection
{
    /** @var PDO|null Singleton PDO connection instance */
    private static $pdo = null;

    /**
     * Loads key-value pairs from a `.env` file into PHP's environment.
     * 
     * @param string $filePath Full path to the .env file (defaults to 3 levels up from this file)
     * @return void
     */
    private static function loadEnv($filePath = __DIR__ . '/../../../.env')
    {
        if (!file_exists($filePath)) {
            die(json_encode(["status" => "error", "message" => "Environment file not found: $filePath"]));
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;

            // Parse key=value format
            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            // Only set if not already present in $_ENV
            if (!array_key_exists($name, $_ENV)) {
                putenv("$name=$value");
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }

    /**
     * Establishes and returns a singleton PDO connection.
     * 
     * Loads DB credentials from the environment and throws an error if any are missing.
     * 
     * @return PDO A configured PDO instance connected to the PostgreSQL database.
     */
    public static function connect()
    {
        if (self::$pdo === null) {
            self::loadEnv(); // Load .env file if not already loaded

            $host     = getenv('DB_HOST');
            $port     = getenv('DB_PORT');
            $dbname   = getenv('DB_NAME');
            $user     = getenv('DB_USER');
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
                die(json_encode([
                    "status" => "error",
                    "message" => "Connection failed",
                    "error" => $e->getMessage()
                ]));
            }
        }

        return self::$pdo;
    }

    /**
     * Executes a parameterized SQL query using the shared PDO connection.
     * 
     * @param string $sql The SQL query string with named or positional placeholders.
     * @param array $params Parameters to bind to the query.
     * @return array An array of associative rows from the database.
     */
    public static function query($sql, $params = [])
    {
        $stmt = self::connect()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Disconnects the current database session.
     * Useful for cleanup, though PHP will close the connection at shutdown.
     * 
     * @return void
     */
    public static function disconnect()
    {
        self::$pdo = null;
    }
}
