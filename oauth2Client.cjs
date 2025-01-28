import { google } from 'googleapis';
import fs from 'fs';
import readline from 'readline';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const puppeteer = require('puppeteer');

// Load client secrets from a local file
const credentials = JSON.parse(fs.readFileSync('credentials.json'));

// Set up the OAuth2 client
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Check if we have previously stored a token
fs.readFile('token.json', (err, token) => {
  if (err) return getAccessToken(oAuth2Client);
  oAuth2Client.setCredentials(JSON.parse(token));
  listEmails(oAuth2Client);
});

// Function to get new access token
function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later use
      fs.writeFile('token.json', JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to token.json');
      });
      listEmails(oAuth2Client);
    });
  });
}

// List emails in the Gmail inbox
function listEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.messages.list(
    {
      userId: 'me',
    },
    (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const messages = res.data.messages;
      if (messages.length) {
        console.log('Messages:');
        messages.forEach((message) => {
          console.log(`- ${message.id}`);
        });
      } else {
        console.log('No messages found.');
      }
    }
  );
}
