require('dotenv').config(); // Load environment variables
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Use the Puppeteer stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Set to true if you don't need to see the browser UI
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', // Update the path if necessary
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Add these flags to avoid sandbox issues
        timeout: 90000 // Increase timeout to 90 seconds
    });

    const page = await browser.newPage();

    try {
        // Set viewport size to a smaller, standard resolution
        console.log('Setting viewport size...');
        await page.setViewport({ width: 1366, height: 768 });
        console.log('Viewport size set to 1366x768.');

        console.log('Navigating to the page...');
        await page.goto('https://www.uvocorp.com/login.html', {
            waitUntil: 'domcontentloaded', // Ensure the page's DOM is loaded
            timeout: 60000 // Increase navigation timeout
        });

        // Wait for and click "Accept Cookies" button
        const acceptCookiesSelector = 'button[type="button"]';
        console.log('Waiting for the "Accept Cookies" button...');
        await page.waitForSelector(acceptCookiesSelector, { timeout: 10000 });

        console.log('Scrolling to make the "Accept Cookies" button visible...');
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight / 2); // Scroll down by half the viewport height
        });

        console.log('Clicking "Accept Cookies" button...');
        await page.click(acceptCookiesSelector);
        console.log('"Accept Cookies" button clicked successfully.');

        // Wait for login form fields
        console.log('Waiting for login form...');
        await page.waitForSelector('input[name="loginEmail"]');
        await page.waitForSelector('input[name="loginPassword"]');

        // Enter login credentials
        console.log('Typing login credentials...');
        await page.type('input[name="loginEmail"]', process.env.LOGIN_EMAIL, { delay: 150 });
        await page.type('input[name="loginPassword"]', process.env.LOGIN_PASSWORD, { delay: 150 });

        // Wait for and click the login button
        const loginButtonSelector = '#loginSubmit';
        console.log('Waiting for login button...');
        await page.waitForSelector(loginButtonSelector, { timeout: 10000 });

        console.log('Clicking login button...');
        await page.click(loginButtonSelector);

        // Wait for navigation after clicking login
        console.log('Waiting for the login process to complete...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        console.log('Login process completed.');

        // Define a function to scrape orders
        async function scrapeOrders() {
            console.log('Waiting for the table of orders to load...');
            await page.waitForSelector('.table-order', { timeout: 60000 }); // Wait for table to load

            console.log('Scraping order data...');
            const orders = await page.evaluate(() => {
                const rows = document.querySelectorAll('.table-order .tbody ul');
                const orderData = [];
                rows.forEach(row => {
                    const orderId = row.querySelector('.id-order')?.innerText || 'N/A';
                    const topicTitle = row.querySelector('.title-order')?.innerText || 'N/A';
                    const discipline = row.querySelector('.discipline_academic-order')?.innerText || 'N/A';
                    const pages = row.querySelector('.pages-order')?.innerText || 'N/A';
                    const deadline = row.querySelector('.time-order')?.innerText || 'N/A';
                    const cpp = row.querySelector('.cpp-order')?.innerText || 'N/A';
                    const cost = row.querySelector('.cost-order')?.innerText || 'N/A';

                    orderData.push({ orderId, topicTitle, discipline, pages, deadline, cpp, cost });
                });
                return orderData;
            });

            console.log('Scraped Order Data:', orders);
        }

        // Set an interval to scrape orders every 5 minutes (300,000 milliseconds)
        setInterval(async () => {
            console.log('Starting a new scrape cycle...');
            await scrapeOrders();
        }, 300000); // Every 5 minutes

    } catch (error) {
        console.error('Error during login or scraping process:', error.message);
    }
})();
