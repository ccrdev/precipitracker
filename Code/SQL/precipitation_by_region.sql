SELECT 
    pr.*
FROM 
    Precipitation_Records pr
JOIN 
    States s ON pr.state_id = s.state_id
JOIN 
    Regions r ON s.region_id = r.region_id
WHERE 
    r.region_name = 'YourRegionName';
