const fs = require('fs');

const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const saveCookies = async (page, filePath) => {
    const cookies = await page.cookies();
    fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved to', filePath);
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { randomDelay, saveCookies, delay };