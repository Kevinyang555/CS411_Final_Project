/**
 * Trip Controller
 *
 * Contains business logic for trip planning endpoints.
 * This is where we query the database and format responses.
 */

import pool from '../config/database.js';

/**
 * Helper function: Convert Celsius to Fahrenheit
 */
function cToF(celsius) {
  return (celsius * 9) / 5 + 32;
}

/**
 * POST /api/trip-summary
 *
 * Main endpoint that combines weather, flights, and attractions
 * for a given trip query.
 */
export async function getTripSummary(req, res) {
  try {
    const {
      origin,
      destination,
      startDate,
      endDate,
      budget,
      currency,
      tempMin,    // In Celsius (frontend converts from F)
      tempMax,    // In Celsius
      crowdPreference,
      maxFlightPrice
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['origin', 'destination', 'startDate', 'endDate']
      });
    }

    console.log(`📍 Trip query: ${origin} → ${destination} (${startDate} to ${endDate})`);

    // ==================== STEP 1: Get Location IDs ====================

    const [originLocations] = await pool.query(
      'SELECT location_id, name, country, lat, lon FROM Location WHERE name LIKE ? LIMIT 1',
      [`%${origin}%`]
    );

    const [destLocations] = await pool.query(
      'SELECT location_id, name, country, lat, lon FROM Location WHERE name LIKE ? LIMIT 1',
      [`%${destination}%`]
    );

    if (originLocations.length === 0) {
      return res.status(404).json({ error: `Origin city "${origin}" not found in database` });
    }

    if (destLocations.length === 0) {
      return res.status(404).json({ error: `Destination city "${destination}" not found in database` });
    }

    const originLoc = originLocations[0];
    const destLoc = destLocations[0];

    console.log(`   Origin: ${originLoc.name}, ${originLoc.country} (ID: ${originLoc.location_id})`);
    console.log(`   Destination: ${destLoc.name}, ${destLoc.country} (ID: ${destLoc.location_id})`);

    // ==================== STEP 2: Get Weather Data ====================

    const [weatherData] = await pool.query(
      `SELECT
        on_date,
        min_temp_c,
        max_temp_c,
        precip_mm,
        conditions
       FROM WeatherDaily
       WHERE location_id = ?
       AND on_date BETWEEN ? AND ?
       ORDER BY on_date`,
      [destLoc.location_id, startDate, endDate]
    );

    // Calculate weather summary
    const weatherSummary = calculateWeatherSummary(weatherData);

    // Format daily weather (convert temps to Fahrenheit for frontend)
    const weatherDaily = weatherData.map(day => ({
      date: day.on_date.toISOString().split('T')[0],
      min: parseFloat(day.min_temp_c),
      max: parseFloat(day.max_temp_c),
      precip: parseFloat(day.precip_mm),
      conditions: day.conditions
    }));

    // ==================== STEP 3: Get Flight Options ====================

    let flightQuery = `
      SELECT
        f.flight_id,
        f.carrier_code,
        f.flight_number,
        f.price,
        f.currency,
        f.depart_time,
        f.arrive_time,
        l1.name AS origin_city,
        l2.name AS destination_city
      FROM FlightOption f
      JOIN flight_origin fo ON f.flight_id = fo.flight_id
      JOIN flight_destination fd ON f.flight_id = fd.flight_id
      JOIN Location l1 ON fo.location_id = l1.location_id
      JOIN Location l2 ON fd.location_id = l2.location_id
      WHERE fo.location_id = ? AND fd.location_id = ?
    `;

    const queryParams = [originLoc.location_id, destLoc.location_id];

    // Add price filter if specified
    if (maxFlightPrice) {
      flightQuery += ' AND f.price <= ?';
      queryParams.push(maxFlightPrice);
    }

    flightQuery += ' ORDER BY f.price ASC LIMIT 15';

    const [flights] = await pool.query(flightQuery, queryParams);

    const flightOptions = flights.map(f => ({
      flightId: f.flight_id,
      carrierCode: f.carrier_code,
      flightNumber: f.flight_number,
      price: parseFloat(f.price),
      currency: f.currency,
      departTime: f.depart_time,
      arriveTime: f.arrive_time,
      originCity: f.origin_city,
      destinationCity: f.destination_city
    }));

    // ==================== STEP 4: Get Attractions ====================

    const [attractions] = await pool.query(
      `SELECT
        a.attraction_id AS id,
        a.name,
        a.category,
        a.rating,
        a.lat,
        a.lon,
        AVG(ap.busyness_index) AS avg_busyness
       FROM Attraction a
       LEFT JOIN AttractionPopularity ap ON a.attraction_id = ap.attraction_id
       WHERE a.location_id = ?
       GROUP BY a.attraction_id, a.name, a.category, a.rating, a.lat, a.lon
       LIMIT 20`,
      [destLoc.location_id]
    );

    // Format attractions with busyness index
    const attractionsWithCrowds = attractions.map(a => ({
      ...a,
      rating: a.rating ? parseFloat(a.rating) : null,
      busynessIndex: a.avg_busyness ? Math.round(parseFloat(a.avg_busyness)) : null
    }));

    // ==================== STEP 5: Best Time to Visit ====================

    const bestTimeToVisit = {
      label: "Based on weather data",
      explanation: weatherSummary.conditionsSummary
    };

    // ==================== STEP 6: Build Response ====================

    const response = {
      location: {
        name: destLoc.name,
        country: destLoc.country
      },
      weatherSummary,
      weatherDaily,
      flights: flightOptions,
      attractions: attractionsWithCrowds,
      bestTimeToVisit
    };

    console.log(`✅ Successfully retrieved trip data for ${destination}`);
    console.log(`   Weather: ${weatherDaily.length} days`);
    console.log(`   Flights: ${flightOptions.length} options`);
    console.log(`   Attractions: ${attractionsWithCrowds.length} places`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error in getTripSummary:', error);
    res.status(500).json({
      error: 'Failed to retrieve trip summary',
      message: error.message
    });
  }
}

/**
 * Helper: Calculate weather summary from daily data
 */
function calculateWeatherSummary(weatherData) {
  if (weatherData.length === 0) {
    return {
      avgHigh: null,
      avgLow: null,
      avgPrecip: null,
      conditionsSummary: 'No weather data available'
    };
  }

  const avgHigh = weatherData.reduce((sum, d) => sum + parseFloat(d.max_temp_c), 0) / weatherData.length;
  const avgLow = weatherData.reduce((sum, d) => sum + parseFloat(d.min_temp_c), 0) / weatherData.length;
  const avgPrecip = weatherData.reduce((sum, d) => sum + parseFloat(d.precip_mm), 0) / weatherData.length;

  // Generate conditions summary
  const rainyDays = weatherData.filter(d => d.conditions && d.conditions.toLowerCase().includes('rain')).length;
  const clearDays = weatherData.filter(d => d.conditions && d.conditions.toLowerCase().includes('clear')).length;

  let conditionsSummary = '';
  if (clearDays > weatherData.length / 2) {
    conditionsSummary = 'Mostly clear skies';
  } else if (rainyDays > weatherData.length / 2) {
    conditionsSummary = 'Expect frequent rain';
  } else {
    conditionsSummary = 'Mixed weather conditions';
  }

  return {
    avgHigh: parseFloat(avgHigh.toFixed(1)),
    avgLow: parseFloat(avgLow.toFixed(1)),
    avgPrecip: parseFloat(avgPrecip.toFixed(1)),
    conditionsSummary
  };
}
