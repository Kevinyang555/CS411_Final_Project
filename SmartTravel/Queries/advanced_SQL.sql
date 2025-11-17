USE smart_travel_db;

SELECT * FROM Location
LIMIT 15;

SELECT * FROM WeatherDaily
LIMIT 15;


SELECT l.name AS city, l.country, ROUND(AVG(w.max_temp_c), 1) AS avg_high_c, ROUND(AVG(w.precip_mm), 2)  AS avg_rain_mm, SUM(CASE WHEN w.conditions = 'Clear' THEN 1 ELSE 0 END) AS clear_days
FROM Location AS l JOIN WeatherDaily AS w ON l.location_id = w.location_id
WHERE w.on_date >= '2025-10-20' AND w.on_date <= '2025-10-26'
GROUP BY l.location_id, l.name, l.country
HAVING COUNT(*) >= 3                
ORDER BY clear_days DESC, avg_rain_mm ASC
LIMIT 15;


SELECT l.name,l.country,ROUND(AVG(w.max_temp_c), 1) AS city_avg_max,ROUND
((SELECT AVG(w2.max_temp_c) FROM WeatherDaily AS w2 JOIN Location AS l2 ON w2.location_id = l2.location_id WHERE l2.country = l.country), 1) AS country_avg_max
FROM Location AS l JOIN WeatherDaily AS w ON l.location_id = w.location_id
GROUP BY l.location_id, l.name, l.country
HAVING (country_avg_max - city_avg_max) >= 7
ORDER BY l.country, city_avg_max DESC
LIMIT 15;

SELECT COUNT(*) AS total_origin
FROM flight_origin;




-- blow is for creating temp entries for ItineraryItem    
SELECT location_id, name, country
FROM Location
WHERE name IN (
    'New York', 'Chicago', 'Denver', 'Seattle', 'Miami',
    'Anchorage', 'Nashville', 'San Diego', 'St. Louis',
    'Portland', 'Colorado Springs', 'Orlando', 'San Francisco',
    'Austin', 'Boston', 'Vancouver', 'Las Vegas',
    'Honolulu', 'Toronto'
);

SELECT a.*
FROM Attraction a
JOIN (
    SELECT location_id, MIN(attraction_id) AS min_attr
    FROM (
        SELECT location_id, attraction_id
        FROM Attraction
        WHERE location_id IN (15, 53, 87, 104, 160, 216, 225, 257, 298, 340, 370, 392, 401, 426, 427)
        ORDER BY RAND()
    ) AS shuffled
    GROUP BY location_id
) AS ;








