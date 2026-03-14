const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });
const { initDB } = require('./config/db');

console.log("[Backend] Environment variables loaded.");
console.log("[Backend] GEMINI_API_KEY present:", process.env.GEMINI_API_KEY ? "Yes (Ends with " + process.env.GEMINI_API_KEY.slice(-4) + ")" : "No");
console.log("[Backend] OPENAI_API_KEY present:", process.env.OPENAI_API_KEY ? "Yes" : "No");

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Init
const initDBAsync = async () => {
  try {
    await initDB();
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.log('Server will continue without database connection.');
  }
};
initDBAsync();

// File Upload Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

app.use('/api', authRoutes);
app.use('/', aiRoutes(upload));
app.use('/api', userRoutes);
app.use('/api', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
