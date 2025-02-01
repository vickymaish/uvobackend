const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { randomDelay, saveCookies } = require('../utils/helpers.cjs');
const config = require('../config/config.cjs');
const logger = require('../utils/logger.cjs');

puppeteer.use(StealthPlugin());

const login = async (credentials) => {
    let browser;
    try {
        logger.info('Launching browser...');

        // Start browser in non-headless mode for manual CAPTCHA solving
        browser = await puppeteer.launch({
            headless: false,  // Open in non-headless mode for CAPTCHA solving
            executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
            devtools: true,   // Enable DevTools for debugging
        });

        const page = await browser.newPage();
        logger.info('Navigating to login page...');
        await page.goto('https://www.uvocorp.com/login.html', { waitUntil: 'load' });

        // Accept cookies if needed
        if (config.SELECTORS.BUTTON) {
            try {
                logger.info('Waiting for "Accept Cookies" button...');
                await page.waitForSelector(config.SELECTORS.BUTTON, { timeout: 5000 });
                await page.click(config.SELECTORS.BUTTON);
                logger.info('"Accept Cookies" button clicked successfully.');
            } catch (e) {
                logger.warn('No "Accept Cookies" button found or already accepted.');
            }
        }

        // Wait for login fields to appear
        logger.info('Waiting for login email field...');
        await page.waitForSelector(config.SELECTORS.LOGIN_EMAIL, { timeout: 10000 });
        logger.info('Waiting for login password field...');
        await page.waitForSelector(config.SELECTORS.LOGIN_PASSWORD, { timeout: 10000 });

        // Fill in login credentials
        logger.info('Typing email...');
        await page.type(config.SELECTORS.LOGIN_EMAIL, credentials.email, { delay: randomDelay(250, 350) });
        logger.info('Typing password...');
        await page.type(config.SELECTORS.LOGIN_PASSWORD, credentials.password, { delay: randomDelay(200, 300) });

        // Click the login button
        logger.info('Clicking login button...');
        await page.click(config.SELECTORS.LOGIN_BUTTON);

        // Wait for navigation (manual CAPTCHA solving might be required)
        logger.info('Waiting for navigation (manual CAPTCHA solving might be required)...');
        await page.waitForNavigation({ waitUntil: 'load', timeout: 0 });

        // Save cookies for later use in the main script
        await saveCookies(page, `./cookies_${credentials.email}.json`);
        logger.info('Login successful and cookies saved.');
    } catch (error) {
        logger.error(`Error during login: ${error.message}`);
        throw error;
    } finally {
        if (browser) {
            await browser.close();  // Ensure the browser is closed after login
        }
    }
};

module.exports = { login };
