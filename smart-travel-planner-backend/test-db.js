import pool from './src/config/database.js';

async function test() {
  try {
    // Check Attraction table structure
    const [columns] = await pool.query('DESCRIBE Attraction');
    console.log('Attraction table columns:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

test();
