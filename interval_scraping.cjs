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
const { scrapeOrderDetails } = require('./orderScraper.cjs'); 
const { takeScreenshot, sendScreenshotEmail } = require('./screenshot.cjs');


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

    const mailOptions = {
        from: `"Uvotake" <${process.env.Email_User}>`,
        to: process.env.EMAIL_TO.trim(),
        subject: `New Order from UVOTAKE ${loginEmail.split('@')[0]}: ${subject}`,
        html: `
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
                                    <th>Topic Title</th>
                                    <td>${order.topicTitle || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Discipline</th>
                                    <td>${order.discipline || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Academic Level</th>
                                    <td>${order.academicLevel || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Deadline</th>
                                    <td>${order.deadline || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Pages</th>
                                    <td>${order.pages || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Cost</th>
                                    <td>${order.cost || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Cost Per Page (CPP)</th>
                                    <td>${order.cpp || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Bid</th>
                                    <td>${order.bid || 'N/A'}</td>
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
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(`Error occurred:`, error);
        }
        console.log(`Email sent successfully:`, info.response);
    });
};

// Function to click the "Take Order" button
const clickTakeOrderButton = async (page) => {
    try {
        const takeOrderSelector = process.env.TAKE_ORDER_SELECTOR;  // Use the selector from .env
        const placeBidSelector = process.env.PLACE_BID_SELECTOR; // Add the selector for the Place Bid button

        console.log('Waiting for the button to load...');

        // Wait for either the "Take Order" or "Place Bid" button to appear
        await page.waitForSelector(takeOrderSelector, { timeout: 10000 }).catch(() => null); // Try "Take Order" first
        await page.waitForSelector(placeBidSelector, { timeout: 10000 }).catch(() => null); // If not found, try "Place Bid"

        // Check if the "Place Bid" button exists (skip if found)
        const placeBidButton = await page.$(placeBidSelector);
        if (placeBidButton) {
            console.log('Found "Place Bid" button, skipping...');
            return;  // Skip clicking if the "Place Bid" button is found
        }

        // If "Place Bid" isn't found, proceed with "Take Order"
        const takeOrderButton = await page.$(takeOrderSelector);
        if (takeOrderButton) {
            // Check if the "Take Order" button is clickable
            const buttonText = await page.evaluate(button => button.textContent, takeOrderButton);
            if (buttonText.trim() === 'Take Order') {
                console.log('Clicking the "Take Order" button...');
                await takeOrderButton.click();
                console.log('"Take Order" button clicked successfully.');
            } else {
                console.log('The button is not labeled as "Take Order".');
            }
        } else {
            console.log('No "Take Order" button found.');
        }

    } catch (error) {
        console.error('Error clicking the "Take Order" button:', error.message);
    }
};


// Function to scrape orders from the main page
const scrapeOrders = async (page) => {
    console.log('Scraping orders from the main page...');
    
    // Locate all orders on the main page
    const orders = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.row[data-order_id]')).map(orderElement => {
            // Check for the revision class <i class="revision"></i>
            if (orderElement.querySelector('i.revision')) {
                console.log('Skipping revision order...');
                return null; 
            }

            const orderId = orderElement.getAttribute('data-order_id');
            const topicTitle = orderElement.querySelector('.title-order')?.textContent.trim() || 'N/A';
            const discipline = orderElement.querySelector('.discipline-order')?.textContent.trim() || 'N/A';
            const academicLevel = orderElement.querySelector('.academic-level-order')?.textContent.trim() || 'N/A';
            const pages = parseInt(orderElement.querySelector('.pages-order')?.textContent.trim()) || 0;
            const deadline = new Date(orderElement.querySelector('.time-order span')?.textContent.trim()) || 'N/A';
            const cpp = parseFloat(orderElement.querySelector('.cpp-order')?.textContent.trim()) || 0;
            const cost = parseFloat(orderElement.querySelector('.cost-order')?.textContent.trim()) || 0;
            //const bid = parseFloat(orderElement.querySelector('.bid-order')?.textContent.trim()) || 0;
            const href = `https://www.uvocorp.com/order/${orderId}.html`;

            return {
                OrderId: orderId,
                topicTitle,
                discipline,
                academicLevel,
                pages,
                deadline,
                cost,
                cpp,
                //bid,
                href,
                isRevision: orderElement.querySelector('i.revision') !== null // Mark if order is a revision
            };
        }).filter(order => order !== null); 
    });

    for (const order of orders) {
        if (order.isRevision) {
            console.log(`Skipping revision order with ID: ${order.OrderId}`);
            continue;  // Skip revision orders
        }

        console.log(`Navigating to order page: ${order.href}`);
        await page.goto(order.href, { waitUntil: 'domcontentloaded' });
        
        // Ensure the page is fully loaded before scraping
        await page.waitForSelector('.order-details');  // Wait for an element that indicates the page is loaded

        console.log('Scraping individual TAKE ORDER  order page...');
        const details = await scrapeOrderDetails(page);
        order.title = details.title;
        order.instructions = details.instructions;
        order.attachedFiles = details.attachedFiles;

        console.log(`Scraped order details:`, details);

        // Call the function to click the "Take Order" button
        await clickTakeOrderButton(page);  // Click the "Take Order" button after scraping the details


        // Optionally, navigate back to the main orders page
        await page.goto('https://www.uvocorp.com/orders/available.html', { waitUntil: 'domcontentloaded' });
    }

    return orders;
};



// MongoDB Connection
mongoose.connect(process.env.MONGO_URIlocal, {
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
    
    const orders = await scrapeOrders(page);
    console.log('Scraped order details:', orders);

    const loginEmail = process.env.Email_User;  // Define loginEmail before using it
    
    if (orders.length > 0) {
        fs.writeFileSync('orders_with_details.json', JSON.stringify(orders, null, 2));
        console.log('Order details saved to orders_with_details.json.');

        // Save orders to MongoDB
        for (const order of orders) {
            try {
                const newOrder = new Order(order);
                await newOrder.save();
                console.log(`Order ${order.OrderId} saved to MongoDB.`);
            } catch (error) {
                console.error(`Error saving order ${order.OrderId}:`, error.message);
            }
        }

        // Send emails
        for (const order of orders) {
            const subject = `New Order Uvotake ${loginEmail.split('@')[0]}: ${order.OrderId}`;
            const text = `Order ID: ${order.OrderId}\nTopic Title: ${order.topicTitle}\nDiscipline: ${order.discipline}\nPages: ${order.pages}\nDeadline: ${order.deadline}\nCPP: ${order.cpp}\nCost: ${order.cost}`;
            await sendEmail(subject, text, loginEmail, order);
        }
    } else {
        console.log('No new orders found.');
        // Wait for a few minutes before taking a screenshot
        //await delay(3 * 60 * 1000); // 3 minutes delay
        // Take a screenshot
        // Dynamic path for screenshot
        //const screenshotPath = path.join(__dirname, 'uvocorp_no_orders_screenshot.png');
        //await takeScreenshot(page, screenshotPath);

        // Send the screenshot email
        //const subject = 'No New Orders Found - Screenshot';
        //const loginEmail = process.env.Email_User;
        //const text = 'No new orders were found after checking. Here is a screenshot of the page.';
        //await sendScreenshotEmail(subject, text, loginEmail, screenshotPath);
    }
};

// Using dedlay promise in clicking enter using puppeteer
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
(async () => {
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
        console.log('Closing the first tab opened by Chromium...');
        await pages[0].close();
        console.log('First tab closed successfully.');
    }

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    console.log(`Setting user agent: ${userAgent}`);
    await page.setUserAgent(userAgent);

    //await page.setViewport({ width: 1366, height: 768 });
    //console.log('Viewport size set to 1366x768.');

    try {
        console.log('Navigating to login page...');
        const url = 'https://www.uvocorp.com/login.html';
        await page.goto(url, { timeout: 0, waitUntil: 'domcontentloaded' });

        const acceptCookiesSelector = process.env.BUTTON_SELECTOR;
        console.log('Waiting for the "Accept Cookies" button...');
        await page.waitForSelector(acceptCookiesSelector, { timeout: 18000 });

        console.log('Clicking "Accept Cookies" button...');
        await page.click(acceptCookiesSelector);
        console.log('"Accept Cookies" button clicked successfully.');

        console.log('Waiting for login form...');
        const loginEmailSelector = process.env.LOGIN_EMAIL_SELECTOR;
        const loginPasswordSelector = process.env.LOGIN_PASSWORD_SELECTOR;
        //const loginButtonSelector = process.env.LOGIN_BUTTON_SELECTOR;

        await page.waitForSelector(loginEmailSelector);

        console.log('Typing email...');
        await page.type(loginEmailSelector, process.env.LOGIN_EMAIL, { delay: randomDelay(150, 250) });

        console.log('Typing password...');
        await page.type(loginPasswordSelector, process.env.LOGIN_PASSWORD, { delay: randomDelay(150, 250) });

        // console.log('Clicking login button...');
        // await page.waitForSelector(loginButtonSelector);
        // await page.click(loginButtonSelector);

        console.log('Waiting for 5-10 seconds before pressing Enter...');
        await delay (5000 + Math.floor(Math.random() * 5000));

        console.log('Pressing Enter to submit the form...');
        await page.keyboard.press('Enter'); // Simulate pressing the Enter key

        console.log('Waiting for you to manually solve the CAPTCHA and log in...');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });

        console.log('Saving cookies...');
        await saveCookies(page, './cookies.json');

        let isScraping = false;  // Add a flag to track scraping status

        setInterval(async () => {
            if (!isScraping) {  // Check if the scraping cycle is already running
                isScraping = true;  // Set the flag to true to prevent overlapping cycles
                console.log('Starting a new scrape cycle...');
                
                try {
                    await checkForNewOrders(page);  // Scrape new orders
                } catch (error) {
                    console.error('Error during scrape cycle:', error.message);
                }
        
                isScraping = false;  // Reset the flag when the cycle finishes
            } else {
                console.log('Waiting for the current scrape cycle to finish...');
            }
        }, 600);  // 600ms interval
        

    } catch (error) {
        console.error('Error during execution:', error.message);
    }
})();