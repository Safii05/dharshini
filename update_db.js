const { pool } = require('./backend/config/db');

async function updateSchema() {
  try {
    const connection = await pool.getConnection();
    console.log('Updating crops table schema...');
    
    // Add image column if it doesn't exist
    const [columns] = await connection.query('SHOW COLUMNS FROM crops LIKE "image"');
    if (columns.length === 0) {
      await connection.query('ALTER TABLE crops ADD COLUMN image VARCHAR(1000)');
      console.log('Added image column to crops table.');
    }

    // Seed initial data if table is empty or update existing placeholders
    const [rows] = await connection.query('SELECT count(*) as count FROM crops');
    if (rows[0].count === 0 || rows[0].count <= 3) {
      // Clear old dummy data if it's there
      await connection.query('DELETE FROM crops');
      await connection.query(`
        INSERT INTO crops (name, stage, health, type, image) VALUES 
        ('Tomatoes', 'Flowering', 'Healthy', 'Vegetable', '/crops/tomato.png'),
        ('Green Chillies', 'Harvesting', 'Healthy', 'Vegetable', '/crops/chilli.png'),
        ('Eggplant', 'Fruiting', 'At Risk', 'Vegetable', '/crops/eggplant.png'),
        ('Cabbage', 'Growth', 'Healthy', 'Vegetable', '/crops/cabbage.png')
      `);
      console.log('Seeded initial crop data with images.');
    }

    console.log('Schema update complete.');
    process.exit(0);
  } catch (err) {
    console.error('Schema update failed:', err);
    process.exit(1);
  }
}

updateSchema();
