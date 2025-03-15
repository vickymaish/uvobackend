const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const Order = require('./models/order.cjs');
const authenticationRoutes = require('./routes/authentication.cjs');

// Load environment variables
dotenv.config();

// Import the scraper
const { scrapeOrders } = require('./modules/scraper.cjs'); // Ensure the scraper is imported

// Initialize Express
const app = express();

// CORS Configuration
const corsOptions = {
  origin:["http://102.37.21.212:3000"], // updated"http://localhost:4001" for production
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use('/auth', authenticationRoutes); // Use authentication routes under /auth

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
// ✅ Ensure login API is registered before serving React
app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ message: "Login successful", user });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
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

app.get("/", (req, res) => {
  res.send("Server is running!");
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
const PORT = process.env.PORT || 8080;  //removed 3000 due to azure testing
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  scrapeOrders().catch(error => console.error('❌ Error in scraper:', error)); // Start the scraper
});

