# Lyricle

Lyricle is a web-based lyric guessing game. Play the daily challenge and put your knowledge to the test!

# Run Lyricle Locally

## Python (Backend)

To run the Python script responsible for obtaining the song data from the source API, you must install Python3.
To install Python3 on Windows, run the following command in an administrative shell (assuming Windows 11):

`winget install Python.Python.3.12`

To run the Python backend, open a terminal/shell and change directory to the root of the repository. Then, run the following:

`py api\genius.py`

## Main Game (Frontend)
Lyricle is fully HTML and JavaScript, and therefore doesn't require any special software and doesn't need to be compiled. Install the web server of your choice (Live Server extension for VSCode perhaps?), launch in a web browser, and play!

# Host Lyricle

With Lyricle being lightweight, complex server architecture is not necessary. Any modern cloud platform that supports serverless architecture for HTML/JS web applications will work! [lyricle.dev](https://lyricle.dev) is hosted fully in GitHub Pages!