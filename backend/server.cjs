const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const Order = require('./models/order.cjs');

// Load environment variables
dotenv.config();

// Import the scraper
//require('./interval_scraping.cjs'); // This ensures the scraper starts

// Initialize Express
const app = express();

// CORS Configuration
const corsOptions = {
  origin: "http://localhost:4001", // Update this for production
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URIlocal; // Ensure correct env variable
if (!MONGO_URI) {
  console.error("MONGO_URI is not set in .env file!");
  process.exit(1); // Exit if no database URL is provided
}

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Stop the server if DB connection fails
  });

// Routes

// Create an order
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(400).json({ error: "Failed to create order" });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error retrieving orders:", err);
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
});

// Get orders by ID
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await Order.find({ orderId });
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error retrieving orders by ID:", err);
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
