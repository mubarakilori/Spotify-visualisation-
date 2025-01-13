
const express = require('express');
const querystring = require('querystring');

const app = express();
const PORT = 8888;

// Spotify 
const clientId = '07717e07b7ef4a5aa86a6751f532ba45'; // Client ID
const clientSecret = '46eacd19eed64d6a8489a001a38489a8'; // Replace with your Spotify Client Secret
const redirectUri = 'http://localhost:8888/callback'; // Redirect URI 

// Debug: Log credentials to verify they are defined
console.log('Client ID:', clientId);
console.log('Client Secret:', clientSecret);
console.log('Redirect URI:', redirectUri);

// Route to handle Spotify's redirect
app.get('/callback', async (req, res) => {
  console.log('Request received at /callback'); // Debugging log

  const code = req.query.code || null;
  if (!code) {
    console.error('Authorization code not provided'); // Debugging log
    return res.status(400).send('Authorization code not provided');
  }

  try {
    console.log('Attempting to exchange authorization code for tokens...');

    // Exchange authorization code for access and refresh tokens
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId, // Debugging: Ensure clientId is used here
        client_secret: clientSecret, // Debugging: Ensure clientSecret is used here
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Log the tokens to the terminal
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);

    // Send response to browser
    res.send('Tokens successfully retrieved! Check your terminal for the details.');
  } catch (error) {
    console.error('Error retrieving access token:', error.response?.data || error.message);
    res.status(500).send('Error retrieving access token');
  }
});
const axios = require('axios');

async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Failed to refresh access token:', error.response?.data || error.message);
    return null;
  }
}

// Star server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});