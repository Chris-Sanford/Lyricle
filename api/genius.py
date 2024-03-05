"""
THIS SCRIPT DOES NOT WORK IN CLOUD ENVIRONMENTS DUE TO GENIUS API RESTRICTIONS

genius.py takes the list of songs from topSongs.json (generated from topSongs.api), obtains the lyrics for each song from the Genius API, then builds a JSON file for each song and its lyrics that satisfy the criteria for a sufficient daily song to be played within Lyricle.

To run this script, install the required modules contained within requirements.txt:
pip install -r api/requirements.txt

Then run the script (recommend running from root of repository):
python api/genius.py

On your first time running the script, you will encounter output stating that the Genius API Access Token has not been set, and that the .key file has been created in the secrets directory. Generate a new Genius API Client Access token here (https://genius.com/api-clients), then update the value of the .key file with the Access Token and re-run the script.
"""

import lyricsgenius # Module for accessing the Genius API
import os # Module for interacting with the operating system and filesystem
import json # Module for working with JSON data
import re # Module for working with regular expressions
import requests # Module for making HTTP requests
from time import sleep # Module for adding a delay to the script

#region Variables
daily_song_path = 'data/gameData.json'
topSongsJson = 'api/topSongs.json'
#endregion

#region Classes
# Define a class to represent a song (with lyrics)
class Song:
    def __init__(self, spotify_id, title, artist, chorus):
        self.spotify_id = spotify_id
        self.title = title
        self.artist = artist
        self.chorus = chorus
#endregion Classes

#region Functions
def get_client_secret(service, keyFileName):
    try:
        with open(keyFileName, 'r') as file:
            secret = file.read().strip()
            if secret == 'YOUR_SECRET':
                print(service," API Client Access Token not set. Please update the value of ",keyFileName," with the ",service," api client secret.")
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
        print("The ",keyFileName," file has been created. Please add your ",service," API access token.")
        exit()
    except Exception as e:
        print("An error occurred while reading the access token file:", e)
        exit()

def save_daily_json(songData, daily_song_path):
    # Remove the gameData.json file if it exists
    if os.path.exists(daily_song_path):
        os.remove(daily_song_path)

    # Save the songData to a JSON file
    with open(daily_song_path, 'w') as file:
        json.dump([song.__dict__ for song in songData], file, indent=4)

    print("Lyrics saved to " + daily_song_path)

def clean_up_lyrics(lyrics): # Clean up lyrics property since the lyricsgenius module isn't perfect
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
    lyrics = re.sub(r'\([^)]*\)', '', lyrics)

    # Replace nonstandard characters with standard characters
    # This is done on an as-needed basis as we encounter nonstandard characters
    # Some replacements like this weird e are necessary and others the client handles fine
    lyrics = lyrics.replace('\u0435', "e")

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

def search_song_with_retry(song_title, song_artist, max_retries=5, delay=5):
    for i in range(max_retries):
        try:
            return genius.search_song(song_title, song_artist)
        except requests.exceptions.Timeout:
            print(f"Timeout occurred for '{song_title}' by '{song_artist}'. Retrying ({i+1}/{max_retries}) after {delay} seconds...")
            sleep(delay)
    print(f"Failed to get song '{song_title}' by '{song_artist}' after {max_retries} attempts.")
    return None

def filter_profanity(chorus, neutrino_access_token):
    # Not in use. Leaving this here for now in case we implement in the future
    # Let's consider using the "obscene" option rather than "strict" to avoid filtering words like "kill"
    # Use the Neutrino API to filter profanity from the chorus
    url = "https://neutrinoapi.net/bad-word-filter"
    payload = {
        "content": chorus,
        "censor-character": "*"
    }
    headers = {
        "content-type": "application/x-www-form-urlencoded",
        "key": neutrino_access_token
    }
    response = requests.post(url, data=payload, headers=headers)

    if response.json()['censored-content'] is not None:
        print("\n\nCensored Chorus:")
        print(response.json()['censored-content'])

        # Return the censored chorus
        return response.json()['censored-content']
    else:
        print("\n\n\n!!!Something went wrong when trying to filter profanity from the chorus!!!\n\n)")
        return None

    # The values bad-words-list and bad-words-total will likely prove useful
    # when developing ideal secret lyrics algorithm
#endregion Functions

#region Execution
genius_access_token = get_client_secret("genius", 'secrets/genius_client_access_token.key')
neutrino_access_token = get_client_secret("neutrino", 'secrets/neutrino_client_access_token.key')

# Set up the Genius API client
genius = lyricsgenius.Genius(genius_access_token)
genius.skip_non_songs = True # Skip non-songs when searching (e.g. track lists)
genius.excluded_terms = ["(Live)"] # Exclude songs with these words in their title

# Load the top songs from the topSongs.json file
with open(topSongsJson, 'r') as file:
    top_songs = json.load(file)

# Initialize an array to store the song data (including lyrics)
songData = []

# Get the lyrics for each song from the Genius API
for song in top_songs:
    print()
    # Search for the song on Genius
    geniusData = search_song_with_retry(song['title'], song['artist'])

    if geniusData: # is found
        # Clean up lyrics property since the lyricsgenius module isn't perfect
        geniusData.lyrics = clean_up_lyrics(geniusData.lyrics)

        # Calculate the chorus
        chorus = get_chorus(geniusData)

        # If the chorus was not found or is None, then continue to next song
        if chorus == '' or chorus is None:
            print("Chorus not found. Proceeding to next song in array.")
            print("\n\n\n")
            continue

        # If there are more than 50 total words in the chorus,
        # repeatedly remove the last line from the chorus until
        # there are fewer than 50 total words AND more than 20 unique words in the chorus
        words = chorus.split()
        totalWordsCount = len(words)
        while totalWordsCount > 50:
            print(f"\n{totalWordsCount} total words detected. Removing last line from chorus.")
            chorus = '\n'.join(chorus.split('\n')[:-1])

            print("\nChorus After Last Line Removal:")
            print(chorus)

            # Recalculate the total number of unique words in the chorus
            words = chorus.split()
            totalWordsCount = len(words)
            
        # If there are fewer than 20 unique words in the chorus, then continue to next song
        uniqueWords = set(words)
        if len(uniqueWords) < 20:
            print("Less than 20 unique words. Proceeding to next song in array.")
            print("\n\n\n")
            continue

        print("\nTotal Words in Chorus: " + str(totalWordsCount))
        print("\nUnique Words in Chorus: " + str(len(uniqueWords)))

        # Add the song with the lyrics to the songData array
        songData.append(Song(song['id'], geniusData.title, geniusData.artist, chorus))
    else:
        print(f"Lyrics for {song['title']} by {song['artist']} not found.")

# Save the songData to a JSON file
save_daily_json(songData, daily_song_path)

# Print the total number of songs in top_songs and songData
print(f"Total Songs Queried: {len(top_songs)}")
print(f"Total Songs Returned: {len(songData)}")
#endregion Execution