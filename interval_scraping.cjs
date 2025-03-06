require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const mongoose = require('mongoose');
const { scrapeOrders } = require('./scraper.cjs'); // Import scraping functions
const logger = require('./utils/logger.cjs');

// Use the Puppeteer stealth plugin
puppeteer.use(StealthPlugin());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('Error connecting to MongoDB:', { error: err.message }));

let lastCheckedOrderId = null; // Store the last processed order ID

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
        timeout: 400000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    // Set user agent
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    await page.setUserAgent(userAgent);

    // Start interval-based scraping
    const scrapeInterval = 30000; // Scrape every 30 seconds
    setInterval(async () => {
        try {
            logger.info('Starting a new scrape cycle...');
            const newOrders = await scrapeOrders(page, lastCheckedOrderId);
            if (newOrders.length > 0) {
                logger.info(`Found ${newOrders.length} new orders.`);
                lastCheckedOrderId = newOrders[0].OrderId; // Update lastCheckedOrderId
            } else {
                logger.info('No new orders found.');
            }
        } catch (error) {
            logger.error('Error during scrape cycle:', { error: error.message });
        }
    }, scrapeInterval);
})();