const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const connectDB = require('./db.cjs');
const { sendEmail } = require('./email.cjs');
const { randomDelay, saveCookies } = require('./puppeteerUtils.cjs');
const { scrapeOrders, clickTakeOrderButton } = require('./orderScraper.cjs');
const { LOGIN_EMAIL, LOGIN_PASSWORD, BUTTON_SELECTOR, LOGIN_EMAIL_SELECTOR, LOGIN_PASSWORD_SELECTOR } = require('./config.cjs');

puppeteer.use(StealthPlugin());

let isScraping = false;

(async () => {
    await connectDB();

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
    const pages = await browser.pages();
    if (pages.length > 0) {
        await pages[0].close();
    }

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    try {
        await page.goto('https://www.uvocorp.com/login.html', { timeout: 0, waitUntil: 'domcontentloaded' });
        await page.waitForSelector(BUTTON_SELECTOR, { timeout: 40000 });
        const buttonExists = await page.$(BUTTON_SELECTOR);
        if (buttonExists) {
            await page.click(BUTTON_SELECTOR);
        }

        await page.waitForSelector(LOGIN_EMAIL_SELECTOR);
        await page.type(LOGIN_EMAIL_SELECTOR, LOGIN_EMAIL, { delay: randomDelay(150, 250) });
        await page.type(LOGIN_PASSWORD_SELECTOR, LOGIN_PASSWORD, { delay: randomDelay(180, 250) });
        await delay(5000 + Math.floor(Math.random() * 5000));
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });
        await saveCookies(page, './cookies.json');

        const scrapeInterval = 500;
        const startScraping = async () => {
            if (!isScraping) {
                isScraping = true;
                try {
                    const orders = await scrapeOrders(page);
                    if (orders.length > 0) {
                        console.log('Scraped order details:', orders);
                    } else {
                        console.log('No new orders found.');
                    }
                } catch (error) {
                    console.error('Error during scrape cycle:', error.message);
                } finally {
                    isScraping = false;
                }
            } else {
                console.log('Waiting for the current scrape cycle to finish...');
            }
        };

        setInterval(startScraping, scrapeInterval);
    } catch (error) {
        console.error('Error during execution:', error.message);
    }
})();
