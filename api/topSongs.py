'''
To run:
pip install -r api/requirements.txt
python api/topSongs.py

This script is meant to be run on your local machine. It will save the top songs from a Spotify playlist to a JSON file. genius.py will use this JSON file to obtain a list of song lyrics to play with.
'''

import os
import json
import spotipy
from spotipy.oauth2 import SpotifyOAuth

#region Global Variable Declarations
service = 'spotify'
keyFileName = f'secrets/{service}_client_secret.key'
jsonFileName = f'data/topSongs.json'
#endregion Global Variable Declarations

#region Functions
def get_client_secret(keyFileName):
    try:
        with open(keyFileName, 'r') as file:
            secret = file.read().strip()
            if secret == 'YOUR_SECRET':
                print("{service} API Client Access Token not set. Please update the value of {keyFileName} with the {service} api client secret.")
                exit()
            return secret
    except FileNotFoundError:
        if not os.path.exists('secrets'):
            print("The secrets directory does not exist.")
            # Create the secrets directory
            os.mkdir('secrets')
            print("The secrets directory has been created.")
        # Create the genius_client_secret.key file
        with open(keyFileName, 'w') as file:
            file.write('YOUR_SECRET')
        print("The {keyFileName} file has been created. Please add your {service} API access token.")
        exit()
    except Exception as e:
        print("An error occurred while reading the access token file:", e)
        exit()
#endregion Functions
        
#region Execution
secret = get_client_secret(keyFileName)

# Set up Spotify client
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id='bdfb243246774f4d8f36386130717123',
    client_secret=secret,
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

# Now all_tracks contains the first 365 songs from the playlist
print(all_tracks)

# Print number of tracks saved to all_tracks
print(f"Total Tracks: {len(all_tracks)}")

# Save track data to JSON file with indentation
with open(jsonFileName, 'w') as f:
    json.dump(all_tracks, f, indent=4)

print(f"Playlist tracks saved to {jsonFileName}")
#endregion Execution