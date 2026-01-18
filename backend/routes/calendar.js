const express = require('express');
const router = express.Router();
const { getAuthUrl, getTokenFromCode, isAuthenticated } = require('../config/googleAuth');

/**
 * Check authentication status
 */
router.get('/auth/status', (req, res) => {
  res.json({
    success: true,
    authenticated: isAuthenticated()
  });
});

/**
 * Get Google OAuth URL
 */
router.get('/auth/url', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({
      success: true,
      authUrl
    });
  } catch (err) {
    console.error('Error generating auth URL:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication URL'
    });
  }
});

/**
 * Handle OAuth callback
 */
router.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code is required'
    });
  }

  try {
    await getTokenFromCode(code);
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #4CAF50; }
            p { color: #666; }
            .close-btn {
              margin-top: 2rem;
              padding: 1rem 2rem;
              background: #1a1a1a;
              color: white;
              border: none;
              cursor: pointer;
              font-size: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Authentication Successful!</h1>
            <p>Google Calendar has been connected successfully.</p>
            <p>You can close this window and return to the application.</p>
            <button class="close-btn" onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error during OAuth callback:', err);
    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #f44336; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✗ Authentication Failed</h1>
            <p>There was an error connecting to Google Calendar.</p>
            <p>Error: ${err.message}</p>
          </div>
        </body>
      </html>
    `);
  }
});

module.exports = router;
