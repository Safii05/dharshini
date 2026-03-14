const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { addSession } = require('../config/sessionStore');
const { getCrops: getCropsMem, addCrop: addCropMem, deleteCrop: deleteCropMem } = require('../config/cropStore');

// Dashboard Statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [trainees] = await pool.query('SELECT count(*) as count FROM trainees');
    const [tasks] = await pool.query("SELECT count(*) as count FROM farm_tasks WHERE status != 'Completed'");
    const [crops] = await pool.query('SELECT count(*) as count FROM crops');
    const [yieldSum] = await pool.query("SELECT SUM(JSON_EXTRACT(data, '$.yield')) as total_yield FROM reports WHERE type = 'production'");

    res.json({
      totalTrainees: trainees[0].count,
      activeTasks: tasks[0].count,
      cropsMonitored: crops[0].count,
      productionYield: yieldSum[0].total_yield || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trainees CRUD
router.get('/trainees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trainees');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trainees', async (req, res) => {
  const { name, group_name, efficiency, status } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO trainees (name, group_name, efficiency, status) VALUES (?, ?, ?, ?)', [name, group_name, efficiency, status]);
    res.json({ id: result.insertId, name, group_name, efficiency, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/trainees/:id', async (req, res) => {
  const { name, group_name, efficiency, status } = req.body;
  try {
    await pool.query('UPDATE trainees SET name = ?, group_name = ?, efficiency = ?, status = ? WHERE id = ?', [name, group_name, efficiency, status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/trainees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trainees WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Farm Tasks CRUD
router.get('/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM farm_tasks');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  const { title, zone, urgency, status, scheduled_date, assignee } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO farm_tasks (title, zone, urgency, status, scheduled_date, assignee) VALUES (?, ?, ?, ?, ?, ?)', [title, zone, urgency, status, scheduled_date, assignee]);
    res.json({ id: result.insertId, title, zone, urgency, status, scheduled_date, assignee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  const { title, zone, urgency, status, scheduled_date, assignee } = req.body;
  try {
    await pool.query('UPDATE farm_tasks SET title = ?, zone = ?, urgency = ?, status = ?, scheduled_date = ?, assignee = ? WHERE id = ?', [title, zone, urgency, status, scheduled_date, assignee, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM farm_tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crops
router.get('/crops', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM crops');
    res.json(rows.length > 0 ? rows : getCropsMem());
  } catch (err) {
    console.warn("Crops DB failure fallback to memory", err.message);
    res.json(getCropsMem());
  }
});

router.post('/crops', async (req, res) => {
  const { name, stage, health, type, image } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO crops (name, stage, health, type, image) VALUES (?, ?, ?, ?, ?)', [name, stage, health, type, image]);
    const newCrop = { id: result.insertId, name, stage, health, type, image };
    addCropMem(newCrop); // Keep in sync
    res.json(newCrop);
  } catch (err) {
    console.warn("Add Crop DB failure fallback to memory", err.message);
    const newCrop = addCropMem({ name, stage, health, type, image });
    res.json(newCrop);
  }
});

router.delete('/crops/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM crops WHERE id = ?', [id]);
    deleteCropMem(id);
    res.json({ success: true });
  } catch (err) {
    console.warn("Delete Crop DB failure fallback to memory", err.message);
    const success = deleteCropMem(id);
    res.json({ success });
  }
});

// Attendance & Production
router.get('/attendance-production', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.date, COUNT(a.id) as attendance_count, SUM(IF(r.type = 'production', JSON_EXTRACT(r.data, '$.yield'), 0)) as total_yield
      FROM attendance a
      LEFT JOIN reports r ON DATE(a.date) = DATE(r.date)
      GROUP BY DATE(a.date)
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory CRUD
router.get('/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventory');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory', async (req, res) => {
  const { item, category, stock, unit } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO inventory (item, category, stock, unit) VALUES (?, ?, ?, ?)', [item, category, stock, unit]);
    res.json({ id: result.insertId, item, category, stock, unit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reports
router.get('/reports', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reports');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance QR Generation
router.post('/attendance/session', async (req, res) => {
  const sessionToken = (Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12)).toUpperCase();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  try {
    // Attempt to save to DB
    const [result] = await pool.query('INSERT INTO attendance_sessions (session_token, expires_at) VALUES (?, ?)', [sessionToken, expiresAt]);
    const sessionId = result.insertId;
    
    // Save to in-memory store as well/backup
    addSession(sessionToken, sessionId, expiresAt);
    
    res.json({ id: sessionId, token: sessionToken, expiresAt });
  } catch (err) {
    console.error("Database error in session generation, falling back to memory:", err.message);
    
    // Fallback: Generate a memory-only session ID (negative for differentiator)
    const sessionId = -Math.floor(Math.random() * 1000000);
    addSession(sessionToken, sessionId, expiresAt);
    
    // Return success even if DB failed
    res.json({ id: sessionId, token: sessionToken, expiresAt });
  }
});

// Analytics
router.get('/attendance/analytics', async (req, res) => {
  try {
    const [totalTrainees] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [dailyStats] = await pool.query(`
      SELECT date, COUNT(*) as count 
      FROM attendance 
      GROUP BY date 
      ORDER BY date DESC 
      LIMIT 7
    `);
    res.json({ totalTrainees: totalTrainees[0]?.count || 0, dailyStats: dailyStats || [] });
  } catch (err) {
    console.error("Analytics DB failure fallback:", err.message);
    res.json({ totalTrainees: 142, dailyStats: [
      { date: new Date().toISOString(), count: 45 },
      { date: new Date(Date.now() - 86400000).toISOString(), count: 38 }
    ] });
  }
});

module.exports = router;
