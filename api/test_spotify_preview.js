// Basic test for spotify-preview-finder
require('dotenv').config(); // Load environment variables from .env file
const spotifyPreviewFinder = require('spotify-preview-finder');

async function testPreviewFinder() {
  try {
    console.log('Testing spotify-preview-finder...');
    console.log('Using Spotify credentials:');
    console.log(`Client ID: ${process.env.SPOTIFY_CLIENT_ID ? 'Set (hidden)' : 'Not set'}`);
    console.log(`Client Secret: ${process.env.SPOTIFY_CLIENT_SECRET ? 'Set (hidden)' : 'Not set'}`);
    
    // Test with a well-known song
    const result = await spotifyPreviewFinder('Shape of You Ed Sheeran', 1);
    
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.results.length > 0) {
      console.log('\nSuccess! Found preview URLs:');
      result.results.forEach(song => {
        console.log(`Song: ${song.name}`);
        console.log('Preview URLs:');
        song.previewUrls.forEach(url => console.log(`- ${url}`));
      });
    } else {
      console.error('Error or no results found:', result.error || 'No results');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPreviewFinder(); 