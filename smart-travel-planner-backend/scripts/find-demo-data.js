import pool from './src/config/database.js';

async function findBestDemoData() {
  try {
    console.log('🔍 Finding best city combinations for demo...\n');

    // 1. Find cities with most weather data
    console.log('📊 Cities with weather data:');
    const [citiesWithWeather] = await pool.query(`
      SELECT l.name, l.country, COUNT(*) as weather_records,
             MIN(w.on_date) as earliest_date, MAX(w.on_date) as latest_date
      FROM Location l
      JOIN WeatherDaily w ON l.location_id = w.location_id
      GROUP BY l.location_id, l.name, l.country
      HAVING weather_records >= 7
      ORDER BY weather_records DESC
      LIMIT 10
    `);
    citiesWithWeather.forEach(c => {
      console.log(`  ${c.name}, ${c.country}: ${c.weather_records} records (${c.earliest_date.toISOString().split('T')[0]} to ${c.latest_date.toISOString().split('T')[0]})`);
    });

    // 2. Find flight routes that exist
    console.log('\n✈️  Available flight routes:');
    const [flightRoutes] = await pool.query(`
      SELECT
        l1.name as origin,
        l2.name as destination,
        COUNT(*) as num_flights,
        MIN(f.price) as min_price,
        MIN(f.depart_time) as earliest_flight
      FROM FlightOption f
      JOIN flight_origin fo ON f.flight_id = fo.flight_id
      JOIN flight_destination fd ON f.flight_id = fd.flight_id
      JOIN Location l1 ON fo.location_id = l1.location_id
      JOIN Location l2 ON fd.location_id = l2.location_id
      GROUP BY l1.name, l2.name
      ORDER BY num_flights DESC
      LIMIT 15
    `);
    flightRoutes.forEach(r => {
      console.log(`  ${r.origin} → ${r.destination}: ${r.num_flights} flights (from $${r.min_price})`);
    });

    // 3. Find cities with attractions
    console.log('\n🎭 Cities with attractions:');
    const [citiesWithAttractions] = await pool.query(`
      SELECT l.name, l.country, COUNT(*) as num_attractions
      FROM Location l
      JOIN Attraction a ON l.location_id = a.location_id
      GROUP BY l.location_id, l.name, l.country
      ORDER BY num_attractions DESC
      LIMIT 10
    `);
    citiesWithAttractions.forEach(c => {
      console.log(`  ${c.name}, ${c.country}: ${c.num_attractions} attractions`);
    });

    // 4. Find best combination
    console.log('\n\n🎯 RECOMMENDED DEMO QUERIES:\n');

    const [bestCombos] = await pool.query(`
      SELECT DISTINCT
        l1.name as origin,
        l2.name as destination,
        l2.country as dest_country,
        COUNT(DISTINCT f.flight_id) as num_flights,
        COUNT(DISTINCT w.weather_id) as weather_days,
        COUNT(DISTINCT a.attraction_id) as num_attractions,
        MIN(w.on_date) as earliest_date,
        MAX(w.on_date) as latest_date
      FROM FlightOption f
      JOIN flight_origin fo ON f.flight_id = fo.flight_id
      JOIN flight_destination fd ON f.flight_id = fd.flight_id
      JOIN Location l1 ON fo.location_id = l1.location_id
      JOIN Location l2 ON fd.location_id = l2.location_id
      LEFT JOIN WeatherDaily w ON l2.location_id = w.location_id
      LEFT JOIN Attraction a ON l2.location_id = a.location_id
      GROUP BY l1.location_id, l2.location_id, l1.name, l2.name, l2.country
      HAVING num_flights > 0 AND weather_days >= 7
      ORDER BY (num_flights + weather_days + num_attractions) DESC
      LIMIT 5
    `);

    bestCombos.forEach((combo, idx) => {
      const startDate = combo.earliest_date ? combo.earliest_date.toISOString().split('T')[0] : 'N/A';
      const endDate = combo.latest_date ? combo.latest_date.toISOString().split('T')[0] : 'N/A';
      console.log(`${idx + 1}. ${combo.origin} → ${combo.destination}, ${combo.dest_country}`);
      console.log(`   ✈️  Flights: ${combo.num_flights}`);
      console.log(`   🌤️  Weather: ${combo.weather_days} days (${startDate} to ${endDate})`);
      console.log(`   🎭 Attractions: ${combo.num_attractions}`);
      console.log('');
    });

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findBestDemoData();
