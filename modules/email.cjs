const nodemailer = require('nodemailer');
const { Email_User, Email_Password, EMAIL_TO } = require('../config/config.cjs');

let emailSent = false;  // Flag to track if logged-out email is sent

const sendEmail = async (subject, text, loginEmail, order) => {
    // Prevent sending the "logged-out" email multiple times
    if (text && !order && emailSent) return;

    // Reset emailSent flag if we are sending a new order email
    if (order) emailSent = false;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: Email_User,
            pass: Email_Password,
        },
    });

    let htmlContent;

    if (order) {
        htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
                        .email-container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); overflow: hidden; }
                        .header { background: #ff9800; color: white; text-align: center; padding: 20px; font-size: 24px; }
                        .body { padding: 20px; color: #333333; line-height: 1.6; }
                        .footer { text-align: center; background: #eeeeee; padding: 10px; font-size: 12px; color: #777777; }
                        .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .details-table th, .details-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        .details-table th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">New Order from Uvotake</div>
                        <div class="body">
                            <p>Hi there,</p>
                            <p>We have a new order from <strong>${loginEmail.split('@')[0]}</strong>:</p>
                            <table class="details-table">
                                <tr><th>Order ID</th><td>${order.OrderId || 'N/A'}</td></tr>
                                <tr><th>Title</th><td>${order.title || 'N/A'}</td></tr>
                                <tr><th>Discipline</th><td>${order.discipline || 'N/A'}</td></tr>
                                <tr><th>Type of Paper</th><td>${order.typeOfPaper || 'N/A'}</td></tr>
                                <tr><th>Pages</th><td>${order.pages || 'N/A'}</td></tr>
                                <tr><th>Deadline</th><td>${order.deadline || 'N/A'}</td></tr>
                                <tr><th>Price</th><td>${order.price || 'N/A'}</td></tr>
                            </table>
                            <p class="quote">${text}</p>
                        </div>
                        <div class="footer">© 2025 Uvotake. All Rights Reserved.</div>
                    </div>
                </body>
            </html>
        `;
    } else {
        // Logged-out email (only send once per cycle)
        if (!emailSent) {
            emailSent = true; // Mark the email as sent
            htmlContent = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <style>
                            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
                            .email-container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); overflow: hidden; }
                            .header { background: #ff9800; color: white; text-align: center; padding: 20px; font-size: 24px; }
                            .body { padding: 20px; color: #333333; line-height: 1.6; }
                            .footer { text-align: center; background: #eeeeee; padding: 10px; font-size: 12px; color: #777777; }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <div class="header">Uvotake Bot Logged Out</div>
                            <div class="body">
                                <p>Hi there,</p>
                                <p>The bot for account <strong>${loginEmail.split('@')[0]}</strong> has been logged out.</p>
                                <p>${text}</p>
                            </div>
                            <div class="footer">© 2025 Uvotake. All Rights Reserved.</div>
                        </div>
                    </body>
                </html>
            `;
        } else {
            return; // Do not send the logged-out email if already sent
        }
    }

    const mailOptions = {
        from: `"Uvotake" <${Email_User}>`,
        to: EMAIL_TO,
        subject: subject,
        html: htmlContent,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(`Error occurred:`, error);
        } else {
            console.log(`Email sent successfully:`, info.response);
        }
    });
};

module.exports = sendEmail;
