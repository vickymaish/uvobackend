const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const scrapeOrderDetails = async (page) => {
    // Wait for the table to load
    await page.waitForSelector('div.table-order', { timeout: 10000 });

    // Check if there are any orders to display
    const hasOrders = await page.$eval('div.table-order .no-orders', (noOrdersDiv) => {
        return noOrdersDiv.textContent.includes('There are currently no orders to display.') === false;
    });

    if (!hasOrders) {
        console.log('No orders to scrape. The table is empty.');
        return [];
    }

    // Scrape order rows
    const orders = await page.$$eval('div.table-order .tbody ul:not(.table-header)', (rows) =>
        rows.map((row) => {
            const orderId = row.querySelector('li.id-order .id-number-order')?.textContent.trim() || 'No Order ID';
            const topicTitle = row.querySelector('li.title-order')?.textContent.trim() || 'No Topic Title';
            const discipline = row.querySelector('li.discipline_academic-order')?.textContent.trim() || 'No Discipline';
            const pages = row.querySelector('li.pages-order')?.textContent.trim() || 'No Pages';
            const deadline = row.querySelector('li.time-order')?.textContent.trim() || 'No Deadline';
            const cpp = row.querySelector('li.cpp-order')?.textContent.trim() || 'No CPP';
            const cost = row.querySelector('li.cost-order')?.textContent.trim() || 'No Cost';
            const link = row.querySelector('a.order-link')?.getAttribute('href') || null;
            
            return {
                orderId,
                topicTitle,
                discipline,
                pages,
                deadline,
                cpp,
                cost,
                link,
            };
        })
    );

    // Collect additional data by navigating to each order link
    for (let order of orders) {
        if (order.link) {
            try {
                console.log(`Navigating to order details page: ${order.link}`);
                const orderPage = await page.browser().newPage();
                await orderPage.goto(`https://www.uvocorp.com${order.link}`, { waitUntil: 'domcontentloaded', timeout: 20000 });

                // Extract additional details (example: notes, attached files, etc.)
                order.details = await orderPage.evaluate(() => {
                    const details = document.querySelector('.order-details')?.textContent.trim() || 'No Details';
                    const attachedFiles = [...document.querySelectorAll('.file-link')].map((file) => file.textContent.trim()) || [];
                    return { details, attachedFiles };
                });

                await orderPage.close();
            } catch (error) {
                console.error(`Failed to scrape additional data for order ${order.orderId}:`, error.message);
            }
        }
    }

    return orders;
};

module.exports = { scrapeOrderDetails };
