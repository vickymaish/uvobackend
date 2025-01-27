require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const Order = require("./models/order"); // Import the Order model
const validate = require("./middleware/decodeJWT");
const authorization = require("./routes/authentication");
const logout = require("./routes/logout")

// Initialize the app
const app = express();

const corsOptions = {
  origin: "http://localhost:4001", // Replace with your frontend URL
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  credentials: true, // Allow cookies or Authorization headers
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());



app.use("/auth", authorization);
app.use("/auth", validate, logout)

// Order routes


// POST route to create a new order
app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, items, totalPrice } = req.body;
    const newOrder = new Order({ customerName, items, totalPrice });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: "Failed to create order" });
  }
});


// GET route to retrieve all orders
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
});

// Start the server
mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    app.listen(process.env.PORT, (req, res) => {
      console.log(req);
      console.log("Connected to db & listening on port 4000");
    });
  })
  .catch((err) => {
    console.error("error:", err);
  });
