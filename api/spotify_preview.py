'''
To run:
pip install -r api/requirements.txt
python api/spotify_preview.py

This script is meant to be run on your local machine. It will fetch Spotify songs and use spotify-preview-finder to get preview URLs.
'''

import os
import json
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import subprocess
import sys
from dotenv import load_dotenv

#region Global Variable Declarations
service = 'spotify'
keyFileName = f'secrets/{service}_client_secret.key'
jsonFileName = f'data/topSongs.json'
nodeScriptPath = 'api/get_preview_url.js'
clientIdFileName = f'secrets/{service}_client_id.key'
#endregion Global Variable Declarations

#region Functions
def get_client_secret(keyFileName):
    try:
        with open(keyFileName, 'r') as file:
            secret = file.read().strip()
            if secret == 'YOUR_SECRET':
                print(f"{service} API Client Access Token not set. Please update the value of {keyFileName} with the {service} api client secret.")
                exit()
            return secret
    except FileNotFoundError:
        if not os.path.exists('secrets'):
            print("The secrets directory does not exist.")
            # Create the secrets directory
            os.mkdir('secrets')
            print("The secrets directory has been created.")
        # Create the key file
        with open(keyFileName, 'w') as file:
            file.write('YOUR_SECRET')
        print(f"The {keyFileName} file has been created. Please add your {service} API access token.")
        exit()
    except Exception as e:
        print("An error occurred while reading the access token file:", e)
        exit()

def get_client_id(clientIdFileName):
    try:
        with open(clientIdFileName, 'r') as file:
            client_id = file.read().strip()
            if client_id == 'YOUR_CLIENT_ID':
                print(f"{service} API Client ID not set. Please update the value of {clientIdFileName} with the {service} api client id.")
                exit()
            return client_id
    except FileNotFoundError:
        if not os.path.exists('secrets'):
            print("The secrets directory does not exist.")
            # Create the secrets directory
            os.mkdir('secrets')
            print("The secrets directory has been created.")
        # Create the key file
        with open(clientIdFileName, 'w') as file:
            file.write('YOUR_CLIENT_ID')
        print(f"The {clientIdFileName} file has been created. Please add your {service} API client id.")
        exit()
    except Exception as e:
        print("An error occurred while reading the client id file:", e)
        exit()

def check_spotify_preview_finder():
    """Check if spotify-preview-finder is installed"""
    try:
        # Check if the package is already installed
        check_cmd = ["npm", "list", "-g", "spotify-preview-finder"]
        result = subprocess.run(check_cmd, capture_output=True, text=True)
        
        if "spotify-preview-finder" in result.stdout:
            print("spotify-preview-finder is already installed.")
            return True
        else:
            print("Installing spotify-preview-finder...")
            install_cmd = ["npm", "install", "-g", "spotify-preview-finder", "dotenv"]
            subprocess.run(install_cmd, check=True)
            print("spotify-preview-finder installed successfully.")
            return True
    except Exception as e:
        print(f"Error checking/installing npm package: {e}")
        return False

def create_node_script():
    """Create a Node.js script to get preview URLs using spotify-preview-finder"""
    script_content = '''
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
'''
    
    with open(nodeScriptPath, 'w') as f:
        f.write(script_content)
    
    print(f"Created Node.js script at {nodeScriptPath}")

def create_dotenv_file(client_id, client_secret):
    """Create a .env file with Spotify credentials"""
    env_content = f'''SPOTIFY_CLIENT_ID={client_id}
SPOTIFY_CLIENT_SECRET={client_secret}
'''
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("Created .env file with Spotify credentials")

def get_preview_url_with_spotify_preview_finder(track_name, track_artist):
    """Get preview URL using spotify-preview-finder by running the Node.js script"""
    try:
        # Create a search query combining the track name and artist
        search_query = f"{track_name} {track_artist}"
        
        # Run the Node.js script to get the preview URL
        cmd = ["node", nodeScriptPath, search_query]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # The output should be the preview URL or an empty string
        preview_url = result.stdout.strip()
        
        if preview_url:
            print(f"Found preview URL for track {track_name}: {preview_url}")
            return preview_url
        else:
            print(f"No preview URL found for track {track_name}")
            return None
    except Exception as e:
        print(f"Error getting preview URL: {e}")
        return None

def update_preview_urls_with_spotify_preview_finder(all_tracks):
    """Update preview URLs for all tracks using spotify-preview-finder"""
    for track in all_tracks:
        try:
            # If there's already a preview URL from Spotify, keep it
            if track['preview_url'] and "spotify.com" in track['preview_url']:
                print(f"Track {track['title']} already has a Spotify preview URL")
                continue
                
            # Get preview URL using spotify-preview-finder
            preview_url = get_preview_url_with_spotify_preview_finder(track['title'], track['artist'])
            if preview_url:
                track['preview_url'] = preview_url
                print(f"Updated preview URL for {track['title']} by {track['artist']}")
        except Exception as e:
            print(f"An error occurred while fetching preview URL for {track['title']} by {track['artist']}: {e}")
#endregion Functions
        
#region Execution
def main():
    # Check and install spotify-preview-finder if needed
    if not check_spotify_preview_finder():
        print("Failed to set up spotify-preview-finder. Exiting.")
        exit(1)
    
    # Get Spotify client credentials
    client_id = get_client_id(clientIdFileName)
    client_secret = get_client_secret(keyFileName)
    
    # Create the Node.js script for getting preview URLs
    create_node_script()
    
    # Create .env file with Spotify credentials
    create_dotenv_file(client_id, client_secret)
    
    # Try to load .env file (for local testing)
    load_dotenv()
    
    # Set up Spotify client
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri='http://localhost:8888/callback/',
        scope='playlist-read-private'))

    # ID of the public playlist of Spotify's most streamed songs
    playlist_id = '2YRe7HRKNRvXdJBp9nXFza'

    # Initialize an empty list to store all tracks
    all_tracks = []

    # Set the limit
    limit = 100

    # Calculate the number of pages
    pages = 500 // limit
    remainder = 500 % limit
    if remainder > 0:
        pages += 1

    # Loop through each page
    for i in range(pages):
        # Calculate the offset
        offset = i * limit

        # Get the playlist items
        results = sp.playlist_items(playlist_id, limit=limit, offset=offset)

        # Get track data
        tracks = results['items']

        # Create an array of objects that contains the song name, artist name, song ID, and preview URL
        tracks = [{'title': track['track']['name'], 'artist': track['track']['artists'][0]['name'], 'id': track['track']['id'], 'preview_url': track['track']['preview_url']} for track in tracks]

        # Add the tracks to the all_tracks list
        all_tracks.extend(tracks)

    # Update preview URLs using spotify-preview-finder
    update_preview_urls_with_spotify_preview_finder(all_tracks)

    # Now all_tracks contains the tracks with preview URLs
    print(f"Total Tracks: {len(all_tracks)}")

    # Check if data directory exists, if not create it
    data_dir = os.path.dirname(jsonFileName)
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"The {data_dir} directory has been created.")

    # Save track data to JSON file with indentation
    with open(jsonFileName, 'w') as f:
        json.dump(all_tracks, f, indent=4)

    print(f"Playlist tracks saved to {jsonFileName}")

if __name__ == "__main__":
    main()
#endregion Execution 