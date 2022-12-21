import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const user = process.env.EMAIL_ADD;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
const refreshToken = process.env.REFRESH_TOKEN;

const OAuth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri,
);
OAuth2Client.setCredentials({ refresh_token: refreshToken });

/**
 * Sends an email to specifed email address using Gmail API
 * @param {object} mailOptions Email details
 * @returns        message with result on success. Otherwise, an error message.
 */
async function sendMail(mailOptions) {
  try {
    const accessToken = await OAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken,

      },
    });

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

module.exports = sendMail;
