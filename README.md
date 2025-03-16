# Lyricle

Lyricle is a lyric guessing game. Play the daily challenge at [lyricle.dev](https://lyricle.dev) and put your knowledge to the test!

# Hosting

## The Game

With Lyricle being fully client-side HTML / CSS / JavaScript, you can host it on any platform that supports static web pages.

## The Data

Lyricle relies on JSON data that contains the song title, artist, and lyrics. If you're looking to curate and host your own data, follow the instructions below.

### Hosting the Data

Lyricle pulls data from my personal CloudFlare R2 bucket by default. However, you can modify this in your instance to pull from wherever you'd like.

### Curating the Data

The .key files should be created for you by default when you run the respective scripts, they just need to be populated with their respective keys. You'd obtain these keys from the API services themselves, and the keys are specific to your account.

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
```

#### Set API Key for Spotify

#### Set API Key for Deezer

#### Set API Key for Genius

#### Get Song Data from Spotify and Deezer

#### Get Lyric Data from Genius

#### Filter Out Profanity

The [`Neutrino API Bad Word Filter`](https://www.neutrinoapi.com/account/tools/?api=bad-word-filter) seems to be the best API on the market for filtering out profanity. Utilizing an API helps us censor profanity without needing to store the profanity ourselves, and take advantage of the advanced detection and filtering capabilities of the API. Since censoring the lyrics is something that only needs to happen once, it isn't entirely necessary to automate.

To perform the data censoring manually, you can access the [`Neutrino API Bad Word Filter`](https://www.neutrinoapi.com/account/tools/?api=bad-word-filter) web interface. Paste in the uncensored lyric data into the content input field with the `obscene` filter on. Submit this filter request, and it will return the detected bad words. You can then use this list of detected profanity for a `Find and Replace` operation in an IDE.

In theory, instead of leveraging an API and doing the above manual process, you can prompt an AI model to do the profanity filtering for you. However, finding a model that won't give you a hard time about the profanity is a challenge.

#### Update CDN with New Data

Upload the `gameData.json` content to the CDN of your choice (with CORS configured as needed for your domain). Then, update the `jsonUrl` value in the `getAllSongData()` function within `game.js`.

#### Troubleshooting

If you experience any issues with the API scripts, try updating the Python packages and rotating your API keys.


