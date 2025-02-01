const mongoose = require('mongoose');
const Order = require('../models/order.cjs');
const config = require('../config/config.cjs');
const logger = require('../utils/logger.cjs');

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO.LOCAL_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Error connecting to MongoDB:', { error: error.message });
        throw error;
    }
};

const saveOrders = async (orders) => {
    try {
        await Order.insertMany(orders);
        logger.info(`${orders.length} orders saved to MongoDB.`);
    } catch (error) {
        logger.error('Error saving orders to MongoDB:', { error: error.message });
        throw error;
    }
};

module.exports = { connectDB, saveOrders };