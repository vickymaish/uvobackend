const puppeteer = require('puppeteer');
const fs = require('fs');

const path = require('path');

// Dynamic path for screenshot
const screenshotPath = path.join(__dirname, 'uvocorp_no_orders_screenshot.png');

// Now use this path in your takeScreenshot function

// Function to take a screenshot of the page
const takeScreenshot = async (page, screenshotPath) => {
    try {
        console.log('Taking screenshot...');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log('Screenshot taken successfully.');
    } catch (error) {
        console.error('Error taking screenshot:', error.message);
    }
};

// Function to send email with screenshot attachment

// Export the functions
module.exports = { takeScreenshot,screenshotPath };
