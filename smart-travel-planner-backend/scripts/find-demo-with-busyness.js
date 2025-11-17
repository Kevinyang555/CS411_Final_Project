import pool from './src/config/database.js';

async function findDemoWithBusyness() {
  try {
    console.log('🔍 Finding best demo data with busyness index...\n');

    // Find locations that have attractions with busyness data
    console.log('📍 Cities with attractions that have busyness data:\n');
    const [citiesWithBusyness] = await pool.query(`
      SELECT
        l.location_id,
        l.name as city,
        l.country,
        COUNT(DISTINCT a.attraction_id) as num_attractions_with_busyness,
        GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as attraction_names
      FROM Location l
      JOIN Attraction a ON l.location_id = a.location_id
      JOIN AttractionPopularity ap ON a.attraction_id = ap.attraction_id
      GROUP BY l.location_id, l.name, l.country
      ORDER BY num_attractions_with_busyness DESC
    `);

    citiesWithBusyness.forEach(c => {
      console.log(`${c.city}, ${c.country} (ID: ${c.location_id})`);
      console.log(`  Attractions with busyness: ${c.num_attractions_with_busyness}`);
      console.log(`  Names: ${c.attraction_names}`);
      console.log('');
    });

    // Now find flight routes TO these cities with complete data
    console.log('\n🎯 RECOMMENDED DEMO QUERIES (with busyness data):\n');

    const [bestCombos] = await pool.query(`
      SELECT DISTINCT
        l1.name as origin,
        l2.name as destination,
        l2.location_id as dest_id,
        l2.country as dest_country,
        COUNT(DISTINCT f.flight_id) as num_flights,
        COUNT(DISTINCT w.weather_id) as weather_days,
        COUNT(DISTINCT a.attraction_id) as num_attractions,
        COUNT(DISTINCT ap.pop_id) as busyness_data_points,
        MIN(w.on_date) as earliest_date,
        MAX(w.on_date) as latest_date,
        MIN(f.price) as min_flight_price
      FROM FlightOption f
      JOIN flight_origin fo ON f.flight_id = fo.flight_id
      JOIN flight_destination fd ON f.flight_id = fd.flight_id
      JOIN Location l1 ON fo.location_id = l1.location_id
      JOIN Location l2 ON fd.location_id = l2.location_id
      LEFT JOIN WeatherDaily w ON l2.location_id = w.location_id
      LEFT JOIN Attraction a ON l2.location_id = a.location_id
      LEFT JOIN AttractionPopularity ap ON a.attraction_id = ap.attraction_id
      GROUP BY l1.location_id, l2.location_id, l1.name, l2.name, l2.country
      HAVING num_flights > 0 AND weather_days >= 7 AND busyness_data_points > 0
      ORDER BY busyness_data_points DESC, num_flights DESC
      LIMIT 10
    `);

    bestCombos.forEach((combo, idx) => {
      const startDate = combo.earliest_date ? combo.earliest_date.toISOString().split('T')[0] : 'N/A';
      const endDate = combo.latest_date ? combo.latest_date.toISOString().split('T')[0] : 'N/A';
      console.log(`${idx + 1}. ${combo.origin} → ${combo.destination}, ${combo.dest_country}`);
      console.log(`   ✈️  Flights: ${combo.num_flights} (from $${combo.min_flight_price})`);
      console.log(`   🌤️  Weather: ${combo.weather_days} days (${startDate} to ${endDate})`);
      console.log(`   🎭 Attractions: ${combo.num_attractions}`);
      console.log(`   📊 Busyness data: ${combo.busyness_data_points} data points`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

findDemoWithBusyness();
