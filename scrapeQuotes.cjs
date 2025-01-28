require('dotenv').config();
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Quote = require('./models/quote.cjs'); // Import the Quote model

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI1.trim(), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other email providers
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Password, // Use app password for Gmail
  },
});

// Define email options
const sendEmail = async (quote) => {
  const mailOptions = {
    from: `"Uvotake" <${process.env.Email_User}>`,
    to: process.env.EMAIL_TO.trim(),
    subject: `New Quote by ${quote.author}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
            }
            .email-container {
              max-width: 600px;
              margin: auto;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
              overflow: hidden;
            }
            .header {
              background: #ff9800;
              color: white;
              text-align: center;
              padding: 20px;
              font-size: 24px;
            }
            .body {
              padding: 20px;
              color: #333333;
              line-height: 1.6;
            }
            .quote {
              font-style: italic;
              color: #ff9800;
            }
            .footer {
              text-align: center;
              background: #eeeeee;
              padding: 10px;
              font-size: 12px;
              color: #777777;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              New Quote from Uvotake
            </div>
            <div class="body">
              <p>Hi there,</p>
              <p>We have a new quote for you:</p>
              <p class="quote">"${quote.text}"</p>
              <p>- ${quote.author}</p>
              <p>Tags: ${quote.tags.join(', ')}</p>
            </div>
            <div class="footer">
              © 2025 Uvotake. All Rights Reserved.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.log('Error occurred:', error);
  }
};

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', // Specify the path to the Chrome executable
    timeout: 60000, // Increase the timeout to 60 seconds
  });
  const page = await browser.newPage();
  await page.goto('http://quotes.toscrape.com/', { waitUntil: 'domcontentloaded' });

  // Scrape quotes
  const quotes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.quote')).map(quote => ({
      text: quote.querySelector('.text').innerText,
      author: quote.querySelector('.author').innerText,
      tags: Array.from(quote.querySelectorAll('.tags .tag')).map(tag => tag.innerText),
    }));
  });

  console.log('Scraped quotes:', quotes);

  // Save quotes to MongoDB and send email
  for (const quote of quotes) {
    const newQuote = new Quote(quote);
    try {
      await newQuote.save();
      console.log(`Quote by ${quote.author} saved to MongoDB.`);
      await sendEmail(quote); // Send email for each quote
    } catch (error) {
      console.error(`Error saving quote by ${quote.author}:`, error);
    }
  }

  await browser.close();
  mongoose.connection.close(); // Close the MongoDB connection
  console.log('Browser and MongoDB connection closed.');
})();