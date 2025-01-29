import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser'; // Import cookie parser
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import path from 'path';
import dotenv from 'dotenv';
import Order from './models/order.cjs'; // Same model for both orders and bids
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Fix for `__dirname` in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// MongoDB connection
console.log('MONGO_URIlocal:', process.env.MONGO_URIlocal);
mongoose.connect(process.env.MONGO_URIlocal.trim(), { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// POST route to create a new order or bid
app.post('/api/orders', async (req, res) => {
  try {
    const { orderId, topicTitle, discipline, academicLevel, deadline, pages, cost, bid, href } = req.body;
    const newOrder = new Order({ orderId, topicTitle, discipline, academicLevel, deadline, pages, cost, bid, href });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error creating order/bid:', err);
    res.status(400).json({ error: 'Failed to create order/bid' });
  }
});

// GET route to retrieve all orders or bids
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error retrieving orders/bids:', err);
    res.status(500).json({ error: 'Failed to retrieve orders/bids' });
  }
});

// GET route to retrieve orders or bids by orderId
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await Order.find({ orderId });
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error retrieving orders/bids for orderId:', err);
    res.status(500).json({ error: 'Failed to retrieve orders/bids for the order' });
  }
});

// Start the server
app.listen(process.env.PORT || 4000, () => {
  console.log("Connected to db & listening on port", process.env.PORT || 4000);
});
