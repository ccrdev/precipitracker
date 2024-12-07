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
    state_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation CHAR(2) NOT NULL,
    region_id INT,
    FOREIGN KEY (region_id) REFERENCES Regions(region_id)
);
```

## Create table for Counties

```sql
CREATE TABLE Counties (
    county_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state_id INT,
    FOREIGN KEY (state_id) REFERENCES States(state_id)
);
```

## Create table for Precipitation Records

```sql
CREATE TABLE Precipitation_Records (
    record_id SERIAL PRIMARY KEY,
    region_id INT,
    state_id INT,
    county_id INT,
    timestamp TIMESTAMP NOT NULL,
    precipitation_amount DECIMAL(6, 2) NOT NULL,
    FOREIGN KEY (region_id) REFERENCES Regions(region_id),
    FOREIGN KEY (state_id) REFERENCES States(state_id),
    FOREIGN KEY (county_id) REFERENCES Counties(county_id)
);
```

## Grant permissions to the database
```sql
GRANT CONNECT ON DATABASE precipdatatest TO rshirloc;
GRANT CONNECT ON DATABASE precipdatatest TO ahegarty;
GRANT CONNECT ON DATABASE precipdatatest TO jremilla;
GRANT CONNECT ON DATABASE precipdatatest TO crosa;
```

