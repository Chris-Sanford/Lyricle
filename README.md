# Lyricle

Lyricle is a web-based lyric guessing game. Play the daily challenge and put your knowledge to the test!

## Run Lyricle Locally

Lyricle is fully HTML and JavaScript, and therefore doesn't require any special software and doesn't need to be compiled. Install the web server of your choice (Live Server extension for VSCode perhaps?), launch in a web browser, and play!

## Host Lyricle

With Lyricle being lightweight, complex server architecture is not necessary. Any modern cloud platform that supports serverless architecture for HTML/JS web applications will work! [lyricle.dev](https://lyricle.dev) is hosted fully in GitHub Pages, with the JSON data hosted in CloudFlare!

## Update Song / Lyric Data

To update the song data, you must have Python3 and API keys for Spotify and Genius.

### Install Python3

**Windows 11**
```sh
winget install Python.Python.3.12
```

**macOS**
```sh
brew install python
```

### Set API Secrets

The .key files should be created for you by default when you run the respective scripts, they just need to be populated with their respective keys. You'd obtain these keys from the API services themselves, and the keys are specific to your account.

### Obtain Top Songs from Spotify

`topSongs.py`

### Get the Lyrics from Genius

`genius.py`

Note: The last time I came back to this, I needed to update to the latest version of the lyricsgenius Python package/module and/or rotate my Genius API App Client Access Token. If you experience weird issues when trying to reach an API, make sure all your packages and libraries are up to date with the API itself and that you're not hitting authentication issues based on your tokens/keys.

### Filter Out Profanity

`badWordFilter.py`

At the time of writing this, this API is a paid service so instead I just use their portal manually to get all of the detected bad words and then do a manual find and replace for everything that's detected. We could possible replace this with a ChatGPT and OpenAI API call with a specific system prompt. I believe such instructions are also written in the comments of the Python script.

### Update CDN with New Data

We officially host our latest data with CloudFlare's CDN service. You can host your own instance of Lyricle and use the data we host, or update the `jsonUrl` value in the `getAllSongData()` function within `game.js`.
