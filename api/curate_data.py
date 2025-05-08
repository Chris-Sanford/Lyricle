'''
To run:
pip install -r api/requirements.txt
python api/curate_data.py

This script combines Spotify song fetching and Genius lyrics retrieval to build the game data JSON.
'''

import os
import json
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import subprocess
import sys
from dotenv import load_dotenv
import lyricsgenius
import re
import requests
from time import sleep
import concurrent.futures
from threading import Lock
import argparse

#region Global Variable Declarations
spotify_client_id_filename = 'secrets/spotify_client_id.key'
spotify_client_secret_filename = 'secrets/spotify_client_secret.key'
genius_client_access_token_filename = 'secrets/genius_client_access_token.key'
top_songs_json = 'data/topSongs.json'
game_data_json = 'data/uncensoredGameData.json'
node_script_path = 'api/get_preview_url.js'
MAX_WORKERS = 8  # Max number of parallel threads
print_lock = Lock()  # Lock for thread-safe printing
#endregion Global Variable Declarations

#region Classes
# Define a class to represent a song (with lyrics)
class Song:
    def __init__(self, spotify_id, title, artist, preview_url, chorus):
        self.spotify_id = spotify_id
        self.title = title
        self.artist = artist
        self.preview_url = preview_url
        self.chorus = chorus
#endregion Classes

#region Functions
def get_client_secret(service, keyFileName):
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
                print(f"Found preview URL for track {track_name}: {preview_url}")
            else:
                print(f"No preview URL found for track {track_name}")
        
        return preview_url
    except Exception as e:
        with print_lock:
            print(f"Error getting preview URL: {e}")
        return None

def process_track_preview(track):
    """Process a single track's preview URL - for parallel execution"""
    try:
        # If there's already a preview URL from Spotify, keep it
        if track['preview_url'] and "spotify.com" in track['preview_url']:
            with print_lock:
                print(f"Track {track['title']} already has a Spotify preview URL")
            return track
            
        # Get preview URL using spotify-preview-finder
        preview_url = get_preview_url_with_spotify_preview_finder(track['title'], track['artist'])
        if preview_url:
            track['preview_url'] = preview_url
            with print_lock:
                print(f"Updated preview URL for {track['title']} by {track['artist']}")
        return track
    except Exception as e:
        with print_lock:
            print(f"An error occurred while fetching preview URL for {track['title']} by {track['artist']}: {e}")
        return track

def update_preview_urls_with_spotify_preview_finder(all_tracks):
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
    # Ensure data directory exists
    data_dir = os.path.dirname(file_path)
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"The {data_dir} directory has been created.")
    
    # Save data to JSON file
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)
    
    print(f"Data saved to {file_path}")

def clean_up_lyrics(lyrics):
    # Remove any instance of "You might also like" from song.lyrics
    lyrics = lyrics.replace('You might also like', '')

    # ensure all [ are preceeded by 2 newlines
    lyrics = lyrics.replace('[', '\n\n[')

    # Use a RegEx to ensure there are no more than 2 consecutive newlines
    lyrics = re.sub(r'\n{3,}', '\n\n', lyrics)

    # Remove any line that contains the string "Contributors"
    lyrics = '\n'.join([line for line in lyrics.split('\n') if 'Contributors' not in line])

    # If the last line ends in "Embed", remove "Embed" and any preceding numbers
    if lyrics.split('\n')[-1].endswith('Embed'):
        lyrics = '\n'.join(lyrics.split('\n')[:-1])

    # Remove any line that contains the string "You might also like" using RegEx
    lyrics = re.sub(r'^.*You might also like.*$', '', lyrics, flags=re.MULTILINE)
    
    # Remove any line that contains the string "LiveGet tickets as low as"
    lyrics = re.sub(r'^.*LiveGet tickets as low as.*$', '', lyrics, flags=re.MULTILINE)

    # Remove any instance of parentheses and their contents
    # Lyrics within parenthesis often indicate lyrics that you can barely hear and likely would never know, so we remove them
    lyrics = re.sub(r'\([^)]*\)', '', lyrics)

    # Replace nonstandard characters with standard characters
    lyrics = lyrics.replace('\u0435', "e")
    lyrics = lyrics.replace('\u2019', "'")
    lyrics = lyrics.replace('\u2005', " ")

    return lyrics

def get_chorus(geniusData):
    # Calculate the chorus
    # Identify the line that indicates the chorus denoted by "[Chorus:"
    chorusIndicatorLine = ''
    for line in geniusData.lyrics.split('\n'):
        if '[Chorus' in line:
            chorusIndicatorLine = line
            break
    
    # If the chorus indicator line is found, extract the chorus
    if chorusIndicatorLine != '':
        chorus = ''

        # Use a regex to get all content between the first instance of chorusIndicatorLine and \n\n
        chorus_content = re.search(rf"{re.escape(chorusIndicatorLine)}(.*?)\n\n", geniusData.lyrics, re.DOTALL)

        if chorus_content:
            chorus = chorus_content.group(1)
        
        # Remove any instance of \n from the beginning or end of the chorus
        chorus = chorus.strip('\n')
        print("\nChorus:")
        print(chorus)
        return chorus
    else:
        print("\n\n\n!!! Chorus not found among the following lyrics/data !!! :\n")
        print(geniusData)
        return None

def search_song_with_retry(genius, song_title, song_artist, max_retries=5, delay=5):
    for i in range(max_retries):
        try:
            return genius.search_song(song_title, song_artist)
        except requests.exceptions.Timeout:
            print(f"Timeout occurred for '{song_title}' by '{song_artist}'. Retrying ({i+1}/{max_retries}) after {delay} seconds...")
            sleep(delay)
        except requests.exceptions.HTTPError as e:
            if "429" in str(e):  # Rate limit exceeded
                cooldown = 60 + (i * 30)  # Increasing cooldown: 60s, 90s, 120s, 150s, 180s
                print(f"Rate limit exceeded for '{song_title}' by '{song_artist}'. Cooling down for {cooldown} seconds...")
                sleep(cooldown)
            else:
                print(f"HTTP error occurred for '{song_title}' by '{song_artist}': {e}")
                sleep(delay)
    print(f"Failed to get song '{song_title}' by '{song_artist}' after {max_retries} attempts.")
    return None

def process_lyrics_with_genius(top_songs, genius_access_token):
    """Process song lyrics using Genius API (sequential to avoid rate limiting)"""
    print("\n=== Processing lyrics with Genius API (sequential to avoid rate limiting) ===\n")
    
    # Set up the Genius API client
    genius = lyricsgenius.Genius(genius_access_token)
    genius.skip_non_songs = True  # Skip non-songs when searching (e.g. track lists)
    genius.excluded_terms = ["(Live)"]  # Exclude songs with these words in their title

    # Initialize an array to store the song data (including lyrics)
    song_data = []
    rate_limit_hits = 0
    
    # Get the lyrics for each song from the Genius API sequentially
    for i, song in enumerate(top_songs):
        print(f"\nSong {i+1}/{len(top_songs)}")
        print(f"Searching for \"{song['title']}\" by {song['artist']}...")
        
        # If we've hit rate limit 3 times consecutively, take a long break
        if rate_limit_hits >= 3:
            cooldown = 300  # 5 minutes
            print(f"\nHit rate limit multiple times. Taking a longer {cooldown} second break to reset API limits...")
            sleep(cooldown)
            rate_limit_hits = 0
        
        try:
            # Search for the song on Genius
            genius_data = search_song_with_retry(genius, song['title'], song['artist'])

            if genius_data:  # is found
                # Reset rate limit counter on success
                rate_limit_hits = 0
                
                # Clean up lyrics property
                genius_data.lyrics = clean_up_lyrics(genius_data.lyrics)

                # Calculate the chorus
                chorus = get_chorus(genius_data)

                # If the chorus was not found or is None, then continue to next song
                if chorus == '' or chorus is None:
                    print("Chorus not found. Proceeding to next song in array.")
                    print("\n\n\n")
                    continue

                # If there are more than 50 total words in the chorus,
                # repeatedly remove the last line from the chorus until
                # there are fewer than 50 total words AND more than 20 unique words in the chorus
                words = chorus.split()
                total_words_count = len(words)
                while total_words_count > 50:
                    print(f"\n{total_words_count} total words detected. Removing last line from chorus.")
                    chorus = '\n'.join(chorus.split('\n')[:-1])

                    print("\nChorus After Last Line Removal:")
                    print(chorus)

                    # Recalculate the total number of words in the chorus
                    words = chorus.split()
                    total_words_count = len(words)
                    
                # If there are fewer than 20 unique words in the chorus, then continue to next song
                unique_words = set(words)
                if len(unique_words) < 20:
                    print("Less than 20 unique words. Proceeding to next song in array.")
                    print("\n\n\n")
                    continue

                print("\nTotal Words in Chorus: " + str(total_words_count))
                print("\nUnique Words in Chorus: " + str(len(unique_words)))

                # Add the song with the lyrics to the song_data array
                song_data.append(Song(song['id'], genius_data.title, genius_data.artist, song['preview_url'], chorus))
            else:
                print(f"Lyrics for {song['title']} by {song['artist']} not found.")
        except requests.exceptions.HTTPError as e:
            if "429" in str(e):  # Rate limit exceeded
                rate_limit_hits += 1
                print(f"Rate limit hit for {song['title']} by {song['artist']}. This is hit #{rate_limit_hits}.")
                cooldown = 60 * rate_limit_hits  # Increasing cooldown based on consecutive hits
                print(f"Cooling down for {cooldown} seconds...")
                sleep(cooldown)
            else:
                print(f"Error processing song {song['title']} by {song['artist']}: {e}")
        except Exception as e:
            print(f"Error processing song {song['title']} by {song['artist']}: {e}")
            
        # Add a small delay between requests to avoid hitting rate limits
        if i % 5 == 0 and i > 0:
            print("Taking a short break to avoid rate limiting...")
            sleep(3)

    return song_data

def fetch_spotify_songs(client_id, client_secret):
    """Fetch top songs from Spotify"""
    print("\n=== Fetching songs from Spotify ===\n")
    
    # Set up Spotify client
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri='http://localhost:8888/callback/',
        scope='playlist-read-private'))

    # ID of the public playlist of Spotify's most streamed songs
    playlist_id = '58zw0vG0X5GdT82of2G22L'

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

    # Update preview URLs using spotify-preview-finder with multithreading
    update_preview_urls_with_spotify_preview_finder(all_tracks)

    # Save track data to JSON file
    save_data_json(top_songs_json, all_tracks)
    
    print(f"Total Tracks: {len(all_tracks)}")
    return all_tracks

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Curate data for Lyricle game')
    parser.add_argument('--use-existing-songs', action='store_true', 
                        help='Use existing topSongs.json instead of fetching from Spotify API')
    args = parser.parse_args()
    
    print("Starting Lyricle data curation process...\n")
    
    # Get Spotify client credentials
    spotify_client_id = get_client_id(spotify_client_id_filename, "Spotify")
    spotify_client_secret = get_client_secret("Spotify", spotify_client_secret_filename)
    
    # Get Genius API access token
    genius_access_token = get_client_secret("Genius", genius_client_access_token_filename)
    
    # Check if we should use existing songs data
    if args.use_existing_songs and os.path.exists(top_songs_json):
        print(f"Using existing songs data from {top_songs_json}")
        with open(top_songs_json, 'r') as file:
            top_songs = json.load(file)
        print(f"Loaded {len(top_songs)} tracks from existing file")
    else:
        # Check and install spotify-preview-finder if needed
        if not check_spotify_preview_finder():
            print("Failed to set up spotify-preview-finder. Exiting.")
            exit(1)
        
        # Create the Node.js script for getting preview URLs
        create_node_script()
        
        # Create .env file with Spotify credentials
        create_dotenv_file(spotify_client_id, spotify_client_secret)
        
        # Try to load .env file (for local testing)
        load_dotenv()
        
        # Fetch songs from Spotify
        top_songs = fetch_spotify_songs(spotify_client_id, spotify_client_secret)
    
    # Process lyrics with Genius (sequential to avoid rate limiting)
    song_data = process_lyrics_with_genius(top_songs, genius_access_token)
    
    # Save final game data
    save_data_json(game_data_json, [song.__dict__ for song in song_data])
    
    # Print summary
    print(f"\nTotal Songs Queried: {len(top_songs)}")
    print(f"Total Songs in Game Data: {len(song_data)}")
    print("\nLyricle data curation complete!")

if __name__ == "__main__":
    main()
#endregion Execution 