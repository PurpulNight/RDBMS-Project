const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSeed() {
  console.log('🌱 Applying database/seed.sql to MySQL...');
  const seedPath = path.join(__dirname, 'seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error('❌ seed.sql not found at', seedPath);
    process.exit(1);
  }

  const seedSql = fs.readFileSync(seedPath, 'utf8');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'library_db',
      multipleStatements: true
    });

    await connection.query(seedSql);
    console.log('✅ seed.sql executed successfully! Database updated.');
    await connection.end();
  } catch (err) {
    console.error('❌ Error executing seed.sql:', err.message);
    process.exit(1);
  }
}

runSeed();
