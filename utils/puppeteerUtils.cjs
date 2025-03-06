const fs = require('fs');

async function loadCookies(cookiePath) {
    try {
        // Read cookies from the file
        const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
        
        // Log cookies to ensure they are loaded (optional for debugging)
        console.log('Loaded cookies:', cookies);
        
        return cookies;
    } catch (error) {
        console.error('Error loading cookies:', error);
        return [];
    }
}

module.exports = { loadCookies };
