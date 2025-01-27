require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Import scrapeBids function from bidsScraper.cjs
const { scrapeBids } = require('./bids.cjs');

// Use the Puppeteer stealth plugin
puppeteer.use(StealthPlugin());

const mongoose = require('mongoose');
const Bid = require('./models/bid.cjs'); // Adjust path as necessary

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Helper function for random delays
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Function to save new bids to the database
const saveBidsToDB = async (bids) => {
    for (const bid of bids) {
        try {
            console.log(`Checking if bid with orderId ${bid.orderId} exists...`);
            const existingBid = await Bid.findOne({ orderId: bid.orderId });
            if (existingBid) {
                console.log(`Bid for Order ID ${bid.orderId} already exists.`);
                continue;
            }

            // Save the bid to the database
            const newBid = new Bid(bid);
            await newBid.save();
            console.log(`Bid for Order ID ${bid.orderId} saved to database.`);
        } catch (error) {
            console.error(`Error saving bid for Order ID ${bid.orderId}:`, error.message);
        }
    }
};

// Function to send email notifications
const sendEmail = async (subject, text, loginEmail) => {
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
        subject: `New Bid from UVOTAKE ${loginEmail.split('@')[0]}: ${subject}`, // Include username in the subject
        text: `Bid Details:\n${text}\n\nSend to: ${loginEmail}`, // Include the respective LOGIN_EMAIL in the body
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
    console.log(`Checking validity of bid: ${bid.orderId}`);
    
    // Allow bids with "No Cost" as valid if needed
    if (bid.cost === "No Cost") {
        return true;  // Consider bids with "No Cost" as valid
    }
    
    // Proceed with the numeric cost check for other bids
    return (
        bid.orderId &&
        bid.topicTitle &&
        bid.discipline &&
        bid.deadline &&
        bid.bid &&
        parseFloat(bid.cost.replace('$', '')) >= 1 // Only accept bids with a valid cost >= $50
    );
};

// Function to scrape bids and send notifications
const scrapeAndNotifyBids = async (page) => {
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
            const text = `Order ID: ${bid.orderId}\nTopic: ${bid.topicTitle}\nDiscipline: ${bid.discipline}\nDeadline: ${bid.deadline}\nCost: ${bid.bid}`;
            await sendEmail(subject, text, process.env.LOGIN_EMAIL);
        }
    } else {
        //console.log('No new valid bids found.');
    }
};

// Function to limit scraping cycles and stop if no new bids
// const scrapeBidsPeriodically = async (page) => {
//     let previousBidsCount = 0;

//     setInterval(async () => {
//         console.log('Starting a new bid scraping cycle...');
//         await scrapeAndNotifyBids(page);

//         // Check if no new bids were found (i.e., count hasn't changed)
//         const currentBidsCount = await Bid.countDocuments();
//         if (currentBidsCount === previousBidsCount) {
//             console.log('No new bids in this cycle, stopping further scraping.');
//             clearInterval(this); // Stop the interval
//         } else {
//             previousBidsCount = currentBidsCount;
//         }
//     }, 3000); // Adjust interval to 30 seconds for real-time scraping
// };
// Function to continuously scrape bids
const continuouslyScrapeBids = async (page) => {
    while (true) {
        try {
            await scrapeAndNotifyBids(page);
        } catch (error) {
            console.error('Error during scraping:', error.message);
        }
        // Wait for a short interval before scraping again
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second interval
    }
};
// Main function to launch Puppeteer and start scraping
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

    await page.setViewport({ width: 1366, height: 600 });
    console.log('Viewport size set to 1366x768.');

    try {
        console.log('Navigating to login page...');
        const url = 'https://www.uvocorp.com/login.html';
        await page.goto(url, { timeout: 0, waitUntil: 'domcontentloaded' });

        const acceptCookiesSelector = process.env.BUTTON_SELECTOR;
        console.log('Waiting for "Accept cookie" button...');
        await page.waitForSelector(acceptCookiesSelector, { timeout: 18000 });

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
        await page.click(loginButtonSelector);

        console.log('Waiting for you to manually solve the CAPTCHA and log in...');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });

        console.log('Navigating to bids page...');
        await page.goto('https://www.uvocorp.com/orders/bids.html', { waitUntil: 'domcontentloaded' });

        // Start periodically scraping bids
        await continuouslyScrapeBids(page);

    } catch (error) {
        console.error('Error during execution:', error.message);
    } 
})();
