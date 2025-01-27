require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const cron = require('node-cron');

// Use the Puppeteer stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

async function scrapeUvocorpOrders() {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', // Update this if needed
        timeout: 90000 // Increase timeout to 90 seconds
    });
    const page = await browser.newPage();

    try {
        console.log('Navigating to login page...');
        await page.goto('https://www.uvocorp.com/login.html', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Handle the "Accept Cookies" button
        try {
            console.log('Waiting for cookie consent popup...');
            const acceptCookiesSelector = 'button[type="button"]'; // Replace with the correct selector
            await page.waitForSelector(acceptCookiesSelector, { timeout: 5000 });
            const acceptText = await page.evaluate(() => {
                const button = document.querySelector('button[type="button"]');
                return button ? button.innerText : '';
            });

            if (acceptText === 'Accept') {
                console.log('Clicking "Accept Cookies" button...');
                await page.click(acceptCookiesSelector);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait briefly to ensure the cookie pop-up disappears
            } else {
                console.log('"Accept Cookies" button not found or has different text.');
            }
        } catch (err) {
            console.log('No cookie consent popup detected:', err.message);
        }

        testcookies// Wait for login fields to appear
        console.log('Waiting for login form...');
        await page.waitForSelector('input[name="loginEmail"]');
        await page.waitForSelector('input[name="loginPassword"]');

        // Perform login with slower typing speed
        console.log('Logging in...');
        await page.type('input[name="loginEmail"]', process.env.LOGIN_EMAIL, { delay: 150 }); // Replace with your environment variable
        await page.type('input[name="loginPassword"]', process.env.LOGIN_PASSWORD, { delay: 150 });
        await page.click('input#loginSubmit'); // Click the login button

        console.log('Waiting for navigation after login...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });

        // Verify login success by checking for an element that appears after login
        try {
            const postLoginSelector = '.orders-header'; // Replace with a valid selector after login
            await page.waitForSelector(postLoginSelector, { timeout: 30000 });
            console.log('Login successful!');
        } catch (error) {
            console.error('Failed to verify login:', error);
            const screenshotPath = './login_error.png';
            console.log(`Saving screenshot to ${screenshotPath} for debugging.`);
            await page.screenshot({ path: screenshotPath });
            return;
        }

        console.log('Navigating to available orders page...');
        await page.goto('https://www.uvocorp.com/orders/available.html', { waitUntil: 'domcontentloaded', timeout: 180000 });

        // Wait for the orders table to load
        console.log('Waiting for orders table...');
        const ordersTableSelector = '.orders-table'; // Replace with the correct selector for the orders table
        await page.waitForSelector(ordersTableSelector);

        // Extract orders data
        console.log('Extracting orders...');
        const content = await page.content();
        const $ = cheerio.load(content);

        const orders = [];
        $('tr').each((index, element) => {
            const idOrder = $(element).find('.id-order.sortable').text().trim();
            const titleAndDiscipline = $(element).find('.title_and_discipline').text().trim();
            const timeOrder = $(element).find('.time-order.center.sortable').text().trim();
            const pagesCostOrder = $(element).find('.pages-cost-order.center.sortable').text().trim();
            const cppOrder = $(element).find('.cpp-order.center.sortable').text().trim();

            if (idOrder && titleAndDiscipline && timeOrder && pagesCostOrder && cppOrder) {
                orders.push({
                    idOrder,
                    titleAndDiscipline,
                    timeOrder,
                    pagesCostOrder,
                    cppOrder
                });
            }
        });

        console.log('Orders extracted:', orders);

        // You can save `orders` to a database or file here if needed
    } catch (error) {
        console.error('Error scraping:', error);
    } finally {
        console.log('Closing browser...');
        await browser.close();
    }
}

// Schedule the script to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
    console.log('Running scrapeUvocorpOrders...');
    scrapeUvocorpOrders();
});

// Run the script immediately
scrapeUvocorpOrders();
