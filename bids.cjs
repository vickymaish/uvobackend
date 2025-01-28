const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const scrapeBids = async (page) => {
    const bids = await page.$$eval('a.order-link', (orderLinks) => {
        return orderLinks.map((link) => {
            const orderId = link.querySelector('li.id-order .id-number-order')?.textContent.trim() || 'No Order ID';
            const topicTitle = link.querySelector('li.title-order')?.textContent.trim() || 'No Topic Title';
            const discipline = link.querySelector('.discipline-order')?.textContent.trim() || 'No Discipline';
            const academicLevel = link.querySelector('.academic-level-order')?.textContent.trim() || 'No Academic Level';
            const deadline = link.querySelector('li.time-order span')?.textContent.trim() || 'No Deadline';
            const pages = link.querySelector('li.pages-cost-order span')?.textContent.trim() || 'No Pages';
            const cost = link.querySelector('li.pages-cost-order')?.textContent.split(' ')[1]?.trim() || 'No Cost';
            const bid = link.querySelector('li.bid-order')?.textContent.trim() || 'No Bid';
            const href = link.getAttribute('href') ? `https://www.uvocorp.com${link.getAttribute('href')}` : null;

            return {
                orderId,
                topicTitle,
                discipline,
                academicLevel,
                deadline,
                pages,
                cost,
                bid,
                href
            };
        });
    });
    return bids;
};

// Export the function
module.exports = { scrapeBids };
