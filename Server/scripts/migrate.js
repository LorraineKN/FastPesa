const { pool } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

(async () => {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Migrated ${file}`);
  }
  process.exit();
})();