SELECT 
    Counties.name AS "County Name",
    Counties.county_id AS "County ID",
    States.state_id AS "State ID",
    States.region_id AS "Region ID"
FROM 
    Counties
JOIN 
    States ON Counties.state_id = States.state_id
JOIN 
    Regions ON States.region_id = Regions.region_id
ORDER BY 
    "Region ID", "State ID", "County ID";
