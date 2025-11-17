import pool from './src/config/database.js';

async function testShangraoToTokyo() {
  try {
    console.log('🧪 Testing Shangrao → Tokyo query with busyness data\n');
    console.log('=' .repeat(70));

    // Get location IDs
    const [shangrao] = await pool.query(
      'SELECT location_id, name, country FROM Location WHERE name LIKE ? LIMIT 1',
      ['%Shangrao%']
    );

    const [tokyo] = await pool.query(
      'SELECT location_id, name, country FROM Location WHERE name LIKE ? LIMIT 1',
      ['%Tokyo%']
    );

    console.log(`Origin: ${shangrao[0].name}, ${shangrao[0].country} (ID: ${shangrao[0].location_id})`);
    console.log(`Destination: ${tokyo[0].name}, ${tokyo[0].country} (ID: ${tokyo[0].location_id})\n`);

    // Test the new attractions query with busyness
    console.log('🎭 Testing attractions with busyness index:\n');

    const [attractions] = await pool.query(
      `SELECT
        a.attraction_id AS id,
        a.name,
        a.category,
        a.rating,
        a.lat,
        a.lon,
        AVG(ap.busyness_index) AS avg_busyness,
        COUNT(ap.pop_id) AS busyness_data_points
       FROM Attraction a
       LEFT JOIN AttractionPopularity ap ON a.attraction_id = ap.attraction_id
       WHERE a.location_id = ?
       GROUP BY a.attraction_id, a.name, a.category, a.rating, a.lat, a.lon
       LIMIT 20`,
      [tokyo[0].location_id]
    );

    console.log(`Found ${attractions.length} attractions in Tokyo:\n`);

    attractions.forEach((a, idx) => {
      const rating = a.rating ? parseFloat(a.rating).toFixed(1) : 'N/A';
      const busyness = a.avg_busyness ? Math.round(parseFloat(a.avg_busyness)) : null;
      const dataPoints = a.busyness_data_points || 0;

      console.log(`${idx + 1}. ${a.name}`);
      console.log(`   Category: ${a.category}`);
      console.log(`   Rating: ${rating}`);
      console.log(`   Busyness Index: ${busyness !== null ? busyness + '/100' : 'No data'}`);
      console.log(`   Data Points: ${dataPoints} (${dataPoints / 24} days of hourly data)`);
      console.log('');
    });

    // Test the full trip query
    console.log('\n✈️  Testing flight query:\n');

    const [flights] = await pool.query(
      `SELECT
        f.flight_id,
        f.carrier_code,
        f.flight_number,
        f.price,
        f.currency,
        l1.name AS origin_city,
        l2.name AS destination_city
       FROM FlightOption f
       JOIN flight_origin fo ON f.flight_id = fo.flight_id
       JOIN flight_destination fd ON f.flight_id = fd.flight_id
       JOIN Location l1 ON fo.location_id = l1.location_id
       JOIN Location l2 ON fd.location_id = l2.location_id
       WHERE fo.location_id = ? AND fd.location_id = ?
       ORDER BY f.price ASC
       LIMIT 5`,
      [shangrao[0].location_id, tokyo[0].location_id]
    );

    console.log(`Found ${flights.length} flight(s):`);
    flights.forEach(f => {
      console.log(`  ${f.carrier_code}${f.flight_number}: $${f.price} ${f.currency}`);
    });

    console.log('\n\n✅ DEMO QUERY READY!');
    console.log('=' .repeat(70));
    console.log('USE THIS IN YOUR DEMO:\n');
    console.log('  Origin: Shangrao');
    console.log('  Destination: Tokyo');
    console.log('  Start Date: 2025-10-20');
    console.log('  End Date: 2025-10-26');
    console.log('  Budget: 1000 USD');
    console.log('  Temperature: 60-80°F');
    console.log('  Max Flight Price: 500 USD\n');
    console.log('EXPECTED RESULTS:');
    console.log(`  ✈️  ${flights.length} flight(s)`);
    console.log('  🌤️  7 days of weather');
    console.log(`  🎭 ${attractions.length} attractions`);
    console.log(`  📊 ${attractions.filter(a => a.avg_busyness !== null).length} attractions with busyness data`);
    console.log('=' .repeat(70));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testShangraoToTokyo();
