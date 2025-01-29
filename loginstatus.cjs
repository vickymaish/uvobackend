// const checkLoginStatus = async (page, retries = 3) => {
//     for (let attempt = 1; attempt <= retries; attempt++) {
//         try {
//             console.log(`Checking login status (attempt ${attempt}/${retries})...`);
//             await page.goto('https://www.uvocorp.com/orders/available.html', { waitUntil: 'domcontentloaded' });
//             await page.waitForSelector('button[data-toggle="collapse"][data-target=".header--nav__link-profile-nav"]', { timeout: 10000 });
//             await page.click('button[data-toggle="collapse"][data-target=".header--nav__link-profile-nav"]');
//             await page.waitForSelector('.header--nav__link-profile-nav.show', { timeout: 10000 });

//             const isLoggedIn = await page.evaluate(() => {
//                 const logoutLink = document.querySelector('.header--nav__link-profile-nav.show a[href="/logout"]');
//                 return logoutLink !== null;
//             });

//             return isLoggedIn; // True if logged in
//         } catch (error) {
//             console.error(`Error checking login status on attempt ${attempt}:`, error.message);
//             if (attempt === retries) return false; // Assume logged out after all retries fail
//         }
//     }
// };


// const loginEmail = process.env.LOGIN_EMAIL;

// // Function to send a logout notification
// const sendLogoutNotification = async () => {
//     const subject = `Account Logged Out: ${loginEmail}`;
//     const text = `The account ${loginEmail} has been logged out. Please log in again.`;
//     await sendEmail(subject, text, loginEmail, {});
// };

// Function to log in again
// const loginAgain = async (page) => {
//     const retries = 3;
//     for (let attempt = 1; attempt <= retries; attempt++) {
//         try {
//             console.log(`Attempting to log in again (attempt ${attempt}/${retries})...`);
//             await page.goto('https://www.uvocorp.com/login.html', { waitUntil: 'domcontentloaded' });

//             await page.type(process.env.LOGIN_EMAIL_SELECTOR, process.env.LOGIN_EMAIL, { delay: 100 });
//             await page.type(process.env.LOGIN_PASSWORD_SELECTOR, process.env.LOGIN_PASSWORD, { delay: 100 });
//             await page.click(process.env.LOGIN_BUTTON_SELECTOR);

//             await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
//             console.log('Logged in successfully.');
//             return true; // Login succeeded
//         } catch (error) {
//             console.error(`Error logging in again on attempt ${attempt}:`, error.message);
//             if (attempt < retries) {
//                 const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
//                 console.log(`Retrying in ${delay / 1000} seconds...`);
//                 await new Promise(resolve => setTimeout(resolve, delay));
//             } else {
//                 console.error('Failed to log in after multiple attempts.');
//                 return false; // Login failed
//             }
//         }
//     }
// };


// Modify the interval to include login status check
// setInterval(async () => {
//     try {
//         console.log('Starting a new scrape cycle...');
        
//         const isLoggedIn = await checkLoginStatus(page);
//         if (!isLoggedIn) {
//             console.log('Account is logged out. Sending notification and attempting to log in again...');
//             await sendLogoutNotification();
//             const loginSuccess = await loginAgain(page);
//             if (!loginSuccess) {
//                 console.log('Skipping this scrape cycle due to failed login.');
//                 return;
//             }
//         }

//         console.log('Account is still logged in. Checking for new orders...');
//         await checkForNewOrders(page);
//     } catch (error) {
//         console.error('Error during scrape cycle:', error.message);
//     }
// }, 60000); // Check every 60 seconds
