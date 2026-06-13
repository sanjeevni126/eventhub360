const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is missing!");
    process.exit(1);
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to Neon DB. Reading schema.sql...");
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log("Executing schema.sql...");
    await client.query(schemaSql);
    console.log("Schema successfully initialized!");
  } catch (err) {
    console.error("Initialization failed:", err);
  } finally {
    await client.end();
  }
}

run();
