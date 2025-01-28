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
        console.log('Setting viewport size...');
        await page.setViewport({ width: 1366, height: 768 });
        console.log('Viewport size set to 1366x768.');

        console.log('Navigating to the page...');
        await page.goto('https://www.uvocorp.com/login.html', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const acceptCookiesSelector = 'button[type="button"]';
        console.log('Waiting for the "Accept Cookies" button...');
        await page.waitForSelector(acceptCookiesSelector, { timeout: 10000 });

        console.log('Clicking "Accept Cookies" button...');
        await page.click(acceptCookiesSelector);
        console.log('"Accept Cookies" button clicked successfully.');

        console.log('Waiting for login form...');
        await page.waitForSelector('input[name="loginEmail"]');
        await page.waitForSelector('input[name="loginPassword"]');

        console.log('Typing login credentials...');
        await page.type('input[name="loginEmail"]', process.env.LOGIN_EMAIL, { delay: 150 });
        await page.type('input[name="loginPassword"]', process.env.LOGIN_PASSWORD, { delay: 150 });

        const loginButtonSelector = '#loginSubmit';
        console.log('Waiting for login button...');
        await page.waitForSelector(loginButtonSelector, { timeout: 10000 });

        // Scroll into view and confirm the button is clickable
        console.log('Scrolling to make the "Log In" button visible...');
        await page.evaluate((selector) => {
            document.querySelector(selector).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, loginButtonSelector);

        console.log('Checking if the "Log In" button is visible...');
        const isButtonVisible = await page.evaluate((selector) => {
            const button = document.querySelector(selector);
            return button ? button.offsetParent !== null : false;
        }, loginButtonSelector);
        
        if (!isButtonVisible) {
            throw new Error('"Log In" button is not visible!');
        }

        console.log('Clicking "Log In" button...');
        await page.click(loginButtonSelector);

        // Confirm the button was clicked by checking for navigation or other UI changes
        console.log('Waiting for the login process to complete...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        console.log('Login process completed.');

        // Add additional scraping or logic here if needed

    } catch (error) {
        console.error('Error during login or scraping process:', error.message);
    } finally {
        await browser.close();
    }
})();
