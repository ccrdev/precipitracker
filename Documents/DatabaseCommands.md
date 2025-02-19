# PostgreSQL Database Commands

## Create Database

```sql
CREATE DATABASE precipitracker_db;
```

## Create table for Regions

```sql
CREATE TABLE Regions (
    region_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
```

## Create table for States

```sql
CREATE TABLE States (
    state_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation CHAR(2) NOT NULL,
    region_id INT NOT NULL REFERENCES Regions(region_id) ON DELETE CASCADE
);
```

## Create table for Counties

```sql
CREATE TABLE Counties (
    county_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    state_id INT NOT NULL REFERENCES States(state_id) ON DELETE CASCADE,
    PRIMARY KEY (state_id, county_id)
);
```

## Create table for Precipitation Records

```sql
CREATE TABLE Precipitation_Records (
    record_id SERIAL PRIMARY KEY,
    region_id INT REFERENCES Regions(region_id) ON DELETE CASCADE,
    state_id INT REFERENCES States(state_id) ON DELETE CASCADE,
    county_id INT,
    timestamp TIMESTAMP NOT NULL,
    precipitation_amount DECIMAL(6, 2) NOT NULL,
    CONSTRAINT fk_precipitation_county FOREIGN KEY (state_id, county_id)
        REFERENCES Counties (state_id, county_id) ON DELETE CASCADE
);

```

## Grant permissions to the database
```sql
GRANT CONNECT ON DATABASE precipdatatest TO rshirloc;
GRANT CONNECT ON DATABASE precipdatatest TO ahegarty;
GRANT CONNECT ON DATABASE precipdatatest TO jremilla;
GRANT CONNECT ON DATABASE precipdatatest TO crosa;
```

