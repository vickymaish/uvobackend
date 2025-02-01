const winston = require('winston');
const path = require('path');

const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    return `${timestamp} [${level}] : ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(__dirname, 'logs', 'app.log'),
            level: 'info',
        }),
    ],
});

module.exports = logger;