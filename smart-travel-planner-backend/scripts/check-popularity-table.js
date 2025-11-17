import pool from './src/config/database.js';

async function checkPopularityTable() {
  try {
    console.log('🔍 Checking AttractionPopularity table...\n');

    // Check if table exists
    const [tables] = await pool.query(`
      SHOW TABLES LIKE 'AttractionPopularity'
    `);

    if (tables.length === 0) {
      console.log('❌ AttractionPopularity table does not exist');
      await pool.end();
      return;
    }

    console.log('✅ AttractionPopularity table exists!\n');

    // Get table structure
    console.log('Table structure:');
    const [columns] = await pool.query('DESCRIBE AttractionPopularity');
    console.table(columns);

    // Get sample data
    console.log('\nSample data (first 10 rows):');
    const [sampleData] = await pool.query(`
      SELECT * FROM AttractionPopularity LIMIT 10
    `);
    console.table(sampleData);

    // Check if we have data for Bengbu attractions
    console.log('\nBengbu attraction busyness data:');
    const [bengbuData] = await pool.query(`
      SELECT
        a.attraction_id,
        a.name,
        a.category,
        ap.busyness_index,
        ap.on_date
      FROM Attraction a
      LEFT JOIN AttractionPopularity ap ON a.attraction_id = ap.attraction_id
      WHERE a.location_id = 244
      LIMIT 20
    `);
    console.table(bengbuData);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkPopularityTable();
