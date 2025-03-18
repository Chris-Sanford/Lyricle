
// Script to get preview URL for a song using spotify-preview-finder
require('dotenv').config();
const spotifyPreviewFinder = require('spotify-preview-finder');

// Get song name and artist from command line arguments
const songQuery = process.argv[2];

async function getPreviewUrl() {
  try {
    const result = await spotifyPreviewFinder(songQuery, 1);
    
    if (result.success && result.results.length > 0) {
      // Return the first preview URL
      const previewUrl = result.results[0].previewUrls[0];
      console.log(previewUrl);
    } else {
      console.log('');  // Empty string if no preview URL found
    }
  } catch (error) {
    console.error(error.message);
    console.log('');  // Empty string on error
  }
}

getPreviewUrl();
