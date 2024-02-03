// See README for instructions on running this code

// Import the required modules
const https = require ('https'); // to make api calls over http(s)
const querystring = require ('querystring'); // to construct query strings
const fs = require('fs'); // to read and write files
const path = require('path'); // to work with file paths

// Define Genius Client ID
const clientId = 'SNzzubzHn0YcSJ4LsOxmihvpsuUP2HI9IX72VNmz3O8Z_9GPAEZz2MeKQzxjtDkX';

// Obtain Genius Client Secret from key file (gitignored)
const clientSecretFilePath = path.join(__dirname, 'secrets/genius_client_secret.key');
const clientSecret = fs.readFileSync(clientSecretFilePath, 'utf8').trim();

// Obtain Genius Client Access Token from key file (gitignored)
const clientAccessTokenFilePath = path.join(__dirname, 'secrets/genius_client_access_token.key');
const clientAccessToken = fs.readFileSync(clientAccessTokenFilePath, 'utf8').trim();

// Define the parameters for the track search API request
const trackParams = {
  q: 'Hello', // The song title
};

// Construct the query string from the track parameters
const trackQuery = querystring.stringify (trackParams);

// Define the options for the track search HTTPS request
const trackOptions = {
  hostname: 'api.genius.com',
  port: 443,
  path: '/search?' + trackQuery,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + clientAccessToken // Use the access token for authorization
  }
};

// Make the track search HTTPS request
const trackReq = https.request (trackOptions, (trackRes) => {
  // Check the status code
  if (trackRes.statusCode === 200) {
    // Initialize an empty string to store the track response data
    let trackData = '';

    // Listen for data chunks and append them to the track data string
    trackRes.on ('data', (chunk) => {
      trackData += chunk;
    });

    // Listen for the end of the track response and parse the track data
    trackRes.on ('end', () => {
      // Parse the JSON track data
      const trackJson = JSON.parse (trackData);

      // Check the status code of the track API response
      if (trackJson.message.header.status_code === 200) {
        // Get the first track from the track list
        const track = trackJson.message.body.track_list[0].track;

        // Log the track name and artist
        console.log (`Track: ${track.track_name} by ${track.artist_name}`);

        // Define the parameters for the lyrics get API request
        const lyricsParams = {
          apikey: apiKey, // Your API key
          track_id: track.track_id, // The track id
          format: 'json' // The output format
        };

        // Construct the query string from the lyrics parameters
        const lyricsQuery = querystring.stringify (lyricsParams);

        // Define the options for the lyrics get HTTPS request
        const lyricsOptions = {
          hostname: 'api.musixmatch.com',
          port: 443,
          path: '/ws/1.1/track.lyrics.get?' + lyricsQuery,
          method: 'GET'
        };

        // Make the lyrics get HTTPS request
        const lyricsReq = https.request(lyricsOptions, (lyricsRes) => {
          let lyricsData = '';

          lyricsRes.on('data', (chunk) => {
            lyricsData += chunk;
          });

          lyricsRes.on('end', () => {
            const lyricsJson = JSON.parse(lyricsData);

            if (lyricsJson.message.header.status_code === 200) {
              const lyrics = lyricsJson.message.body.lyrics.lyrics_body;

              // Create song information object
              const songInfo = {
                track_id: track.track_id,
                title: track.track_name,
                artist: track.artist_name,
                lyrics: lyrics
              };

              // Convert song information object to JSON
              const songInfoJson = JSON.stringify(songInfo);

              // Write song information to a JSON file in the lyrics directory
              // Define the path to the lyrics folder
              let lyricsFolderPath = path.join(__dirname, '..', 'lyrics');
              // Define the file path
              let filePath = path.join(lyricsFolderPath, 'daily.json');
              fs.writeFile(`${filePath}`, songInfoJson, (err) => {
                if (err) {
                  console.error('Error writing file:', err);
                } else {
                  console.log('File written successfully');
                }
              });
            }
          });
        });

        lyricsReq.end();
      }
    });
  }
});

trackReq.end();