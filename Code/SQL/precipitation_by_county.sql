SELECT 
    pr.*
FROM 
    Precipitation_Records pr
JOIN 
    Counties c ON pr.county_id = c.county_id
WHERE 
    c.name = 'Autauga County';
