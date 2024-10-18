# Database Schema: Precipi-Tracker

## Tables

### Regions
- `region_id` (Primary Key, INT)
- `name` (Name of the region, VARCHAR(255))

### States
- `state_id` (Primary Key, INT)
- `name` (Name of the state, VARCHAR(255))
- `abbreviation` (State abbreviation, CHAR(2))
- `region_id` (Foreign Key to Regions, INT)

### Counties
- `county_id` (Primary Key, INT)
- `name` (Name of the county, VARCHAR(255))
- `state_id` (Foreign Key to States, INT)

### Precipitation Records
- `record_id` (Primary Key, INT)
- `region_id` (Foreign Key to Regions, INT, NULLABLE)
- `state_id` (Foreign Key to States, INT, NULLABLE)
- `county_id` (Foreign Key to Counties, INT, NULLABLE)
- `timestamp` (Date and time of the record, DATETIME)
- `latitude` (Latitude in decimal degrees, DECIMAL(9, 6))
- `longitude` (Longitude in decimal degrees, DECIMAL(9, 6))
- `precipitation_amount` (Recorded amount of rainfall in mm, DECIMAL(6, 2))

---

## Relationships

### Regions and States:
- The relationship between Regions and States is one-to-many:
  - Each State belongs to one Region.
  - Each Region can have multiple States.
- The `region_id` in the States table represents this relationship.

### Counties:
- Each County is linked to a State via `state_id`.
- This means each County belongs to a specific State.

### Precipitation Records:
- Precipitation Records can be linked to a County, State, or Region.
- The `region_id`, `state_id`, and `county_id` fields allow flexibility in recording rainfall data at any geographic level.
