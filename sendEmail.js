const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const readline = require("readline");
const fs = require("fs");

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) {
    console.log("Error loading client secret file:", err);
    return;
  }
  // Authorize the client with OAuth2
  authorize(JSON.parse(content), sendEmail);
});

// Create an OAuth2 client with the given credentials.
function authorize(credentials, callback) {
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oAuth2Client, callback);
    } else {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    }
  });
}

// Get and store a new token after prompting for user authorization.
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log("Error retrieving access token", err);
        return;
      }
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) {
          console.log("Error storing token", err);
        } else {
          console.log("Token stored to", TOKEN_PATH);
        }
      });
      callback(oAuth2Client);
    });
  });
}

// Send an email using the Gmail API.
function sendEmail(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  const message = createMessage(
    "from-email@gmail.com",
    "to-email@gmail.com",
    "Test Email",
    "This is a test email sent using OAuth2 with Gmail API!"
  );

  gmail.users.messages.send(
    {
      userId: "me",
      requestBody: {
        raw: message,
      },
    },
    (err, res) => {
      if (err) {
        console.log("Error sending email:", err);
        return;
      }
      console.log("Email sent successfully:", res.data);
    }
  );
}

// Create a raw message to send via Gmail API
function createMessage(from, to, subject, messageText) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
    messageText,
  ].join("\n");

  return Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}
