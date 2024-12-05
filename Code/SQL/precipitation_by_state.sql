SELECT 
    pr.*
FROM 
    Precipitation_Records pr
JOIN 
    States s ON pr.state_id = s.state_id
WHERE 
    s.name = 'Alabama';
