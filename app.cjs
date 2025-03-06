require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { startScraping } = require('./interval_scraping.cjs');
const connectDB = require('./db.cjs');
const { sendEmail } = require('./email.cjs');
const { randomDelay, saveCookies } = require('./puppeteerUtils.cjs');
const { scrapeOrders, clickTakeOrderButton } = require('./orderScraper.cjs');
const { LOGIN_EMAIL, LOGIN_PASSWORD, BUTTON_SELECTOR, LOGIN_EMAIL_SELECTOR, LOGIN_PASSWORD_SELECTOR } = require('./config.cjs');
const { loadCookies } = require('./utils/puppeteerUtils.cjs');
const logger = require('./utils/logger.cjs');

// Use the Puppeteer stealth plugin
puppeteer.use(StealthPlugin());

(async () => {
    // Launch Puppeteer browser in headless mode
    const browser = await puppeteer.launch({
        headless: true, // Run in headless mode for scraping
        executablePath: process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
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
        await pages[0].close();
    }

    // Set user agent
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    logger.info(`Setting user agent: ${userAgent}`);
    await page.setUserAgent(userAgent);

    try {
        // Load saved cookies
        logger.info('Loading saved cookies...');
        const cookiesLoaded = await loadCookies(page, './cookies.json');
        if (!cookiesLoaded) {
            logger.error('No saved cookies found. Please log in manually using login.cjs.');
            return;
        }

        // Navigate to the available orders page
        logger.info('Navigating to available orders page...');
        await page.goto('https://www.uvocorp.com/orders/available.html', { waitUntil: 'domcontentloaded' });

        // Check if the session is still valid
        const currentUrl = page.url();
        const loginUrl = 'https://www.uvocorp.com/login.html';
        if (currentUrl === loginUrl) {
            logger.error('Session expired. Please log back in using login.cjs.');
            return;
        }

        logger.info('Successfully logged in using saved cookies.');

        // Start interval-based scraping
        const scrapeInterval = 30000; // 30 seconds
        startScraping(page, scrapeInterval);

        // Monitor DOM changes for debugging
        page.on('console', msg => {
            logger.info(`DOM Console Message: ${msg.text()}`);
        });

        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('/orders/available')) {
                logger.info(`Response received from: ${url}`);
                const status = response.status();
                logger.info(`Status Code: ${status}`);
                if (status === 200) {
                    const body = await response.text();
                    if (body.includes('No orders available')) {
                        logger.warn('No orders available on the page.');
                    }
                }
            }
        });

    } catch (error) {
        logger.error(`Error during execution: ${error.message}`);
    }
})();