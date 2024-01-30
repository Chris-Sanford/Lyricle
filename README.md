# Lyricle

(Description based on MVP)

Lyricle is a web-based lyric guessing game. Play the daily challenge for your favorite genre or choose one of your favorite songs and put your knowledge to the test!

# Run Lyricle Locally

## Node.JS

To run the JavaScript responsible for obtaining the song data from the MusixMatch API, you must install Node.JS.
To install Node.JS on Windows, run the following command in an administrative shell (assuming Windows 11):

`winget install nodejs`

To run the JavaScript using Node.JS, open a terminal/shell and change directory to the root of the repository. Then, run the following:

`node api\chrisAPI.js`

## Main Game
Lyricle is fully HTML and JavaScript, and therefore doesn't require any special software and doesn't need to be compiled. Install the web server of your choice (Live Server extension for VSCode perhaps?), launch in a web browser, and play!

# Host Lyricle

With Lyricle being lightweight, complex server architecture is not necessary. Any modern cloud platform that supports serverless architecture for HTML/JS web applications will work!