// Define API Key, DO NOT COMMIT TO REPO
const apiKey = '';

// Import the required modules
const https = require ('https');
const querystring = require ('querystring');

// Define the parameters for the track search API request
const trackParams = {
  apikey: apiKey, // Your API key
  q_track: 'Hello', // The song title
  q_artist: 'Adele', // The song artist
  format: 'json' // The output format
};

// Construct the query string from the track parameters
const trackQuery = querystring.stringify (trackParams);

// Define the options for the track search HTTPS request
const trackOptions = {
  hostname: 'api.musixmatch.com',
  port: 443,
  path: '/ws/1.1/track.search?' + trackQuery,
  method: 'GET'
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
        const lyricsReq = https.request (lyricsOptions, (lyricsRes) => {
          // Check the status code
          if (lyricsRes.statusCode === 200) {
            // Initialize an empty string to store the lyrics response data
            let lyricsData = '';

            // Listen for data chunks and append them to the lyrics data string
            lyricsRes.on ('data', (chunk) => {
              lyricsData += chunk;
            });

            // Listen for the end of the lyrics response and parse the lyrics data
            lyricsRes.on ('end', () => {
              // Parse the JSON lyrics data
              const lyricsJson = JSON.parse (lyricsData);

              // Check the status code of the lyrics API response
              if (lyricsJson.message.header.status_code === 200) {
                // Get the lyrics from the lyrics body
                const lyrics = lyricsJson.message.body.lyrics.lyrics_body;

                // Log the lyrics
                console.log (`Lyrics: ${lyrics}`);
              } else {
                // Log the error message from the lyrics API response
                console.error (`Lyrics API error: ${lyricsJson.message.header.status_code}`);
              }
            });
          } else {
            // Log the error message from the lyrics HTTPS request
            console.error (`Lyrics HTTPS error: ${lyricsRes.statusCode}`);
          }
        });

        // Handle any errors from the lyrics HTTPS request
        lyricsReq.on ('error', (error) => {
          console.error (error);
        });

        // End the lyrics HTTPS request
        lyricsReq.end ();
      } else {
        // Log the error message from the track API response
        console.error (`Track API error: ${trackJson.message.header.status_code}`);
      }
    });
  } else {
    // Log the error message from the track HTTPS request
    console.error (`Track HTTPS error: ${trackRes.statusCode}`);
  }
});

// Handle any errors from the track HTTPS request
trackReq.on ('error', (error) => {
  console.error (error);
});

// End the track HTTPS request
trackReq.end ();
