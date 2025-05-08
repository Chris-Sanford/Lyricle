# Lyricle

Lyricle is a lyric guessing game. Play the daily challenge at [lyricle.io](https://lyricle.io) and put your knowledge to the test!

# Hosting

## The Game

With Lyricle being fully client-side HTML / CSS / JavaScript, you can host it on any platform that supports static web pages.

## The Data

Lyricle relies on JSON data that contains the song title, artist, and lyrics. If you're looking to curate and host your own data, follow the instructions below.

### Hosting the Data

Lyricle pulls data from my personal CloudFlare R2 bucket by default. However, you can modify this in your instance to pull from wherever you'd like.

### Curating the Data

The `.key` files should be created for you by default when you run the respective scripts, they just need to be populated with their respective keys. You'd obtain these keys from the API services themselves, and the keys are specific to your account.

**Install Python and Requirements**

Windows 11
```sh
winget install Python.Python.3.12
```

macOS
```sh
brew install python
```

Install Required Python Packages
```sh
pip install -r api/requirements.txt
// or
pip3 install -r api/requirements.txt
```

#### Set API Keys for Spotify

1. **Register Your Application**: 
   - Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
   - Log in with your Spotify account.
   - Click on "Create an App" and fill in the required details.

2. **Obtain Your API Keys**:
   - Once your app is created, navigate to the app's settings.
   - Copy the `Client ID` and `Client Secret`.

3. **Set the API Keys in Your Application**:
   - Create a file named `spotify_client_id.key` in the `secrets` directory and paste your `Client ID`
   - Create a file named `spotify_client_secret.key` in the `secrets` directory and paste your `Client Secret`
   - Each file should contain only the respective value, with no quotes or other characters
   - Example contents of `spotify_client_id.key`:
     ```
     1234567890abcdef1234567890abcdef
     ```
   - Example contents of `spotify_client_secret.key`:
     ```
     1234567890abcdef1234567890abcdef
     ```

#### Set API Key for Genius

1. **Register Your Application**:
   - Go to the [Genius API Page](https://genius.com/api-clients).
   - Log in or sign up for a Genius account.
   - Click on "Create an API Client" and provide the required information.

2. **Obtain Your API Key**:
   - Once your API client is created, you will receive an `Access Token`.

3. **Set the API Key in Your Application**:
   - Create a file named `genius_client_access_token.key` in the `secrets` directory in the root of the repo
   - Open the file and paste your `Access Token` value from Genius
   - The file should contain only the token value, with no quotes or other characters
   - Example contents of `genius_client_access_token.key`:
     ```
     1234567890abcdef1234567890abcdef
     ```

#### Install spotify-preview-finder

The spotify-preview-finder npm package is used to fetch preview URLs for songs from Spotify.

```sh
npm install -g spotify-preview-finder
```

#### Curate Song and Lyric Data

Run the following from the root directory of the repository:

```sh
pip install -r api/requirements.txt
// or
pip3 install -r api/requirements.txt
python api/curate_data.py
```

The script will:
1. Install the spotify-preview-finder package if it's not already installed
2. Fetch top songs from Spotify
3. Use spotify-preview-finder to get preview URLs for each song
4. Create a file named `topSongs.json` in the `data` directory
5. Obtain lyric data from Genius API
6. Create a file named `uncensoredGameData.json` in the `data` directory.

Note that the Genius API actually denies connections made from known cloud public IP addresses, so this script tends to only work when running off your local machine.

#### Filter Out Profanity

The [`Neutrino API Bad Word Filter`](https://www.neutrinoapi.com/account/tools/?api=bad-word-filter) seems to be the best API on the market for filtering out profanity. Utilizing an API helps us censor profanity without needing to store the profanity ourselves, and take advantage of the advanced detection and filtering capabilities of the API. Since censoring the lyrics is something that only needs to happen once, it isn't entirely necessary to automate.

To perform the data censoring manually, you can access the [`Neutrino API Bad Word Filter`](https://www.neutrinoapi.com/account/tools/?api=bad-word-filter) web interface. Paste in the uncensored lyric data into the content input field with the `obscene` filter on. Submit this filter request, and it will return the detected bad words. You can then use this list of detected profanity for a `Find and Replace` operation in an IDE.

In theory, instead of leveraging an API and doing the above manual process, you can prompt an AI model to do the profanity filtering for you. However, finding a model that won't give you a hard time about the profanity is a challenge.

`bannedWords.json` contains Base64 encoded data (UTF-8 input, RFC4648) of each word in our banned list. We decode this and use the data to censor the song lyrics.

#### Update CDN with New Data

Upload the `gameData.json` content to the CDN of your choice (with CORS configured as needed for your domain). Then, update the `jsonUrl` value in the `getAllSongData()` function within `game.js`.

#### Debugging & Troubleshooting

If you experience any issues with the API scripts, try updating the Python packages and rotating your API keys.

During development, you can open the web console and execute `getRandomSong()` to get a random song to test against rather than un-commenting the random button from the JavaScript code.

# Disclaimer

Lyricle uses music data, including song titles, artist names, audio snippets, and lyrics, provided by third-party sources. All copyrights in this content remain with their respective owners. Sanford Technologies LLC does not claim ownership of any third-party music content displayed or used in this application.