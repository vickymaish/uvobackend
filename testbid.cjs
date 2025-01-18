require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Import scrapeBids function from bidsScraper.cjs
const { scrapeBids } = require('./bids.cjs');

// Use the Puppeteer stealth plugin
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

// Function to check if a bid is valid based on your criteria
const isValidBid = (bid) => {
    // Replace with your bid criteria (e.g., minimum cost)
    return (
        bid.orderId &&
        bid.topic &&
        bid.deadline &&
        bid.cost &&
        parseFloat(bid.cost.replace('$', '')) >= 50 // Example: Bids with cost ≥ $50
    );
};

// Function to scrape bids and send notifications
const scrapeAndNotifyBids = async (page) => {
    console.log('Scraping bids...');
    const bids = await scrapeBids(page); // Scrape bid details
    console.log('Scraped bids:', bids);

    // Filter valid bids based on criteria
    const validBids = bids.filter(isValidBid);

    // Save valid bids to a JSON file
    if (validBids.length > 0) {
        fs.writeFileSync('bids.json', JSON.stringify(validBids, null, 2));
        console.log('Valid bids saved to bids.json.');

        // Send email notifications for each valid bid
        for (const bid of validBids) {
            const subject = `New Bid Available: ${bid.orderId}`;
            const text = `Order ID: ${bid.orderId}\nTopic: ${bid.topic}\nDeadline: ${bid.deadline}\nCost: ${bid.cost}\nLink: ${bid.link}`;
            await sendEmail(subject, text);
        }
    } else {
        console.log('No new valid bids found.');
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
            '--disable-blink-features=AutomationControlled',
        ],
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
        console.log('Waiting for "Accept cookie" button...');
        await page.waitForSelector(acceptCookiesSelector, { timeout: 10000 });

        console.log('Clicking "Accept Cookies" button...');
        await page.click(acceptCookiesSelector);
        console.log('"Accept Cookies" button clicked successfully.');

        console.log('Waiting for login form...');
        const loginEmailSelector =process.env.LOGIN_EMAIL_SELECTOR;
        const loginPasswordSelector = process.env.LOGIN_PASSWORD_SELECTOR;
        const loginButtonSelector = process.env.LOGIN_BUTTON_SELECTOR;

        await page.waitForSelector(loginEmailSelector);

        console.log('Typing email...');
        await page.type(loginEmailSelector, process.env.LOGIN_EMAIL, { delay: randomDelay(150, 250) });

        console.log('Typing password...');
        await page.type(loginPasswordSelector, process.env.LOGIN_PASSWORD, { delay: randomDelay(150, 250) });

        console.log('Clicking login button...');
        await page.click(loginButtonSelector);
        await page.click(loginButtonSelector);

        console.log('Waiting for you to manually solve the CAPTCHA and log in...');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });


        console.log('Navigating to bids page...');
        await page.goto('https://www.uvocorp.com/orders/bids.html', { waitUntil: 'domcontentloaded' });

        // Periodically scrape for new bids every 5 minutes
        setInterval(async () => {
            console.log('Starting a new bid scraping cycle...');
            await scrapeAndNotifyBids(page);
        }, 3000); // 3 seconds for testing purposes

    } catch (error) {
        console.error('Error during execution:', error.message);
    }
})();
