const config = require('../config/config.cjs');
const logger = require('../utils/logger.cjs');
const { loadSession } = require('../utils/sessionHandler.cjs'); // Import loadSession function

const acceptedDisciplines = [
    'Humanities', 'Art (Fine arts, Performing arts)', 'Classic English Literature', 'Composition',
    'English 101', 'Film & Theater studies', 'History', 'Linguistics', 'Literature', 'Music',
    'Philosophy', 'Poetry', 'Religious studies', 'Shakespeare', 'Social Sciences', 'Anthropology',
    'Cultural and Ethnic Studies', 'Economics', 'Ethics', 'Political science', 'Psychology', 'Social Work and Human Services',
    'Sociology', 'Tourism', 'Urban Studies', "Women's & gender studies", 'Business and administrative studies',
    'Business Studies', 'Human Resources Management (HRM)', 'International Relations', 'Logistics', 'Management',
    'Marketing', 'Public Relations (PR)', 'Natural Sciences', 'Biology (and other Life Sciences)', 'Chemistry', 'Ecology',
    'Geography', 'Geology (and other Earth Sciences)', 'Zoology', 'Agriculture', 'Application Letters', 'Communications',
    'Criminal law', 'Education', 'Environmental studies and Forestry', 'Family and consumer science', 'Law', 'Leadership Studies',
    'Nutrition/Dietary', 'Public Administration', 'Sports'
];

// Function to click the "Take Order" button
const clickTakeOrderButton = async (page, orderId) => {
    try {
        logger.info(`Waiting for "Take Order" button for order ${orderId}...`);
        await page.waitForSelector(config.SELECTORS.TAKE_ORDER, { timeout: 5000 }).catch(() => null);

        const button = await page.$(config.SELECTORS.TAKE_ORDER);
        if (button) {
            logger.info(`Clicking "Take Order" button for order ${orderId}...`);
            await button.click();
            logger.info(`"Take Order" button clicked successfully for order ${orderId}.`);
            return true; // Button clicked successfully
        } else {
            logger.info(`Order ${orderId} does not have a "Take Order" button (likely a "Place Bid" order).`);
            return false; // Button not found
        }
    } catch (error) {
        logger.error(`Error clicking "Take Order" button for order ${orderId}:`, { error: error.message });
        throw error;
    }
};

const scrapeOrders = async (page, lastCheckedOrderId) => {
    try {
        logger.info('Starting to scrape orders...');
        
        // Load session cookies before navigating
        await loadSession(page, './session.json'); // Load session from saved file

        await page.goto('https://www.uvocorp.com/orders/available.html', { waitUntil: 'domcontentloaded' });

        const orders = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.row[data-order_id]')).map(orderElement => {
                // Skip revision orders
                if (orderElement.querySelector('i.revision')) {
                    return null;
                }

                const orderId = orderElement.getAttribute('data-order_id');
                const topicTitle = orderElement.querySelector('.title-order')?.textContent.trim() || 'N/A';
                const discipline = orderElement.querySelector('.discipline-order')?.textContent.trim() || 'N/A';
                const href = `https://www.uvocorp.com/order/${orderId}.html`;

                const cppText = orderElement.querySelector('.cpp-order')?.textContent.trim() || 'N/A';
                const cpp = parseFloat(cppText.replace('$', '')) || 0;
                const costText = orderElement.querySelector('.cost-order')?.textContent.trim() || 'N/A';
                const cost = parseFloat(costText.replace('$', '')) || 0;

                // Filter out low-paying orders
                if (cpp <= 3) return null;

                return { OrderId: orderId, topicTitle, discipline, cpp, cost, href };
            }).filter(order => order !== null); // Filter out null values (revision and low-paying orders)
        });

        if (orders.length === 0) {
            logger.info('No new orders available.');
            return [];
        }

        // Filter orders based on lastCheckedOrderId
        const newOrders = lastCheckedOrderId
            ? orders.filter(order => order.OrderId > lastCheckedOrderId)
            : orders;

        if (newOrders.length === 0) {
            logger.info('No new orders found since last check.');
            return [];
        }

        logger.info(`Found ${newOrders.length} new orders.`, { newOrders });

        // Process new orders
        for (const order of newOrders) {
            // Skip orders with unaccepted disciplines
            if (!acceptedDisciplines.includes(order.discipline)) {
                logger.info('Skipping order due to discipline', { orderId: order.OrderId, discipline: order.discipline });
                continue;
            }

            try {
                logger.info('Navigating to order', { orderId: order.OrderId, href: order.href });
                await page.goto(order.href, { waitUntil: 'domcontentloaded' });

                // Check for "Take Order" button
                const isTaken = await clickTakeOrderButton(page, order.OrderId);
                if (isTaken) {
                    // Scrape order details after taking the order
                    const orderDetails = await scrapeOrderDetails(page);
                    logger.info('Order taken successfully', { orderId: order.OrderId, details: orderDetails });
                } else {
                    // If "Take Order" button is not found, log and return to available orders page
                    logger.info(`Order ${order.OrderId} is not a "Take Order" task. Returning to available orders page...`);
                    await page.goto('https://www.uvocorp.com/orders/available.html', { waitUntil: 'domcontentloaded' });
                }
            } catch (error) {
                logger.error('Error processing order', { orderId: order.OrderId, error: error.message });
            }
        }

        // Update lastCheckedOrderId to the most recent order
        lastCheckedOrderId = newOrders[0].OrderId;
        logger.info('Updated lastCheckedOrderId', { lastCheckedOrderId });

        return newOrders;
    } catch (error) {
        logger.error('Error during scraping:', { error: error.message });
        throw error;
    }
};

const scrapeOrderDetails = async (page) => {
    try {
        const orderDetails = await page.evaluate(() => {
            const details = {};
            const listItems = document.querySelectorAll('ul.order--tabs__content-instraction-table li');

            listItems.forEach((li) => {
                const label = li.querySelector('.order--tabs__content-instraction-table-label')?.textContent.trim();
                const value = li.querySelector('.order--tabs__content-instraction-table-value')?.textContent.trim();

                if (label && value) {
                    switch (label) {
                        case 'Price':
                            details.price = value;
                            break;
                        case 'Deadline':
                            details.deadline = value;
                            break;
                        case 'Pages':
                            details.pages = value;
                            break;
                        case 'Type of paper':
                            details.typeOfPaper = value;
                            break;
                        case 'Discipline':
                            details.discipline = value;
                            break;
                        case 'Title':
                            details.title = value;
                            break;
                        default:
                            break;
                    }
                }
            });

            return details;
        });

        logger.info('Order details scraped successfully.', { orderDetails });
        return orderDetails;
    } catch (error) {
        logger.error('Error scraping order details:', { error: error.message });
        throw error;
    }
};

module.exports = { scrapeOrders, scrapeOrderDetails, clickTakeOrderButton };
