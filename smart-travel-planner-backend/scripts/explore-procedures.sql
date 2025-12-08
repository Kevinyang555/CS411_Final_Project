-- Stored procedures for Explore Destinations (date-aware)
-- Run from MySQL CLI or Cloud SQL to create:
--   SOURCE scripts/explore-procedures.sql;

DELIMITER //

CREATE PROCEDURE GetSunniestCities(
  IN start_d DATE,
  IN limitCities INT
)
BEGIN
  DECLARE end_d DATE DEFAULT DATE_ADD(start_d, INTERVAL 6 DAY);

  SELECT
    l.location_id,
    l.name       AS city,
    l.country,
    COUNT(*) AS days_with_data,
    SUM(CASE WHEN LOWER(w.conditions) LIKE '%clear%' OR LOWER(w.conditions) LIKE '%sun%' THEN 1 ELSE 0 END) AS clear_days,
    AVG(w.precip_mm)   AS avg_rain_mm,
    AVG(w.max_temp_c)  AS avg_high_c,
    AVG(w.min_temp_c)  AS avg_low_c
  FROM WeatherDaily w
  JOIN Location l ON l.location_id = w.location_id
  WHERE w.on_date BETWEEN start_d AND end_d
  GROUP BY l.location_id, l.name, l.country
  HAVING clear_days > 0
  ORDER BY clear_days DESC, avg_rain_mm ASC
  LIMIT limitCities;
END//

CREATE PROCEDURE GetColderCities(
  IN start_d DATE,
  IN minDelta DECIMAL(4,1),
  IN limitCities INT
)
BEGIN
  DECLARE end_d DATE DEFAULT DATE_ADD(start_d, INTERVAL 6 DAY);

  WITH city_stats AS (
    SELECT
      l.location_id,
      l.name AS city,
      l.country,
      AVG(w.max_temp_c) AS city_avg_max
    FROM WeatherDaily w
    JOIN Location l ON l.location_id = w.location_id
    WHERE w.on_date BETWEEN start_d AND end_d
    GROUP BY l.location_id, l.name, l.country
  ),
  country_stats AS (
    SELECT country, AVG(city_avg_max) AS country_avg_max
    FROM city_stats
    GROUP BY country
  )
  SELECT
    c.location_id,
    c.city,
    c.country,
    c.city_avg_max,
    cs.country_avg_max,
    (cs.country_avg_max - c.city_avg_max) AS delta_c
  FROM city_stats c
  JOIN country_stats cs ON cs.country = c.country
  WHERE c.city_avg_max <= cs.country_avg_max - minDelta
  ORDER BY delta_c DESC
  LIMIT limitCities;
END//

CREATE PROCEDURE GetCheapFlightsGoodWeather(
  IN start_d DATE,
  IN minComfortC DECIMAL(4,1),
  IN maxComfortC DECIMAL(4,1),
  IN maxAvgPrecip DECIMAL(5,2),
  IN maxPrice DECIMAL(10,2),
  IN limitFlights INT
)
BEGIN
  WITH weather AS (
    SELECT
      l.location_id,
      l.name AS destination_city,
      l.country AS destination_country,
      AVG(w.max_temp_c) AS avg_high_c,
      AVG(w.precip_mm) AS avg_precip_mm,
      SUM(CASE WHEN LOWER(w.conditions) LIKE '%clear%' OR LOWER(w.conditions) LIKE '%sun%' THEN 1 ELSE 0 END) AS clear_days
    FROM WeatherDaily w
    JOIN Location l ON l.location_id = w.location_id
    GROUP BY l.location_id, l.name, l.country
  ),
  flights AS (
    SELECT
      f.flight_id,
      f.carrier_code,
      f.flight_number,
      f.price,
      f.currency,
      f.depart_time,
      f.arrive_time,
      fo.location_id AS origin_id,
      fd.location_id AS dest_id
    FROM FlightOption f
    JOIN flight_origin fo ON fo.flight_id = f.flight_id
    JOIN flight_destination fd ON fd.flight_id = f.flight_id
    WHERE f.price <= maxPrice
  )
  SELECT
    fl.flight_id,
    fl.carrier_code,
    fl.flight_number,
    fl.price,
    fl.currency,
    fl.depart_time,
    fl.arrive_time,
    lo.name AS origin_city,
    lo.country AS origin_country,
    wd.destination_city,
    wd.destination_country,
    wd.avg_high_c,
    wd.avg_precip_mm,
    wd.clear_days
  FROM flights fl
  JOIN weather wd ON wd.location_id = fl.dest_id
  JOIN Location lo ON lo.location_id = fl.origin_id
  WHERE wd.avg_high_c BETWEEN minComfortC AND maxComfortC
    AND wd.avg_precip_mm <= maxAvgPrecip
  ORDER BY fl.price ASC
  LIMIT limitFlights;
END//

CREATE PROCEDURE GetMonthlyRouteAvg(
  IN month_start DATE,
  IN limitRoutes INT
)
BEGIN
  DECLARE month_end DATE;
  SET month_end = LAST_DAY(month_start);

  SELECT
    l1.name AS origin_city,
    l2.name AS destination_city,
    MONTH(f.depart_time) AS month,
    AVG(f.price) AS avg_price,
    COUNT(*) AS flights
  FROM FlightOption f
  JOIN flight_origin fo ON fo.flight_id = f.flight_id
  JOIN flight_destination fd ON fd.flight_id = f.flight_id
  JOIN Location l1 ON l1.location_id = fo.location_id
  JOIN Location l2 ON l2.location_id = fd.location_id
  WHERE f.depart_time BETWEEN month_start AND month_end
  GROUP BY l1.name, l2.name, MONTH(f.depart_time)
  ORDER BY avg_price ASC
  LIMIT limitRoutes;
END//

DELIMITER ;
