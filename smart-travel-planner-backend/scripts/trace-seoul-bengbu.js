import pool from './src/config/database.js';

/**
 * Trace the exact execution flow for Seoul → Bengbu query
 * Shows step-by-step what happens when user submits this trip
 */

async function traceSeoulToBengbu() {
  console.log('🔍 TRACING: Seoul → Bengbu Query Execution\n');
  console.log('=' .repeat(70));
  console.log('USER INPUT:');
  console.log('  Origin: Seoul');
  console.log('  Destination: Bengbu');
  console.log('  Start Date: 2025-10-20');
  console.log('  End Date: 2025-10-26');
  console.log('  Budget: 1000 USD');
  console.log('  Temp Range: 60-80°F (15.6-26.7°C)');
  console.log('  Max Flight Price: 500 USD');
  console.log('=' .repeat(70));

  try {
    // STEP 1: Find Location IDs
    console.log('\n📍 STEP 1: Looking up location IDs...\n');

    console.log('SQL Query for Origin:');
    console.log('  SELECT location_id, name, country, lat, lon');
    console.log('  FROM Location');
    console.log('  WHERE name LIKE "%Seoul%"');
    console.log('  LIMIT 1\n');

    const [originResults] = await pool.query(
      'SELECT location_id, name, country, lat, lon FROM Location WHERE name LIKE ? LIMIT 1',
      ['%Seoul%']
    );

    console.log('Result:');
    console.log('  ', originResults[0]);
    const originId = originResults[0].location_id;

    console.log('\nSQL Query for Destination:');
    console.log('  SELECT location_id, name, country, lat, lon');
    console.log('  FROM Location');
    console.log('  WHERE name LIKE "%Bengbu%"');
    console.log('  LIMIT 1\n');

    const [destResults] = await pool.query(
      'SELECT location_id, name, country, lat, lon FROM Location WHERE name LIKE ? LIMIT 1',
      ['%Bengbu%']
    );

    console.log('Result:');
    console.log('  ', destResults[0]);
    const destId = destResults[0].location_id;

    // STEP 2: Get Weather Data
    console.log('\n\n🌤️  STEP 2: Fetching weather data for Bengbu...\n');

    console.log('SQL Query:');
    console.log('  SELECT on_date, min_temp_c, max_temp_c, precip_mm, conditions');
    console.log('  FROM WeatherDaily');
    console.log(`  WHERE location_id = ${destId}`);
    console.log('  AND on_date BETWEEN "2025-10-20" AND "2025-10-26"');
    console.log('  ORDER BY on_date\n');

    const [weatherData] = await pool.query(
      `SELECT on_date, min_temp_c, max_temp_c, precip_mm, conditions
       FROM WeatherDaily
       WHERE location_id = ? AND on_date BETWEEN ? AND ?
       ORDER BY on_date`,
      [destId, '2025-10-20', '2025-10-26']
    );

    console.log(`Results: ${weatherData.length} days of weather data`);
    weatherData.forEach(day => {
      const date = day.on_date.toISOString().split('T')[0];
      const minF = ((day.min_temp_c * 9) / 5 + 32).toFixed(1);
      const maxF = ((day.max_temp_c * 9) / 5 + 32).toFixed(1);
      console.log(`  ${date}: ${minF}°F - ${maxF}°F, ${day.precip_mm}mm, ${day.conditions}`);
    });

    // Calculate averages
    const avgHigh = weatherData.reduce((sum, d) => sum + parseFloat(d.max_temp_c), 0) / weatherData.length;
    const avgLow = weatherData.reduce((sum, d) => sum + parseFloat(d.min_temp_c), 0) / weatherData.length;
    const avgPrecip = weatherData.reduce((sum, d) => sum + parseFloat(d.precip_mm), 0) / weatherData.length;

    console.log('\nWeather Summary:');
    console.log(`  Average High: ${avgHigh.toFixed(1)}°C (${((avgHigh * 9) / 5 + 32).toFixed(1)}°F)`);
    console.log(`  Average Low: ${avgLow.toFixed(1)}°C (${((avgLow * 9) / 5 + 32).toFixed(1)}°F)`);
    console.log(`  Average Precipitation: ${avgPrecip.toFixed(1)}mm`);

    // STEP 3: Get Flights
    console.log('\n\n✈️  STEP 3: Finding flights from Seoul to Bengbu...\n');

    console.log('SQL Query:');
    console.log('  SELECT f.flight_id, f.carrier_code, f.flight_number,');
    console.log('         f.price, f.currency, f.depart_time, f.arrive_time,');
    console.log('         l1.name AS origin_city, l2.name AS destination_city');
    console.log('  FROM FlightOption f');
    console.log('  JOIN flight_origin fo ON f.flight_id = fo.flight_id');
    console.log('  JOIN flight_destination fd ON f.flight_id = fd.flight_id');
    console.log('  JOIN Location l1 ON fo.location_id = l1.location_id');
    console.log('  JOIN Location l2 ON fd.location_id = l2.location_id');
    console.log(`  WHERE fo.location_id = ${originId} AND fd.location_id = ${destId}`);
    console.log('  AND f.price <= 500');
    console.log('  ORDER BY f.price ASC');
    console.log('  LIMIT 15\n');

    const [flights] = await pool.query(
      `SELECT f.flight_id, f.carrier_code, f.flight_number,
              f.price, f.currency, f.depart_time, f.arrive_time,
              l1.name AS origin_city, l2.name AS destination_city
       FROM FlightOption f
       JOIN flight_origin fo ON f.flight_id = fo.flight_id
       JOIN flight_destination fd ON f.flight_id = fd.flight_id
       JOIN Location l1 ON fo.location_id = l1.location_id
       JOIN Location l2 ON fd.location_id = l2.location_id
       WHERE fo.location_id = ? AND fd.location_id = ?
       AND f.price <= ?
       ORDER BY f.price ASC
       LIMIT 15`,
      [originId, destId, 500]
    );

    console.log(`Results: ${flights.length} flights found`);
    flights.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.carrier_code}${f.flight_number}: $${f.price} ${f.currency}`);
      console.log(`     Departs: ${f.depart_time}, Arrives: ${f.arrive_time}`);
    });

    // STEP 4: Get Attractions
    console.log('\n\n🎭 STEP 4: Loading attractions in Bengbu...\n');

    console.log('SQL Query:');
    console.log('  SELECT attraction_id AS id, name, category, rating, lat, lon');
    console.log('  FROM Attraction');
    console.log(`  WHERE location_id = ${destId}`);
    console.log('  LIMIT 20\n');

    const [attractions] = await pool.query(
      `SELECT attraction_id AS id, name, category, rating, lat, lon
       FROM Attraction
       WHERE location_id = ?
       LIMIT 20`,
      [destId]
    );

    console.log(`Results: ${attractions.length} attractions found`);
    attractions.forEach((a, idx) => {
      const rating = a.rating ? parseFloat(a.rating).toFixed(1) : 'N/A';
      console.log(`  ${idx + 1}. ${a.name}`);
      console.log(`     Category: ${a.category}, Rating: ${rating}`);
    });

    // STEP 5: Build Response
    console.log('\n\n📦 STEP 5: Building API response...\n');
    console.log('Response Structure:');
    console.log('  {');
    console.log('    location: { name, country }');
    console.log(`    weatherSummary: { avgHigh, avgLow, avgPrecip, conditionsSummary }`);
    console.log(`    weatherDaily: [${weatherData.length} days]`);
    console.log(`    flights: [${flights.length} options]`);
    console.log(`    attractions: [${attractions.length} places]`);
    console.log('    bestTimeToVisit: { label, explanation }');
    console.log('  }');

    console.log('\n\n✅ COMPLETE! This JSON response is sent back to the React frontend.');
    console.log('   Frontend displays it in the Trip Summary tab.\n');

    await pool.end();

  } catch (error) {
    console.error('\n❌ Error during trace:', error.message);
    await pool.end();
    process.exit(1);
  }
}

traceSeoulToBengbu();
