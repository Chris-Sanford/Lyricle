"""
THIS SCRIPT DOES NOT WORK IN CLOUD ENVIRONMENTS DUE TO GENIUS API RESTRICTIONS

genius.py takes the list of songs from topSongs.json (generated from spotify.api), obtains the lyrics for each song from the Genius API, then builds a JSON file for each song and its lyrics that satisfy the criteria for a sufficient daily song to be played within Lyricle.

To run this script, install the required modules contained within requirements.txt:
pip install -r requirements.txt

Then run the script (recommend running from root of repository):
python api/genius.py

On your first time running the script, you will encounter output stating that the Genius API Access Token has not been set, and that the .key file has been created in the secrets directory. Generate a new Genius API Client Access token here (https://genius.com/api-clients), then update the value of the .key file with the Access Token and re-run the script.

Future Improvements:
- Implement a read operation timeout or retry handling because we've seen this randomly fail with a timeout error before
"""

import lyricsgenius # Module for accessing the Genius API
import os # Module for interacting with the operating system and filesystem
import json # Module for working with JSON data
import re # Module for working with regular expressions

#region Functions
def get_client_access_token():
    # Obtain the Genius API Access Token from the .key file, create it if it doesn't exist
    try:
        with open('secrets/genius_client_access_token.key', 'r') as file:
            access_token = file.read().strip()
            return access_token
            if access_token == 'YOUR_ACCESS_TOKEN':
                print("Genius API Client Access Token not set. Please update the value of secrets/genius_client_access_token.key with the genius api client access token.")
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

def get_daily_json_path():
    # Get the daily.json file path
    daily_song_path = 'lyrics/daily.json'
    return daily_song_path

def save_daily_json(song, daily_song_path):
    # Write the lyrics to a file in api dir (lyricsgenius module doesn't support saving to fully qualified path)
    song.save_lyrics('daily.json')

    # Remove the daily.json file if it exists
    if os.path.exists(daily_song_path):
        os.remove(daily_song_path)

    # Move the lyrics to the lyrics directory
    os.rename('daily.json', daily_song_path)
    print("Lyrics saved to lyrics/daily.json")

def add_chorus(chorus, daily_song_path):
    # Append the "chorus" attribute to the lyrics JSON file
    with open(daily_song_path, 'r+') as json_file:
        data = json.load(json_file)
        # Update the below to reliably calculate and extract the chorus from the lyrics
        data['chorus'] = chorus
        json_file.seek(0)
        json.dump(data, json_file, indent=4)
        json_file.truncate()
    print("Chorus added to daily.json")

    # Save the changes to the lyrics JSON file
    json_file.close()

def clean_up_lyrics(lyrics): # Clean up lyrics property since the lyricsgenius module isn't perfect
    # Remove any instance of "You might also like" from song.lyrics
    lyrics = song.lyrics.replace('You might also like', '')

    # ensure all [ are preceeded by 2 newlines
    lyrics = lyrics.replace('[', '\n\n[')

    # Use a RegEx to ensure there are no more than 2 consecutive newlines
    lyrics = re.sub(r'\n{3,}', '\n\n', lyrics)

    # Remove any line that contains the string "ContributorsTranslations"
    lyrics = '\n'.join([line for line in lyrics.split('\n') if 'ContributorsTranslations' not in line])

    # If the last line ends in "Embed", remove "Embed" and any preceding numbers
    if lyrics.split('\n')[-1].endswith('Embed'):
        lyrics = '\n'.join(lyrics.split('\n')[:-1])

    return lyrics

def get_chorus(song):
    # Calculate the chorus
    # Identify the line that indicates the chorus denoted by "[Chorus:"
    chorusIndicatorLine = ''
    for line in song.lyrics.split('\n'):
        if '[Chorus:' in line:
            chorusIndicatorLine = line
            break

    print("Chorus Indicator Line: " + chorusIndicatorLine)
    
    # If the chorus indicator line is found, extract the chorus
    if chorusIndicatorLine != '':
        chorus = ''

        # Use a regex to get all content between the first instance of chorusIndicatorLine and \n\n
        chorus_content = re.search(rf"{re.escape(chorusIndicatorLine)}(.*?)\n\n", song.lyrics, re.DOTALL)

        if chorus_content:
            chorus = chorus_content.group(1)
        
        # Remove any instance of \n from the beginning or end of the chorus
        chorus = chorus.strip('\n')
        print("\nChorus:")
        print(chorus)
        print() 
    else:
        print("Chorus not found.")
        # Add a placeholder chorus to the lyrics JSON file
        add_chorus("Chorus not found.", daily_song_path)

    return chorus

#endregion Functions

#region Execution
access_token = get_client_access_token()

# Set up the Genius API client
genius = lyricsgenius.Genius(access_token)
genius.skip_non_songs = True # Skip non-songs when searching (e.g. track lists)
genius.excluded_terms = ["(Live)"] # Exclude songs with these words in their title

# Search for the song lyrics
song = genius.search_song('Get Lucky', 'Daft Punk')

if song is not None: # if the song was found
    song.lyrics = clean_up_lyrics(song.lyrics)

    print()
    print("Title: " + song.title_with_featured)
    print("Artist: " + song.artist)
    print(song.lyrics)
    print()

    daily_song_path = get_daily_json_path()

    save_daily_json(song, daily_song_path)

    chorus = get_chorus(song)

    add_chorus(chorus, daily_song_path)
else:
    print("Lyrics not found.")

#endregion Execution