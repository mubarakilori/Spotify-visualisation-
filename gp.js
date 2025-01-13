let tempo = 120; // Default tempo
let currentProgress = 0; // Current track progress 
let trackDuration = 0; // Total track duration 
let accessToken = 'BQDWq4CELvJeIna3HaNt802B5YFUnA4YIrQapF1WDTJptUM4IxB0SMHC5IB5hFBElVVdiDXUVgjV9p6QTP0Tv5xcBubqUSZnF4DrtdxIels6h2SzWalEeECzxVpWTvEN-fGgwrvEI9gvZ-WfWOu35PzttX0yUTa0o8Z1rWHXlzLevvzy0is424hSjkoyPNKMXEfS-QA';
let refreshToken = 'AQDFexPD_OGAcceTnzqp_5HBO-wh-G1BUFqbSXK_hk5MjO4vPmZ0sw0-jdc6UFBF3C2fYejgBr-xmDkClUSdkurB1zmjff5ysj6vohZ8Afcn4F-9FvWDp1BxvZN3wp3tBc8';
const clientId = '07717e07b7ef4a5aa86a6751f532ba45';
const clientSecret = '46eacd19eed64d6a8489a001a38489a8';

document.addEventListener("DOMContentLoaded", () => {
  // Fetch currently playing track on load and make sure to refresh every second
  getCurrentlyPlaying();
  setInterval(() => {
    getCurrentlyPlaying();
    updateTrackProgress();
  }, 1000); // every 1 second

  // Playback controls
  document.getElementById("play").addEventListener("click", () => {
    sendPlaybackCommand("play");
  });

  document.getElementById("pause").addEventListener("click", () => {
    sendPlaybackCommand("pause");
  });

  document.getElementById("next").addEventListener("click", () => {
    sendPlaybackCommand("next");
  });
});

// P5.js setup for the canvas
function setup() {
  createCanvas(400, 400);
  background(0);
}

function draw() {
  // Background gradient effect
  background(0);

  let circleSize = map(tempo, 60, 180, 50, 200); // Adjusted  to make the largest circle smaller
  let centerX = width / 2;
  let centerY = height / 2;

  // circle design
  for (let i = 1; i <= 5; i++) {
    let size = circleSize * i * 0.4; // Reduce size scaling for inner circles
    drawGlowCircle(centerX, centerY, size, color(255, 255, 255, 180)); // colour 
  }

  // Rotating inner radial lines
  push();
  translate(centerX, centerY);
  rotate(frameCount / 60); // Smooth rotation
  for (let angle = 0; angle < TWO_PI; angle += PI / 6) {
    strokeWeight(2);
    stroke(255, 100, 100); // Dynamic red lines
    line(0, 0, cos(angle) * (circleSize / 1.8), sin(angle) * (circleSize / 1.8)); // Adjust radius for visibility
  }
  pop();

  // Progress bar for track
  noStroke();
  fill(255); // White progress bar
  let progressBarWidth = map(currentProgress, 0, trackDuration, 0, width);
  rect(0, height - 20, progressBarWidth, 10);
}

// Helper Function: Draw glowing circle
function drawGlowCircle(x, y, size, glowColor) {
  for (let glow = 10; glow >= 1; glow--) {
    stroke(glowColor, 50, 255, 30 / glow); // Adjust transparency for glow effect
    strokeWeight(glow * 0.8);
    ellipse(x, y, size, size);
  }
}

// Fetch currently playing track
async function getCurrentlyPlaying() {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Currently Playing:", data);

      if (data.item) {
        updateUI(data); // Update the UI with track info
        getAudioFeatures(data.item.id); // Fetch audio features
        currentProgress = data.progress_ms;
        trackDuration = data.item.duration_ms;
      } else {
        console.warn("No track is currently playing.");
        clearUI();
      }
    } else if (response.status === 401) {
      console.warn("Access token expired. Refreshing token...");
      await refreshAccessToken();
      getCurrentlyPlaying(); // Retry after refreshing the token
    } else {
      console.error("Failed to fetch currently playing track.");
    }
  } catch (error) {
    console.error("Error fetching currently playing track:", error);
  }
}

// Fetch the audio features for the current track
async function getAudioFeatures(trackId) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Audio Features:", data);
      updateVisualization(data);
    } else if (response.status === 401) {
      console.warn("Access token expired. Refreshing token...");
      await refreshAccessToken();
      getAudioFeatures(trackId); // Retry after refreshing the token
    } else {
      console.error("Failed to fetch audio features.");
    }
  } catch (error) {
    console.error("Error fetching audio features:", error);
  }
}

// Update the UI with track info
function updateUI(data) {
  const trackName = data.item.name;
  const artistName = data.item.artists[0].name;
  const albumArt = data.item.album.images[0].url;

  document.getElementById("track-name").textContent = trackName;
  document.getElementById("artist-name").textContent = artistName;
  document.getElementById("album-art").src = albumArt;

  // Dynamically update the background image
  document.body.style.backgroundImage = `url(${albumArt})`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.filter = "brightness(0.7)"; // Darken for readability
}

// Clear the UI when no track is playing
function clearUI() {
  document.getElementById("track-name").textContent = "No Track Playing";
  document.getElementById("artist-name").textContent = "";
  document.getElementById("album-art").src = "";
  document.body.style.backgroundImage = ""; // Clear background
}

// Update visualization based on audio features
function updateVisualization(audioFeatures) {
  if (audioFeatures.tempo) {
    tempo = audioFeatures.tempo;
    console.log("Updated tempo:", tempo);
  } else {
    console.warn("Tempo not available. Using default.");
  }
}

// Update progress bar and track progress
function updateTrackProgress() {
  if (currentProgress < trackDuration) {
    currentProgress += 1000; // Add 1 second to progress
  }
}

// Refresh the access token when it expires
async function refreshAccessToken() {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.access_token;
      console.log("New Access Token:", accessToken);
    } else {
      console.error("Failed to refresh access token.");
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
}

// Send playback commands to Spotify
async function sendPlaybackCommand(command) {
  const url = `https://api.spotify.com/v1/me/player/${command}`;
  try {
    const response = await fetch(url, {
      method: command === "next" ? "POST" : "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      console.log(`${command} command sent successfully.`);
    } else if (response.status === 401) {
      console.warn("Access token expired. Refreshing token...");
      await refreshAccessToken();
      sendPlaybackCommand(command); // Retry after refreshing the token
    } else {
      console.error(`Failed to send ${command} command.`);
    }
  } catch (error) {
    console.error(`Error sending ${command} command:`, error);
  }
}