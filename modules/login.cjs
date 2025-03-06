const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

(async () => {
    console.log("🚀 Launching Puppeteer...");
    const browser = await puppeteer.launch({
        headless: false,  // False to allow CAPTCHA solving manually
        slowMo: 50,       // Mimic human speed
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    console.log("🎉 Puppeteer launched!");

    // Open a new page
    const page = await browser.newPage();

    // Close the first Chromium tab if it exists
    const pages = await browser.pages();
    if (pages.length > 0) {
        console.log("❌ Closing the first tab opened by Chromium...");
        await pages[0].close();
        console.log("✅ First tab closed successfully.");
    }

    // Set user agent
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    console.log(`🛠️ Setting user agent: ${userAgent}`);
    await page.setUserAgent(userAgent);

    try {
        // Navigate to the login page
        console.log("🌐 Navigating to login page...");
        await page.goto('https://www.uvocorp.com/login.html', {
            timeout: 0,
            waitUntil: 'domcontentloaded'
        });

        console.log("✅ Page loaded!");

        // Accept cookies logic
        const acceptCookiesSelector = process.env.BUTTON_SELECTOR || 'button#accept-cookies';
        console.log("⏳ Waiting for the 'Accept Cookies' button...");

        try {
            await page.waitForSelector(acceptCookiesSelector, { timeout: 40000 });
            const buttonExists = await page.$(acceptCookiesSelector);

            if (buttonExists) {
                console.log("🍪 'Accept Cookies' button found! Clicking...");
                await delay(randomDelay(200, 500)); // Small random delay
                await page.click(acceptCookiesSelector);
                console.log("✅ 'Accept Cookies' button clicked successfully.");
            } else {
                console.log("⚠️ 'Accept Cookies' button not found!");
            }
        } catch (error) {
            console.log("⏳ 'Accept Cookies' button did not appear within 40s.");
        }

        // Log in
        console.log("🔑 Waiting for login form...");
        const loginEmailSelector = process.env.LOGIN_EMAIL_SELECTOR || '#email';
        const loginPasswordSelector = process.env.LOGIN_PASSWORD_SELECTOR || '#password';

        await page.waitForSelector(loginEmailSelector);
        
        console.log("✉️ Typing email...");
        await page.type(loginEmailSelector, process.env.LOGIN_EMAIL, { delay: randomDelay(150, 250) });

        console.log("🔒 Typing password...");
        await page.type(loginPasswordSelector, process.env.LOGIN_PASSWORD, { delay: randomDelay(180, 250) });

        console.log("⏳ Waiting for 5-10 seconds before pressing Enter...");
        await delay(randomDelay(5000, 10000));

        console.log("🚀 Pressing Enter to submit the form...");
        await page.keyboard.press('Enter'); // Simulate pressing the Enter key

        console.log("⏳ Waiting for you to manually solve the CAPTCHA and log in...");
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });

        // Save cookies after login
        console.log("💾 Saving cookies...");
        const cookies = await page.cookies();
        fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2));
        console.log("✅ Cookies saved successfully!");

        console.log("🎉 Login process completed!");

    } catch (error) {
        console.error("🔥 Error during login:", error);
    }
})();
