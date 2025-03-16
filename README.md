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

#### Obtain Top Songs from Spotify

UPDATE: We need to update this because Spotify has deprecated the preview_url property in their API.

`topSongs.py`

#### Get the Lyrics from Genius

`genius.py`

Note: The last time I came back to this, I needed to update to the latest version of the lyricsgenius Python package/module and/or rotate my Genius API App Client Access Token. If you experience weird issues when trying to reach an API, make sure all your packages and libraries are up to date with the API itself and that you're not hitting authentication issues based on your tokens/keys.

#### Filter Out Profanity

`badWordFilter.py`

At the time of writing this, this API is a paid service so instead I just use their portal manually to get all of the detected bad words and then do a manual find and replace for everything that's detected. We could possible replace this with a ChatGPT and OpenAI API call with a specific system prompt. I believe such instructions are also written in the comments of the Python script.

What I ended up doing for now since we don't have a paid API account for this service 
is I went to the web GUI to test the API:

[https://www.neutrinoapi.com/account/tools/?api=bad-word-filter](https://www.neutrinoapi.com/account/tools/?api=bad-word-filter)

And pasted the JSON of the song lyrics which gave me the list of the bad words in the lyrics.
Then I just found and replaced the content in the JSON manually.
This is okay for now since we're doing the songs in batches. Use `obscene` and not `strict` because `strict` censors really mild things like `kill`.

Also as a side note, I think what happens with the BWF API is if you send it too much content
it won't give you a complete repeat of the censored content so we might
have to just receive the bad words in response and then do the censoring ourselves.
Also it doesn't seem to properly interpret the \\n in the JSON so we might have to do that ourselves as well.

Unfortunately, it seems like ChatGPT doesn't want or like to work with profanity in this way so it makes it really challenging to automate otherwise.

#### Update CDN with New Data

We officially host our latest data with CloudFlare's CDN service. You can host your own instance of Lyricle and use the data we host, or update the `jsonUrl` value in the `getAllSongData()` function within `game.js`.
