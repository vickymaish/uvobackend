require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { scrapeBids } = require('./bidsScraper'); // Import the scrapeBids function

// Use the Puppeteer stealth plugin
puppeteer.use(StealthPlugin());

// Define Mongoose models
const bidSchema = new mongoose.Schema({
    orderId: String,
    topicTitle: String,
    discipline: String,
    deadline: String,
    bid: String,
    href: String,
});

const Bid = mongoose.model('Bid', bidSchema);

// Function to save bids to the database
const saveBidsToDB = async (bids) => {
    for (const bid of bids) {
        const newBid = new Bid(bid);
        await newBid.save();
        console.log(`Bid ${bid.orderId} saved to MongoDB.`);
    }
};

// Function to check if a bid is valid
const isValidBid = (bid) => {
    // Add your validation logic here
    return true; // Placeholder: assume all bids are valid
};

// Function to send email
const sendEmail = async (subject, text, loginEmail) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.UVO_EMAIL,
            pass: process.env.UVO_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.UVO_EMAIL,
        to: process.env.UVO_EMAIL, // Send email to uvo.notifications@gmail.com
        subject: `New Bid from ${loginEmail.split('@')[0]}: ${subject}`, // Include username in the subject
        text: `Bid Details:\n${text}\n\nSend to: ${loginEmail}`, // Include the respective LOGIN_EMAIL in the body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully:`, info.response);
    } catch (error) {
        console.log(`Error occurred:`, error);
    }
};

// Function to scrape bids periodically
const scrapeBidsPeriodically = async (page) => {
    while (true) {
        console.log('Scraping bids...');
        const bids = await scrapeBids(page); // Scrape bid details
        console.log('Scraped bids:', bids);

        // Filter valid bids based on criteria
        const validBids = bids.filter(isValidBid);

        if (validBids.length > 0) {
            console.log(`${validBids.length} valid bids found.`);
            // Save valid bids to the database
            await saveBidsToDB(validBids);

            // Save valid bids to a JSON file for backup
            fs.writeFileSync('bids.json', JSON.stringify(validBids, null, 2));
            console.log('Valid bids saved to bids.json.');

            // Send email notifications for each valid bid
            for (const bid of validBids) {
                const subject = `New Bid Available from UVOTAKE: ${bid.orderId}`;
                const text = `Order ID: ${bid.orderId}\nTopic: ${bid.topicTitle}\nDiscipline: ${bid.discipline}\nDeadline: ${bid.deadline}\nCost: ${bid.bid}\nLink: ${bid.href}`;
                await sendEmail(subject, text, process.env.LOGIN_EMAIL);
            }
        } else {
            console.log('No new valid bids found.');
        }

        // Wait for a specified interval before scraping again
        await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes
    }
};

(async () => {
    // Connect to MongoDB
    mongoose.connect(process.env.MONGO_URI1.trim(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

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
        await page.click(loginButtonSelector);

        console.log('Waiting for you to manually solve the CAPTCHA and log in...');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });

        console.log('Navigating to bids page...');
        await page.goto('https://www.uvocorp.com/orders/bids.html', { waitUntil: 'domcontentloaded' });

        // Start periodically scraping bids
        await scrapeBidsPeriodically(page);

    } catch (error) {
        console.error('Error during execution:', error.message);
    } finally {
        console.log('Closing browser...');
        await browser.close();
        mongoose.connection.close(); // Close the MongoDB connection
        console.log('Browser and MongoDB connection closed.');
    }
})();