'''
To run:
pip install -r api/requirements.txt
python api/update_preview_urls.py

This script updates preview URLs in gameData.json with Spotify preview URLs.
'''

import os
import json
import subprocess
import sys
from threading import Lock
import concurrent.futures

# Global Variable Declarations
spotify_client_id_filename = 'secrets/spotify_client_id.key'
spotify_client_secret_filename = 'secrets/spotify_client_secret.key'
game_data_json = 'data/gameData.json'
node_script_path = 'api/get_preview_url.js'
MAX_WORKERS = 8  # Max number of parallel threads
print_lock = Lock()  # Lock for thread-safe printing

def get_client_secret(service, keyFileName):
    try:
        with open(keyFileName, 'r') as file:
            secret = file.read().strip()
            if secret == 'YOUR_SECRET':
                print(f"{service} API Client Secret not set. Please update the value of {keyFileName} with the {service} api client secret.")
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

def get_client_id(clientIdFileName, service):
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
    
    with open(node_script_path, 'w') as f:
        f.write(script_content)
    
    print(f"Created Node.js script at {node_script_path}")

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
        cmd = ["node", node_script_path, search_query]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # The output should be the preview URL or an empty string
        preview_url = result.stdout.strip()
        
        with print_lock:
            if preview_url:
                print(f"Found Spotify preview URL for track {track_name}")
            else:
                print(f"No Spotify preview URL found for track {track_name}")
        
        return preview_url
    except Exception as e:
        with print_lock:
            print(f"Error getting preview URL: {e}")
        return None

def process_track_preview(track):
    """Process a single track's preview URL - for parallel execution"""
    try:
        # Check if the current preview_url is from Deezer
        if "deezer" in track['preview_url']:
            # Get new preview URL from Spotify using spotify-preview-finder
            spotify_preview_url = get_preview_url_with_spotify_preview_finder(track['title'], track['artist'])
            if spotify_preview_url:
                track['preview_url'] = spotify_preview_url
                with print_lock:
                    print(f"Updated preview URL for {track['title']} by {track['artist']} to Spotify URL")
            else:
                with print_lock:
                    print(f"Could not find Spotify preview URL for {track['title']} by {track['artist']}, keeping current URL")
        elif "spotify.com" in track['preview_url']:
            with print_lock:
                print(f"Track {track['title']} already has a Spotify preview URL")
        else:
            # URL is neither Deezer nor Spotify, try to get a Spotify URL
            spotify_preview_url = get_preview_url_with_spotify_preview_finder(track['title'], track['artist'])
            if spotify_preview_url:
                track['preview_url'] = spotify_preview_url
                with print_lock:
                    print(f"Updated preview URL for {track['title']} by {track['artist']} to Spotify URL")
        
        return track
    except Exception as e:
        with print_lock:
            print(f"An error occurred while processing {track['title']} by {track['artist']}: {e}")
        return track

def update_preview_urls(all_tracks):
    """Update preview URLs for all tracks using spotify-preview-finder with multithreading"""
    with print_lock:
        print(f"\nUpdating preview URLs using {MAX_WORKERS} parallel threads...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks and collect futures
        future_to_track = {executor.submit(process_track_preview, track): track for track in all_tracks}
        
        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_track):
            try:
                # We don't need to do anything with the result as the track is modified in-place
                future.result()
            except Exception as e:
                with print_lock:
                    print(f"Task generated an exception: {e}")

def save_data_json(file_path, data):
    """Save data to JSON file"""
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)
    
    print(f"Data saved to {file_path}")

def main():
    print("Starting Lyricle preview URL update process...\n")
    
    # Get Spotify client credentials
    spotify_client_id = get_client_id(spotify_client_id_filename, "Spotify")
    spotify_client_secret = get_client_secret("Spotify", spotify_client_secret_filename)
    
    # Check and install spotify-preview-finder if needed
    if not check_spotify_preview_finder():
        print("Failed to set up spotify-preview-finder. Exiting.")
        exit(1)
    
    # Create the Node.js script for getting preview URLs
    create_node_script()
    
    # Create .env file with Spotify credentials
    create_dotenv_file(spotify_client_id, spotify_client_secret)
    
    # Load the existing game data
    try:
        with open(game_data_json, 'r') as file:
            game_data = json.load(file)
        print(f"Loaded {len(game_data)} songs from {game_data_json}")
    except FileNotFoundError:
        print(f"Error: {game_data_json} not found. Please ensure the file exists.")
        exit(1)
    except json.JSONDecodeError:
        print(f"Error: {game_data_json} is not a valid JSON file.")
        exit(1)
    
    # Update preview URLs with Spotify URLs
    update_preview_urls(game_data)
    
    # Count how many songs have Spotify preview URLs
    spotify_count = sum(1 for track in game_data if track['preview_url'] and "spotify.com" in track['preview_url'])
    deezer_count = sum(1 for track in game_data if track['preview_url'] and "deezer" in track['preview_url'])
    other_count = len(game_data) - spotify_count - deezer_count
    
    # Save updated game data
    save_data_json(game_data_json, game_data)
    
    # Print summary
    print(f"\nPreview URL Update Summary:")
    print(f"Total Songs: {len(game_data)}")
    print(f"Songs with Spotify URLs: {spotify_count}")
    print(f"Songs with Deezer URLs: {deezer_count}")
    print(f"Songs with Other/No URLs: {other_count}")
    print("\nLyricle preview URL update complete!")

if __name__ == "__main__":
    main() 