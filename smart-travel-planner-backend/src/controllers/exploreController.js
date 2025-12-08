import pool from '../config/database.js';

async function runProcedureOrFallback(procSql, procParams, fallbackSql, fallbackParams) {
  try {
    const [rows] = await pool.query(procSql, procParams);
    return Array.isArray(rows?.[0]) ? rows[0] : rows;
  } catch (err) {
    // If stored procedure is missing, fall back to inline query
    if (err?.code === 'ER_SP_DOES_NOT_EXIST') {
      const [rows] = await pool.query(fallbackSql, fallbackParams);
      return rows;
    }
    throw err;
  }
}

export async function getSunniestCities(req, res) {
  try {
    const limit = Number(req.query.limit || 10);
    const startDate = req.query.startDate;
    if (!startDate) {
      return res.status(400).json({ error: 'startDate is required (YYYY-MM-DD)' });
    }

    const results = await runProcedureOrFallback(
      'CALL GetSunniestCities(?, ?)',
      [startDate, limit],
      `
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
        WHERE w.on_date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)
        GROUP BY l.location_id, l.name, l.country
        HAVING clear_days > 0
        ORDER BY clear_days DESC, avg_rain_mm ASC
        LIMIT ?
      `,
      [startDate, startDate, limit]
    );

    res.json(results);
  } catch (err) {
    console.error('Error in getSunniestCities:', err);
    res.status(500).json({ error: 'Failed to load sunniest cities', message: err.message });
  }
}

export async function getColderCities(req, res) {
  try {
    const limit = Number(req.query.limit || 10);
    const minDelta = Number(req.query.minDelta || 2); // degrees C colder than country avg
    const startDate = req.query.startDate;
    if (!startDate) {
      return res.status(400).json({ error: 'startDate is required (YYYY-MM-DD)' });
    }

    const results = await runProcedureOrFallback(
      'CALL GetColderCities(?, ?, ?)',
      [startDate, minDelta, limit],
      `
        WITH city_stats AS (
          SELECT
            l.location_id,
            l.name AS city,
            l.country,
            AVG(w.max_temp_c) AS city_avg_max
          FROM WeatherDaily w
          JOIN Location l ON l.location_id = w.location_id
          WHERE w.on_date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)
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
        WHERE c.city_avg_max <= cs.country_avg_max - ?
        ORDER BY delta_c DESC
        LIMIT ?
      `,
      [startDate, startDate, minDelta, limit]
    );

    res.json(results);
  } catch (err) {
    console.error('Error in getColderCities:', err);
    res.status(500).json({ error: 'Failed to load colder cities', message: err.message });
  }
}

export async function getCheapFlightsGoodWeather(req, res) {
  try {
    const limit = Number(req.query.limit || 15);
    const maxPrice = Number(req.query.maxPrice || 1000);
    const minComfortC = Number(req.query.minTemp || 15);
    const maxComfortC = Number(req.query.maxTemp || 28);
    const maxAvgPrecip = Number(req.query.maxPrecip || 3);
    const results = await runProcedureOrFallback(
      'CALL GetCheapFlightsGoodWeather(?, ?, ?, ?, ?, ?)',
      [req.query.startDate || null, minComfortC, maxComfortC, maxAvgPrecip, maxPrice, limit],
      `
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
          WHERE f.price <= ?
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
          WHERE wd.avg_high_c BETWEEN ? AND ?
            AND wd.avg_precip_mm <= ?
          ORDER BY fl.price ASC
          LIMIT ?
      `,
      [maxPrice, minComfortC, maxComfortC, maxAvgPrecip, limit]
    );

    const normalized = results.map(r => ({
      ...r,
      price: r.price != null ? parseFloat(r.price) : null,
      avg_high_c: r.avg_high_c != null ? parseFloat(r.avg_high_c) : null,
      avg_precip_mm: r.avg_precip_mm != null ? parseFloat(r.avg_precip_mm) : null,
      clear_days: r.clear_days != null ? Number(r.clear_days) : null
    }));

    res.json(normalized);
  } catch (err) {
    console.error('Error in getCheapFlightsGoodWeather:', err);
    res.status(500).json({ error: 'Failed to load cheap flights to good-weather places', message: err.message });
  }
}

export async function getMonthlyRouteAvg(req, res) {
  try {
    const limit = Number(req.query.limit || 20);
    const month = req.query.month; // expect YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month is required (YYYY-MM)' });
    }
    const startDate = `${month}-01`;

    const results = await runProcedureOrFallback(
      'CALL GetMonthlyRouteAvg(?, ?)',
      [startDate, limit],
      `
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
        WHERE f.depart_time BETWEEN ? AND LAST_DAY(?)
        GROUP BY l1.name, l2.name, MONTH(f.depart_time)
        ORDER BY avg_price ASC
        LIMIT ?
      `,
      [startDate, startDate, limit]
    );

    const normalized = results.map(r => ({
      ...r,
      avg_price: r.avg_price != null ? parseFloat(r.avg_price) : null,
      flights: r.flights != null ? Number(r.flights) : null
    }));

    res.json(normalized);
  } catch (err) {
    console.error('Error in getMonthlyRouteAvg:', err);
    res.status(500).json({ error: 'Failed to load monthly route averages', message: err.message });
  }
}
