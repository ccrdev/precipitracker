# Database Schema: Precipi-Tracker

## Tables

### Regions

- `region_id` (Serial Primary Key, INT)
- `name` (Name of the region, VARCHAR(255))

### States

- `state_id` (Primary Key, INT)  
  - **Note**: Uses FIPS code as the primary key.
- `name` (Name of the state, VARCHAR(255))
- `abbreviation` (State abbreviation, CHAR(2))
- `region_id` (Foreign Key to Regions, INT, NOT NULL, ON DELETE CASCADE)

### Counties

- `county_id` (Primary Key, Composite Key with `state_id`, INT)  
- `name` (Name of the county, VARCHAR(255))
- `state_id` (Foreign Key to States, INT, NOT NULL, ON DELETE CASCADE)

### Precipitation Records

- `record_id` (Serial, Primary Key, INT)
- `region_id` (Foreign Key to Regions, INT, NULLABLE, ON DELETE CASCADE)
- `state_id` (Foreign Key to States, INT, NULLABLE, ON DELETE CASCADE)
- `county_id` (Foreign Key to Counties, INT, NULLABLE)
- `timestamp` (Date and time of the record, TIMESTAMP, NOT NULL)
- `precipitation_amount` (Recorded amount of rainfall in mm, DECIMAL(6, 2), NOT NULL)

---

## Relationships

### Regions and States Info

- The relationship between Regions and States is one-to-many:
  - Each State belongs to one Region.
  - Each Region can have multiple States.
- The `region_id` in the States table represents this relationship and enforces referential integrity (`ON DELETE CASCADE`).

### Counties Info

- The relationship between States and Counties is one-to-many:
  - Each County belongs to one State.
  - Each State can have multiple Counties.
- This is represented by the composite primary key in the Counties table (`state_id`, `county_id`).

### Precipitation Records Info

- Precipitation Records can be linked to a County, State, or Region:
  - `region_id`: Allows records to be aggregated at the regional level.
  - `state_id`: Allows records to be aggregated at the state level.
  - `county_id`: Allows records to be aggregated at the county level.
- The `fk_precipitation_county` constraint ensures that `county_id` is valid for the associated `state_id`.
- All foreign key relationships cascade deletions to ensure data integrity.
