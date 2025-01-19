require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Import scrapeOrderDetails function from orderScraper.js
const { scrapeOrderDetails } = require('./orderScraper.cjs');


// Use the Puppeteer stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Helper function for random delays
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Function to save cookies
const saveCookies = async (page, filePath) => {
    const cookies = await page.cookies();
    fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved to', filePath);
};

// Function to send email
const sendEmail = async (subject, text) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.Email_User,
            pass: process.env.Email_Password,
        },
    });

    const mailOptions = {
        from: process.env.Email_User,
        to: process.env.EMAIL_TO,
        subject: subject,
        text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(`Error occurred:`, error);
        }
        console.log(`Email sent successfully:`, info.response);
    });
};

// Function to scrape orders
const scrapeOrders = async (page) => {
    console.log('Scraping orders...');
    // Call the scrapeOrderDetails function to scrape orders from the page
    const orders = await scrapeOrderDetails(page);
    return orders;
};

// Function to check for new orders and send notifications
const checkForNewOrders = async (page) => {
    console.log('Checking for new orders...');
    
    // Scrape the order details from the orders page
    const orders = await scrapeOrders(page);
    console.log('Scraped order details:', orders);

    // Save order details to a JSON file
    if (orders.length > 0) {
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
        console.log('Order details saved to orders.json.');

        // Send an email for each new order
        for (const order of orders) {
            const subject = `New Order Available: ${order.orderId}`;
            const text = `Order ID: ${order.orderId}\nTopic Title: ${order.topicTitle}\nDiscipline: ${order.discipline}\nPages: ${order.pages}\nDeadline: ${order.deadline}\nCPP: ${order.cpp}\nCost: ${order.cost}`;
            await sendEmail(subject, text);
        }
    } else {
        console.log('No new orders found.');
    }
};

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        timeout: 120000,
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
        console.log('Closing the first tab opened by Chromium...');
        await pages[0].close();
        console.log('First tab closed successfully.');
    }

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    console.log(`Setting user agent: ${userAgent}`);
    await page.setUserAgent(userAgent);

    await page.setViewport({ width: 1366, height: 768 });
    console.log('Viewport size set to 1366x768.');

    try {
        console.log('Navigating to login page...');
        const url = 'https://www.uvocorp.com/login.html';
        await page.goto(url, { timeout: 0, waitUntil: 'domcontentloaded' });

        const acceptCookiesSelector = process.env.BUTTON_SELECTOR;
        console.log('Waiting for the "Accept Cookies" button...');
        await page.waitForSelector(acceptCookiesSelector, { timeout: 10000 });

        console.log('Clicking "Accept Cookies" button...');
        await page.click(acceptCookiesSelector);
        console.log('"Accept Cookies" button clicked successfully.');

        console.log('Waiting for login form...');
        const loginEmailSelector = process.env.LOGIN_EMAIL_SELECTOR;
        const loginPasswordSelector = process.env.LOGIN_PASSWORD_SELECTOR;
        const loginButtonSelector = process.env.LOGIN_BUTTON_SELECTOR;

        await page.waitForSelector(loginEmailSelector);

        console.log('Typing email...');
        await page.type(loginEmailSelector, process.env.LOGIN_EMAIL, { delay: randomDelay(150, 250) });

        console.log('Typing password...');
        await page.type(loginPasswordSelector, process.env.LOGIN_PASSWORD, { delay: randomDelay(150, 250) });

        console.log('Clicking login button...');
        await page.waitForSelector(loginButtonSelector);
        await page.click(loginButtonSelector);

        console.log('Waiting for you to manually solve the CAPTCHA and log in...');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });

        console.log('Saving cookies...');
        await saveCookies(page, './cookies.json');

        // Start checking for new orders every 5 minutes (300000ms)
        setInterval(async () => {
            console.log('Starting a new scrape cycle...');
            await checkForNewOrders(page);  // Call the function that scrapes and sends notifications
        }, 5000); // 50000ms = 5 minutes

    } catch (error) {
        console.error('Error during execution:', error.message);
    }
})();
