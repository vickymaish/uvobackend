const mongoose = require('mongoose');
const config = require('../config/config.cjs');
const logger = require('../utils/logger.cjs');

const connectDB = async () => {
    const dbURI = config.MONGO.URI || config.MONGO.LOCAL_URI;

    try {
        await mongoose.connect(dbURI);
        logger.info(`Connected to MongoDB: ${dbURI}`);
    } catch (error) {
        logger.error('Error connecting to MongoDB:', { error: error.message });
        process.exit(1); // Stop app if DB fails
    }
};

module.exports = { connectDB };
