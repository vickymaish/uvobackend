// orderScraper.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealthPlugin());

// Function to scrape order details
const scrapeOrderDetails = async (page) => {
    const orders = await page.$$eval('li.id-order.sortable', (orderElements) => {
        return orderElements.map((el) => {
            const orderId = el.textContent.trim();
            const topicTitle = el.closest('div').querySelector('.title-order')?.textContent.trim() || 'No Topic Title';
            const discipline = el.closest('div').querySelector('.discipline_academic-order')?.textContent.trim() || 'No Discipline';
            const pages = el.closest('div').querySelector('.pages-order.center.sortable')?.textContent.trim() || 'No Pages';
            const deadline = el.closest('div').querySelector('.time-order.center.sortable')?.textContent.trim() || 'No Deadline';
            const cpp = el.closest('div').querySelector('.cpp-order.center.sortable')?.textContent.trim() || 'No CPP';
            const cost = el.closest('div').querySelector('.cost-order.center')?.textContent.trim() || 'No Cost';

            return {
                orderId,
                topicTitle,
                discipline,
                pages,
                deadline,
                cpp,
                cost
            };
        });
    });
    return orders;
};

// Export the function to be used elsewhere
module.exports = { scrapeOrderDetails };
