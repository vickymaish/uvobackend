const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const url = 'https://bot.sannysoft.com/';

const main = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', // Replace with the path to your Chrome executable
        timeout: 60000 // Increase timeout to 60 seconds
    });
    const page = await browser.newPage();
    await page.goto(url);
    await page.screenshot({ path: 'bot.jpg' });
    await browser.close();
};

main();