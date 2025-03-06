// config.cjs
require('dotenv').config();

const config = {
    // Login credentials for various users
    LOGIN_CREDENTIALS: [
        { email: process.env.LOGIN_EMAIL, password: process.env.LOGIN_PASSWORD },
        { email: process.env.LOGIN_EMAIL2, password: process.env.LOGIN_PASSWORD2 },
        { email: process.env.LOGIN_EMAIL3, password: process.env.LOGIN_PASSWORD3 },
        { email: process.env.LOGIN_EMAIL4, password: process.env.LOGIN_PASSWORD4 },
        { email: process.env.LOGIN_EMAIL5, password: process.env.LOGIN_PASSWORD5 },
        { email: process.env.LOGIN_EMAIL6, password: process.env.LOGIN_PASSWORD6 },
        { email: process.env.LOGIN_EMAIL7, password: process.env.LOGIN_PASSWORD7 },
        { email: process.env.LOGIN_EMAIL8, password: process.env.LOGIN_PASSWORD8 },
    ],

    // Email credentials for notifications
    EMAIL_CREDENTIALS: {
        user: process.env.Email_User,
        pass: process.env.Email_Password,
    },

    // UVO Email and password for taking orders
    UVO_CREDENTIALS: {
        email: process.env.UVO_EMAIL,
        password: process.env.UVO_PASSWORD,
    },

    // CSS selectors for scraping and interaction
    SELECTORS: {
        TAKE_ORDER: process.env.TAKE_ORDER_SELECTOR,
        PLACE_BID: process.env.PLACE_BID_SELECTOR,
        BUTTON: process.env.BUTTON_SELECTOR,
        LOGIN_EMAIL: process.env.LOGIN_EMAIL_SELECTOR,
        LOGIN_PASSWORD: process.env.LOGIN_PASSWORD_SELECTOR,
        LOGIN_BUTTON: process.env.LOGIN_BUTTON_SELECTOR,
    },

    // Email for notifications
    NOTIFICATION_EMAILS: {
        TO: process.env.EMAIL_TO,
        NOTIFICATION: process.env.NOTIFICATION_EMAIL,
    },

    // MongoDB configurations
    MONGO: {
        LOCAL_URI: process.env.MONGO_URILocal,
        ATLAS_URI: process.env.MONGO_URI,
        ATLAS_PASSWORD: process.env.Mongo_Atlas_Password,
    },
};

module.exports = config;