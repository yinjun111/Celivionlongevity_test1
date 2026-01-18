const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// OAuth2 credentials
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

/**
 * Create an OAuth2 client with the given credentials
 */
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
  );

  // Try to load existing token
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      oauth2Client.setCredentials(token);
    }
  } catch (err) {
    console.log('No token found or error reading token:', err.message);
  }

  return oauth2Client;
}

/**
 * Generate the authentication URL for OAuth2 flow
 */
function getAuthUrl() {
  const oauth2Client = getOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
async function getTokenFromCode(code) {
  const oauth2Client = getOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save the token for future use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('Token stored to', TOKEN_PATH);

    return tokens;
  } catch (err) {
    console.error('Error retrieving access token:', err);
    throw err;
  }
}

/**
 * Check if we have valid credentials
 */
function isAuthenticated() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      return token && token.access_token;
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Refresh the access token if needed
 */
async function refreshTokenIfNeeded(oauth2Client) {
  try {
    const credentials = oauth2Client.credentials;

    if (!credentials.expiry_date) {
      return oauth2Client;
    }

    // If token expires in less than 5 minutes, refresh it
    const expiryDate = new Date(credentials.expiry_date);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiryDate.getTime() - now.getTime() < fiveMinutes) {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(newCredentials);

      // Save the new token
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(newCredentials));
      console.log('Token refreshed and saved');
    }

    return oauth2Client;
  } catch (err) {
    console.error('Error refreshing token:', err);
    throw err;
  }
}

module.exports = {
  getOAuth2Client,
  getAuthUrl,
  getTokenFromCode,
  isAuthenticated,
  refreshTokenIfNeeded,
  SCOPES
};
