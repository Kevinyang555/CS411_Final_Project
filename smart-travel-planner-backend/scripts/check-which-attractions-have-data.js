import pool from './src/config/database.js';

async function checkWhichAttractionsHaveData() {
  try {
    console.log('🔍 Finding which attractions have busyness data...\n');

    // Get unique attraction IDs with busyness data
    const [attractionsWithData] = await pool.query(`
      SELECT DISTINCT
        ap.attraction_id,
        a.name,
        a.category,
        COUNT(*) as data_points,
        MIN(ap.on_date) as earliest_date,
        MAX(ap.on_date) as latest_date,
        AVG(ap.busyness_index) as avg_busyness
      FROM AttractionPopularity ap
      LEFT JOIN Attraction a ON ap.attraction_id = a.attraction_id
      GROUP BY ap.attraction_id, a.name, a.category
      ORDER BY ap.attraction_id
      LIMIT 20
    `);

    console.log(`Found ${attractionsWithData.length} attractions with busyness data:\n`);
    attractionsWithData.forEach(a => {
      const name = a.name || `Unknown (ID: ${a.attraction_id})`;
      const earliest = a.earliest_date ? a.earliest_date.toISOString().split('T')[0] : 'N/A';
      const latest = a.latest_date ? a.latest_date.toISOString().split('T')[0] : 'N/A';
      console.log(`  Attraction ID ${a.attraction_id}: ${name}`);
      console.log(`    Category: ${a.category || 'Unknown'}`);
      console.log(`    Data points: ${a.data_points}`);
      console.log(`    Date range: ${earliest} to ${latest}`);
      console.log(`    Average busyness: ${a.avg_busyness ? parseFloat(a.avg_busyness).toFixed(1) : 'N/A'}`);
      console.log('');
    });

    // Check total count
    const [countResult] = await pool.query(`
      SELECT COUNT(DISTINCT attraction_id) as total_attractions
      FROM AttractionPopularity
    `);
    console.log(`Total attractions with busyness data: ${countResult[0].total_attractions}\n`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkWhichAttractionsHaveData();
