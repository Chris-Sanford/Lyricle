import lyricsgenius
import os

# Check if the secrets directory exists
try:
    with open('secrets/genius_client_access_token.key', 'r') as file:
        access_token = file.read().strip()
        if access_token == 'YOUR_ACCESS_TOKEN':
            print("Genius API Client Access Token not set. Please update the value of api/secrets/genius_client_access_token.key with the genius api client access token.")
            exit()
except FileNotFoundError:
    print("The secrets directory does not exist.")
    # Create the secrets directory
    os.mkdir('secrets')
    print("The secrets directory has been created.")
    # Create the genius_client_access_token.key file
    with open('secrets/genius_client_access_token.key', 'w') as file:
        file.write('YOUR_ACCESS_TOKEN')
    print("The genius_client_access_token.key file has been created. Please add your Genius API access token.")
    exit()
except Exception as e:
    print("An error occurred while reading the access token file:", e)
    exit()

# Set up the Genius API client
genius = lyricsgenius.Genius(access_token)
genius.skip_non_songs = True # Skip non-songs when searching (e.g. track lists)
genius.excluded_terms = ["(Live)"] # Exclude songs with these words in their title

# Search for the song lyrics
song = genius.search_song('Get Lucky', 'Daft Punk')

# Print the lyrics if found
if song is not None:
    print()
    print("Title: " + song.title)
    print("Artist: " + song.artist)
    print()
    print(song.lyrics)
    
    # Write the lyrics to a file in api dir (lyricsgenius module doesn't support saving to fully qualified path)
    song.save_lyrics('daily.json')

    # Get the root directory of the repository
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Get the lyrics directory path from the root
    lyrics_dir = os.path.join(root_dir, 'lyrics')

    # Remove the daily.json file if it exists
    daily_song_path = lyrics_dir + '\daily.json'
    if os.path.exists(daily_song_path):
        os.remove(daily_song_path)

    # Move the lyrics to the lyrics directory
    os.rename('daily.json', daily_song_path)
    print("Lyrics saved to lyrics/daily.json")
else:
    print("Lyrics not found.")

# Create dailyChorus.json file in lyrics directory
# This file will only store the chorus of the song for the day so we only have to do this once
# Therefore the client won't have to do the calculation
    
    