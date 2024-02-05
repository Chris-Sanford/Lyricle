import lyricsgenius # Module for accessing the Genius API
import os # Module for interacting with the operating system and filesystem
import json # Module for working with JSON data
import re # Module for working with regular expressions

# We need to implement a read operation timeout or retry handling 
# because we've seen this randomly fail with a timeout error before

# Functions
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

# Check if the secrets directory exists
try:
    # try to obtain the access token from the environment variables set in GitHub Actions / YML file
    access_token = os.getenv("GENIUS_CLIENT_ACCESS_TOKEN") 
    
    # if the environment variable wasn't set, assume we're running this locally and try to read the access token from the file
    if access_token is None:
        with open('secrets/genius_client_access_token.key', 'r') as file:
            access_token = file.read().strip()
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

# Set up the Genius API client
genius = lyricsgenius.Genius(access_token)
genius.skip_non_songs = True # Skip non-songs when searching (e.g. track lists)
genius.excluded_terms = ["(Live)"] # Exclude songs with these words in their title

# Search for the song lyrics
song = genius.search_song('Get Lucky', 'Daft Punk')

# Print the lyrics if found
if song is not None:
    # Clean up lyrics property since the module isn't perfect
    # Remove any instance of "You might also like" from song.lyrics
    song.lyrics = song.lyrics.replace('You might also like', '')

    # ensure all [ are preceeded by 2 newlines
    song.lyrics = song.lyrics.replace('[', '\n\n[')

    # Use a RegEx to ensure there are no more than 2 consecutive newlines
    song.lyrics = re.sub(r'\n{3,}', '\n\n', song.lyrics)

    # Remove any line that contains the string "ContributorsTranslations"
    song.lyrics = '\n'.join([line for line in song.lyrics.split('\n') if 'ContributorsTranslations' not in line])

    # If the last line ends in "Embed", remove "Embed" and any preceding numbers
    if song.lyrics.split('\n')[-1].endswith('Embed'):
        song.lyrics = '\n'.join(song.lyrics.split('\n')[:-1])

    print()
    print("Title: " + song.title_with_featured)
    print("Artist: " + song.artist)
    print(song.lyrics)
    print()

    daily_song_path = get_daily_json_path()

    save_daily_json(song, daily_song_path)

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
        add_chorus(chorus, daily_song_path)
    else:
        print("Chorus not found.")
        # Add a placeholder chorus to the lyrics JSON file
        add_chorus("Chorus not found.", daily_song_path)
else:
    print("Lyrics not found.")