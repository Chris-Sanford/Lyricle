# Lyricle

Lyricle is a web-based lyric guessing game. Play the daily challenge and put your knowledge to the test!

# Run Lyricle Locally

## Python (Backend)

To run the Python script responsible for obtaining the song data from the source API, you must install Python3.
To install Python3 on Windows, run the following command in an administrative shell (assuming Windows 11):

`winget install Python.Python.3.12`

To run the Python backend, open a terminal/shell and change directory to the root of the repository. Then, run the following:

`py api\genius.py`

## Webpack\bootstrap (Backend)

To implement bootstrap you need to make sure you have Node.js installed:

`winget install -e --id OpenJS.NodeJS`

Then initialize your node in the root folder of the repository (should be in source files already)

`npm init -y`

Next, you have to install webpack and the webpack server in the root of the repository (should be in source files already):

`npm i --save-dev webpack webpack-cli webpack-dev-server`

Then install bootstrap and some dependencies through Node.js in the root of the repository (should be in source files already):

`npm i --save bootstrap @popperjs/core`
`npm i --save-dev autoprefixer css-loader postcss-loader sass sass-loader style-loader`

In the "package.json" you should see a script created called "start-serv" this will start the dev server utilizing webpack. Run the script in a terminal session in the root of the repository

`npm run start-serv`

With the server running, it should automatically pick up changes in the source js file and repackage them on the fly without having to rebuild the bundled js file.

The server should be available at localhost http://localhost:8080/


## Main Game (Frontend)
Lyricle is fully HTML and JavaScript, and therefore doesn't require any special software and doesn't need to be compiled. Install the web server of your choice (Live Server extension for VSCode perhaps?), launch in a web browser, and play!

# Host Lyricle

With Lyricle being lightweight, complex server architecture is not necessary. Any modern cloud platform that supports serverless architecture for HTML/JS web applications will work! [lyricle.dev](https://lyricle.dev) is hosted fully in GitHub Pages!