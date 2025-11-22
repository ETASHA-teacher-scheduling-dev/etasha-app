// Load environment variables from .env file
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const db = require("./models");
const apiRoutes = require("./routes/api.routes");


const app = express();

// CORS configuration - allow frontend from any origin in development, specific origin in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Allows frontend to communicate with this backend
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// API Routes
require('./routes/auth.routes')(app);
require('./routes/api.routes')(app);
app.use('/api/reports', require('./routes/reports'));
// Simple root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the ETASHA scheduling API." });
});

// Sync database and start server
db.sequelize.sync({ force: false }).then(() => {
  console.log("Database synced - tables created if they don't exist.");
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
});