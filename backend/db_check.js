require('dotenv').config();
const { pool } = require('./src/config/db');

async function run() {
  try {
    console.log("Checking employee_profiles columns...");
    const cols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employee_profiles'
    `);
    const colNames = cols.rows.map(r => r.column_name);
    console.log("Current columns:", colNames);

    if (!colNames.includes('working_mode')) {
      console.log("Adding working_mode column...");
      await pool.query(`
        ALTER TABLE employee_profiles 
        ADD COLUMN working_mode VARCHAR(50) DEFAULT 'Onsite'
      `);
      console.log("Column working_mode added successfully.");
    } else {
      console.log("working_mode column already exists.");
    }

    // Update existing records with some sample values for testing if they are empty
    console.log("Updating working_modes for existing records...");
    await pool.query(`UPDATE employee_profiles SET working_mode = 'Hybrid' WHERE id % 3 = 0`);
    await pool.query(`UPDATE employee_profiles SET working_mode = 'Remote' WHERE id % 3 = 1`);
    await pool.query(`UPDATE employee_profiles SET working_mode = 'Onsite' WHERE id % 3 = 2`);

    // Ensure cities (address) are filled with some Indian cities like Pune, Indore, Mumbai etc.
    await pool.query(`UPDATE employee_profiles SET address = 'Pune' WHERE id % 4 = 0 AND (address IS NULL OR address = '')`);
    await pool.query(`UPDATE employee_profiles SET address = 'Indore' WHERE id % 4 = 1 AND (address IS NULL OR address = '')`);
    await pool.query(`UPDATE employee_profiles SET address = 'Mumbai' WHERE id % 4 = 2 AND (address IS NULL OR address = '')`);
    await pool.query(`UPDATE employee_profiles SET address = 'Bengaluru' WHERE id % 4 = 3 AND (address IS NULL OR address = '')`);

    console.log("Schema check completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
