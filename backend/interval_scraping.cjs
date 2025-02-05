require('dotenv').config();

const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nodemailer = require('nodemailer');
const fs = require('fs');
const mongoose = require('mongoose');
const path= require('path')
const Order = require('./models/order.cjs'); // Import the existing Order model
// Import scrapeOrderDetails function from orderScraper.js
//const { scrapeOrderDetails } = require('./orderScraper.cjs'); 
//const { takeScreenshot, sendScreenshotEmail } = require('./screenshot.cjs');


// Use the Puppeteer stealth plugin to avoid detection and lets see 
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
const sendEmail = async (subject, text, loginEmail, order) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.Email_User,
            pass: process.env.Email_Password,
        },
    });
    let htmlContent;

    if (order) {
        // Order details email template
        htmlContent = ` 
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: auto;
                            background: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                            overflow: hidden;
                        }
                        .header {
                            background: #ff9800;
                            color: white;
                            text-align: center;
                            padding: 20px;
                            font-size: 24px;
                        }
                        .body {
                            padding: 20px;
                            color: #333333;
                            line-height: 1.6;
                        }
                        .quote {
                            font-style: italic;
                            color: #ff9800;
                        }
                        .footer {
                            text-align: center;
                            background: #eeeeee;
                            padding: 10px;
                            font-size: 12px;
                            color: #777777;
                        }
                        .details-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        .details-table th, .details-table td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        .details-table th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            New Order from Uvotake
                        </div>
                        <div class="body">
                            <p>Hi there,</p>
                            <p>We have a new order from <strong>${loginEmail.split('@')[0]}</strong>:</p>
                            <table class="details-table">
                                <tr>
                                    <th>Order ID</th>
                                    <td>${order.OrderId || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Title</th>
                                    <td>${order.title || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Discipline</th>
                                    <td>${order.discipline || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Type of Paper</th>
                                    <td>${order.typeOfPaper || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Pages</th>
                                    <td>${order.pages || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Deadline</th>
                                    <td>${order.deadline || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Price</th>
                                    <td>${order.price || 'N/A'}</td>
                                </tr>
                            </table>
                            <p class="quote">${text}</p>
                        </div>
                        <div class="footer">
                            © 2025 Uvotake. All Rights Reserved.
                        </div>
                    </div>
                </body>
            </html>
        `;
    }else {
        // Login email notification template;
        htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
                        .email-container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); overflow: hidden; }
                        .header { background: #ff9800; color: white; text-align: center; padding: 20px; font-size: 24px; }
                        .body { padding: 20px; color: #333333; line-height: 1.6; }
                        .footer { text-align: center; background: #eeeeee; padding: 10px; font-size: 12px; color: #777777; }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">Uvotake Bot Logged Out</div>
                        <div class="body">
                            <p>Hi there,</p>
                            <p>The bot for account <strong>${loginEmail.split('@')[0]}</strong> has been logged out.</p>
                            <p>${text}</p>
                        </div>
                        <div class="footer">© 2025 Uvotake. All Rights Reserved.</div>
                    </div>
                </body>
            </html>
        `;
    }
    const mailOptions = {
        from: `"Uvotake" <${process.env.Email_User}>`,
        to: `${process.env.EMAIL_TO.trim()}`, 
        subject: subject,
        html: htmlContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(`Error occurred:`, error);
        }
        console.log(`Email sent successfully:`, info.response);
    });
};



const LAST_CHECKED_ORDER_FILE = 'last_checked_order.json';

// Function to read last checked order ID
const getLastCheckedOrderId = () => {
    if (fs.existsSync(LAST_CHECKED_ORDER_FILE)) {
        const data = fs.readFileSync(LAST_CHECKED_ORDER_FILE);
        return JSON.parse(data).lastCheckedOrderId || null;
    }
    return null;
};

// Function to update last checked order ID
const updateLastCheckedOrderId = (orderId) => {
    fs.writeFileSync(LAST_CHECKED_ORDER_FILE, JSON.stringify({ lastCheckedOrderId: orderId }, null, 2));
};


// Function to click the "Take Order" button
const clickTakeOrderButton = async (page, orderId) => {
    try {
        const takeOrderSelector = process.env.TAKE_ORDER_SELECTOR;  // Selector from .env

        console.log(`Waiting for "Take Order" button for order ${orderId}...`);

        // Wait for "Take Order" button to appear (or timeout after 3 seconds)
        await page.waitForSelector(takeOrderSelector, { timeout: 3000 }).catch(() => null);

        const takeOrderButton = await page.$(takeOrderSelector);
        if (takeOrderButton) {
            console.log(`Clicking the "Take Order" button for order ${orderId}...`);
            await takeOrderButton.click();
            console.log(`"Take Order" button clicked successfully for order ${orderId}.`);
        } else {
            console.log(`Order ${orderId} is a "Place Bid" type. Returning to available orders page.`);
            await page.goto('https://www.uvocorp.com/orders/available.html', { waitUntil: 'networkidle2' });
        }
    } catch (error) {
        console.error(`Error clicking the "Take Order" button for order ${orderId}:`, error.message);
    }
};


const acceptedDisciplines = [
    'Humanities', 'Art (Fine arts, Performing arts)', 'Classic English Literature', 'Composition',
    'English 101', 'Film & Theater studies', 'History', 'Linguistics', 'Literature', 'Music',
    'Philosophy', 'Poetry', 'Religious studies', 'Shakespeare', 'Social Sciences', 'Anthropology',
    'Cultural and Ethnic Studies', 'Economics', 'Ethics', 'Political science', 'Psychology', 'Social Work and Human Services',
    'Sociology', 'Tourism', 'Urban Studies', "Women's & gender studies", 'Business and administrative studies',
    'Business Studies', 'Human Resources Management (HRM)', 'International Relations', 'Logistics', 'Management',
    'Marketing', 'Public Relations (PR)', 'Natural Sciences', 'Biology (and other Life Sciences)', 'Chemistry', 'Ecology',
    'Geography', 'Geology (and other Earth Sciences)', 'Zoology', 'Agriculture', 'Application Letters', 'Communications',
    'Criminal law', 'Education', 'Environmental studies and Forestry', 'Family and consumer science', 'Law', 'Leadership Studies',
    'Nutrition/Dietary', 'Public Administration', 'Sports'
];

const TAKE_ORDER_SELECTOR = process.env.TAKE_ORDER_SELECTOR;

let lastCheckedOrderId = null; // Store last processed order



const scrapeFinishedOrders = async (page) => {
    console.log(`[${new Date().toISOString()}] Checking finished orders...`);
    
    try {
        await page.goto('https://www.uvocorp.com/orders/finished.html', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.row[data-order_id]', { timeout: 5000 });

        const finishedOrders = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.row[data-order_id]')).map(orderElement => {
                const orderId = orderElement.getAttribute('data-order_id');
                const href = `https://www.uvocorp.com/order/${orderId}.html`;

                const isFinished = orderElement.querySelector('.id-finish-order .status_type.finished') !== null;
                if (!isFinished) return null; // Skip if not finished

                const topicTitle = orderElement.querySelector('.title-order')?.textContent.trim() || 'N/A';
                const discipline = orderElement.querySelector('.discipline-order')?.textContent.trim() || 'N/A';
                const finishDate = orderElement.querySelector('.finish-date-order')?.getAttribute('data-title') || 'N/A';
                const pages = orderElement.querySelector('.pages-order')?.textContent.trim() || 'N/A';
                const paidAmount = orderElement.querySelector('.paid-order')?.textContent.trim() || 'N/A';

                return { OrderId: orderId, topicTitle, discipline, finishDate, pages, paidAmount, href };
            }).filter(order => order !== null);
        });

        if (finishedOrders.length === 0) {
            console.log("No finished orders found.");
            return;
        }

        console.log(`Found ${finishedOrders.length} finished orders.`);

        for (const order of finishedOrders) {
            console.log(`Opening finished order: ${order.OrderId}`);
            await page.goto(order.href, { waitUntil: 'domcontentloaded' });
            await delay (2000);
            const orderDetails = await scrapeOrderDetails(page);
            console.log(`Order ${order.OrderId} taken successfully. Details:`, orderDetails);
        }

        await sendEmail('Finished Orders Scraped', subject, text, loginEmail, order);
        console.log("✅ Finished orders sent via email.");

    } catch (error) {
        console.error(`Error scraping finished orders:`, error.message);
    }
};

const scrapeOrderDetails = async (page) => {
    // Scraping details from the order details page
    const orderDetails = await page.evaluate(() => {
        const details = {};

        // Scraping details based on the label-value pairs in the <li> elements
        const listItems = document.querySelectorAll('ul.order--tabs__content-instraction-table li');

        listItems.forEach((li) => {
            const label = li.querySelector('.order--tabs__content-instraction-table-label')?.textContent.trim();
            const value = li.querySelector('.order--tabs__content-instraction-table-value')?.textContent.trim();

            if (label && value) {
                // Extracting specific details based on the label
                switch (label) {
                    case 'Price':
                        details.price = value;
                        break;
                    case 'Deadline':
                        details.deadline = value;
                        break;
                    case 'Pages':
                        details.pages = value;
                        break;
                    case 'Type of paper':
                        details.typeOfPaper = value;
                        break;
                    case 'Discipline':
                        details.discipline = value;
                        break;
                    case 'Title':
                        details.title = value;
                        break;
                    default:
                        break;
                }
            }
        });

        return details;
    });

    return orderDetails;
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Function to check for new orders and send notifications
const checkForNewOrders = async (page) => {
    console.log('Checking for new orders...');
    
    // Scrape orders and ensure the result is an array
    const orders = await scrapeFinishedOrders(page) || [];  //scrapeFinishedOrders  replaced scrapeorders
    console.log('Scraped order details:', orders);

    if (!Array.isArray(orders)) {
        console.error('Error: scrapeOrders did not return an array.');
        return [];
    }

    // Take only the first 10 items for testing
    const limitedOrders = orders.slice(0, 10);
    console.log(`Processing ${limitedOrders.length} orders for testing.`);

    const loginEmail = process.env.LOGIN_EMAIL;

    if (limitedOrders.length > 0) {
        // Save order details to a JSON file
        fs.writeFileSync('orders_with_details.json', JSON.stringify(limitedOrders, null, 2));
        console.log('Order details saved to orders_with_details.json.');

        // Save orders to MongoDB
        try {
            await Order.insertMany(limitedOrders); // Save all orders in a single operation
            console.log(`${limitedOrders.length} orders saved to MongoDB.`);
        } catch (error) {
            console.error('Error saving orders to MongoDB:', error.message);
        }

        // Send emails for each order
        for (const order of orders) {
            try {
                const subject = `New Order Uvotake ${loginEmail.split('@')[0]}: ${order.OrderId}`;
                const text = `Order ID: ${order.OrderId || 'N/A'}\n` +
                             `Topic Title: ${order.topicTitle || 'N/A'}\n` +
                             `Discipline: ${order.discipline || 'N/A'}\n` +
                             `Pages: ${order.pages || 'N/A'}\n` +
                             `Deadline: ${order.deadline || 'N/A'}\n` +
                             `CPP: ${order.cpp || 'N/A'}\n` +
                             `Cost: ${order.cost || 'N/A'}`;
                await sendEmail(subject, text, loginEmail, order);
                console.log(`Email sent for order ${order.OrderId}.`);
            } catch (error) {
                console.error(`Error sending email for order ${order.OrderId}:`, error.message);
            }
        }
    } else {
        console.log('No new orders found.');
    }
    
    return orders; // Ensure function always returns an array
};

// Using dedlay promise in clicking enter using puppeteer
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


let isScraping = false; // Declare isScraping globally

(async () => {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
        headless: true,
        //executablePath: "/opt/render/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome",
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
        console.log('Closing the first tab opened by Chromium...');
        await pages[0].close();
        console.log('First tab closed successfully.');
    }

    // Set user agent
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    console.log(`Setting user agent: ${userAgent}`);
    await page.setUserAgent(userAgent);

    let isScraping = false; // Declare isScraping in the outer scope of the async function

    try {
        // Navigate to the login page
        console.log('Navigating to login page...');
        const url = 'https://www.uvocorp.com/login.html';
        await page.goto(url, { timeout: 0, waitUntil: 'domcontentloaded' });

        // Accept cookies
        const acceptCookiesSelector = process.env.BUTTON_SELECTOR;
        console.log('Waiting for the "Accept Cookies" button...');

        await page.waitForSelector(acceptCookiesSelector, { timeout: 40000 });

        // Check if the button is actually present
        const buttonExists = await page.$(acceptCookiesSelector);
        if (!buttonExists) {
            console.log('❌ Accept Cookies button not found!');
        } else {
            console.log('✅ Accept Cookies button found! Clicking...');
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 300) + 200)); // Small delay
            await page.click(acceptCookiesSelector);
            console.log('"Accept Cookies" button clicked successfully.');
        }



        // Log in
        console.log('Waiting for login form...');
        const loginEmailSelector = process.env.LOGIN_EMAIL_SELECTOR;
        const loginPasswordSelector = process.env.LOGIN_PASSWORD_SELECTOR;

        await page.waitForSelector(loginEmailSelector);

        console.log('Typing email...');
        await page.type(loginEmailSelector, process.env.LOGIN_EMAIL, { delay: randomDelay(150, 250) });

        console.log('Typing password...');
        await page.type(loginPasswordSelector, process.env.LOGIN_PASSWORD, { delay: randomDelay(180, 250) });

        console.log('Waiting for 5-10 seconds before pressing Enter...');
        await delay(5000 + Math.floor(Math.random() * 5000));

        console.log('Pressing Enter to submit the form...');
        await page.keyboard.press('Enter'); // Simulate pressing the Enter key

        console.log('Waiting for you to manually solve the CAPTCHA and log in...');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });

        // Save cookies
        console.log('Saving cookies...');
        await saveCookies(page, './cookies.json');

        // Start interval-based scraping
        const scrapeInterval = 100; // 0.8 seconds

        const startScraping = async () => {
            if (!isScraping) { // Check if the scraping cycle is already running
                isScraping = true; // Set the flag to true to prevent overlapping cycles
                console.log('Starting a new scrape cycle...');

                try {
                    const orders = await checkForNewOrders(page); // Scrape new orders

                    if (orders.length > 0) {
                        console.log('Scraped order details:', orders);
                    } else {
                        console.log('No new orders found.');
                    }
                } catch (error) {
                    console.error('Error during scrape cycle:', error.message);
                } finally {
                    isScraping = false; // Reset the flag when the cycle finishes
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
