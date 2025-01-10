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

### Obtain Top Songs from Spotify

### Get the Lyrics from Genius

### Filter Out Profanity

### Update CDN with New Data

### (If Applicable) Update Javascript with Data Location

Update the `jsonUrl` value in the `getAllSongData()` function within `game.js`.