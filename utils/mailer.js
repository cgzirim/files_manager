import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import credentials from './credentials';

const OAuth2Client = new google.auth.OAuth2(
  credentials.clientId,
  credentials.clientSecret,
  credentials.redirectUri,
);
OAuth2Client.setCredentials({ refresh_token: credentials.refreshToken });

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
        user: credentials.user,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        refreshToken: credentials.refreshToken,
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
