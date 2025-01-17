require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nodemailer = require('nodemailer');
const fs = require('fs');

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

// Function to scrape messages
const scrapeMessages = async (page) => {
    console.log('Scraping messages...');
    const messages = await page.$$eval('.message', (messageElements) =>
        messageElements.map((el) => {
            return {
                sender: el.querySelector('.message--sender')?.getAttribute('data-title') || 'Unknown Sender',
                subject: el.querySelector('.message--subject__text')?.textContent.trim() || 'No Subject',
                preview: el.querySelector('.message--text')?.textContent.trim() || 'No Message',
                timestamp: el.querySelector('.message--date span')?.textContent.trim() || 'No Timestamp',
            };
        })
    );
    return messages;
};

// Function to retry scraping messages
const retryScrapingMessages = async (page, retries = 10, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        const messages = await scrapeMessages(page);
        if (messages.length > 0) {
            return messages;
        }
        console.log(`No messages found. Retrying in ${delay / 1000} seconds... (${i + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
    }
    return [];
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

    let messages = [];

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

        // Navigate to the messages page
        const messagesUrl = 'https://www.uvocorp.com/messages.html';
        console.log(`Navigating to ${messagesUrl}...`);
        await page.goto(messagesUrl, { waitUntil: 'domcontentloaded' });

        console.log('Waiting for the messages container...');
        const messagesContainerSelector = '.messages';
        await page.waitForSelector(messagesContainerSelector);

        // Retry scraping messages if the initial attempt results in an empty array
        messages = await retryScrapingMessages(page);

        console.log('Extracted messages:', messages);

        // Save messages to a JSON file
        fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));
        console.log('Messages saved to messages.json.');

        // Send email for each extracted message
        if (messages.length > 0) {
            for (const message of messages) {
                const subject = `New Message from ${message.sender}`;
                const text = `Subject: ${message.subject}\nPreview: ${message.preview}\nTimestamp: ${message.timestamp}`;
                await sendEmail(subject, text);
            }
        } else {
            console.log('No messages found. Keeping the browser open for inspection.');
            await new Promise(() => {}); // Infinite wait to keep the browser open
        }

    } catch (error) {
        console.error('Error during execution:', error.message);
    } finally {
        if (messages.length > 0) {
            console.log('Closing browser...');
            await browser.close();
        }
    }
})();