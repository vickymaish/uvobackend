const mongoose = require('mongoose');

// Item schema for better tracking of individual items in an order
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

// Main order schema
const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },  // Customer name
  stats: { type: String, required: true },         // Stats (e.g., "Active", "Completed")
  deadline: { type: Date, required: true },        // Deadline (Date)
  pages: { type: Number, required: true },         // Number of pages
  topic: { type: String, required: true },         // Topic
  cpp: { type: Number, required: true },           // Cost per page
  totalPrice: { type: Number, required: true },    // Total price of the order
  status: { type: String, default: 'Pending' },    // Order status
});

module.exports = mongoose.model('Order', orderSchema);