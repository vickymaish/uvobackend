const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { randomDelay, saveCookies } = require('../utils/helpers.cjs');
const config = require('../config/config.cjs');
const logger = require('../utils/logger.cjs');

puppeteer.use(StealthPlugin());

const login = async (page, credentials) => {
    try {
        logger.info('Navigating to login page...');
        await page.goto('https://www.uvocorp.com/login.html', { waitUntil: 'domcontentloaded' });

        // Accept cookies
        logger.info('Waiting for the "Accept Cookies" button...');
        await page.waitForSelector(config.SELECTORS.BUTTON, { timeout: 18000 });
        await page.click(config.SELECTORS.BUTTON);
        logger.info('"Accept Cookies" button clicked successfully.');

        // Log in
        logger.info('Typing email...');
        await page.type(config.SELECTORS.LOGIN_EMAIL, credentials.email, { delay: randomDelay(250, 350) });

        logger.info('Typing password...');
        await page.type(config.SELECTORS.LOGIN_PASSWORD, credentials.password, { delay: randomDelay(200, 300) });

        logger.info('Pressing Enter to submit the form...');
        await page.keyboard.press('Enter');

        logger.info('Waiting for manual CAPTCHA solving...');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });

        // Save cookies
        await saveCookies(page, `./cookies_${credentials.email}.json`);
        logger.info('Login successful and cookies saved.');
    } catch (error) {
        logger.error('Error during login:', { error: error.message });
        throw error;
    }
};

module.exports = { login };