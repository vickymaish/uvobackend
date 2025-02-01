const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { login } = require('./modules/login.cjs');
const { scrapeOrders, scrapeOrderDetails } = require('./modules/scraper.cjs');
const { sendEmail } = require('./modules/email.cjs');
const { connectDB, saveOrders } = require('./modules/database.cjs');
const { randomDelay, delay } = require('./utils/helpers.cjs');
const logger = require('./utils/logger.cjs');
const config = require('./config/config.cjs');

puppeteer.use(StealthPlugin());

(async () => {
    // Launch Puppeteer browser with additional options
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        timeout: 400000,
        slowMo: 10,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    // Close the first tab opened by Chromium
    const pages = await browser.pages();
    if (pages.length > 0) {
        logger.info('Closing the first tab opened by Chromium...');
        await pages[0].close();
        logger.info('First tab closed successfully.');
    }

    // Set user agent
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    logger.info(`Setting user agent: ${userAgent}`);
    await page.setUserAgent(userAgent);

    try {
        // Log in using the first set of credentials
        await login(page, config.LOGIN_CREDENTIALS[0]);
        logger.info('Login successful.');

        // Connect to MongoDB
        await connectDB();
        logger.info('Connected to MongoDB.');

        let lastCheckedOrderId = null;

        const startScraping = async () => {
            const orders = await scrapeOrders(page, lastCheckedOrderId);
            if (orders.length > 0) {
                await saveOrders(orders);

                for (const order of orders) {
                    await sendEmail(`New Order: ${order.OrderId}`, JSON.stringify(order), config.LOGIN_CREDENTIALS[0].email, order);
                }

                lastCheckedOrderId = orders[0].OrderId;
            }
        };

        // Start interval-based scraping (every 5 minutes)
        const scrapeInterval = 300; // 5 minutes in milliseconds
        setInterval(startScraping, scrapeInterval);
        logger.info(`Scraping started. Checking for new orders every ${scrapeInterval / 1000} seconds.`);
    } catch (error) {
        logger.error('Error in main application:', { error: error.message });
    }
})();