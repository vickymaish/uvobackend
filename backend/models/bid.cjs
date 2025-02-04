const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  orderId: { type: String, required: true }, // Unique ID for the related order
  topicTitle: { type: String, required: true }, // Title of the bid/topic
  discipline: { type: String, required: true }, // Discipline related to the bid
  academicLevel: { type: String, required: true }, // Academic level of the bid
  deadline: { type: String, required: true }, // Deadline for the bid
  pages: { type: Number, required: true }, // Number of pages in the bid
  cost: { type: Number, required: true }, // Cost of the bid
  bid: { type: String, required: true }, // Bid amount
  href: { type: String, default: null }, // Link to the bid/order details
  createdAt: { type: Date, default: Date.now }, // Timestamp for bid creation
});

// Export the Bid model
module.exports = mongoose.model('Bid', bidSchema);
