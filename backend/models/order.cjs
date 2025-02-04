const mongoose = require('mongoose');

// // Item schema for better tracking of individual items in an order
// const itemSchema = new mongoose.Schema({
//   n: { type: String, required: true },
//   quantity: { type: Number, required: true },
//   price: { type: Number, required: true },
// });

// Main order schema
const orderSchema = new mongoose.Schema({
  OrderId: { type: Number, required: true },  // Customer name
  topicTitle: { type: String, required: true },
  discipline: { type: String, required: true },
  academicLevel: { type: String, required: true },         // Stats (e.g., "Active", "Completed")
  deadline: { type: Date, required: true },        // Deadline (Date)
  pages: { type: Number, required: true },         // Number of pages
  cost: { type: Number, required: true },         // Topic
  cpp: { type: Number, required: true },           // Cost per page
  bid: { type: Number, required: true },    // Total price of the order
  href: { type: String, default: 'Pending' },    // Order status
});

// Use export default for ES modules
//export default mongoose.model('Order', orderSchema);
module.exports = mongoose.model('Order', orderSchema);
