import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import path from 'path';
import open from 'open';
import Order from './models/order.cjs'; // Same model for both orders and bids
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Fix for `__dirname` in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Log the MONGO_URI to check if it's being read correctly
console.log('MONGO_URI:', process.env.MONGO_URI);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI.trim(), { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Order routes

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});