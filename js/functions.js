// functions.js

var songData = {
  // hard code a song to guess until we can get the API working
  title: "All Together Now",
  artist: "The Beatles",
  // remember not to indent the string below
  lyrics: `One, two, three, four
Càn I have a little more?
Five, six, seven, eight, nine, ten, I love you
A, B, C, D
Can I bring my friend to tea?
E, F, G, H, I, J, I love you`,
};

// is this bad practice to make global? should it be a local variable in the startGame function?
var wordsCorrect = 0; // initialize score to 0, make variable global so it can be accessed by all functions
var lastLine = 0; // initialize lastLine to 1, make variable global so it can be accessed by all functions
// construct/declare a class called Song that will contain the original data and the properties/values that we calculate for the game
class Song {
  constructor(title, artist, lyrics) {
    this.title = title;
    this.artist = artist;
    this.lyrics = lyrics;  // raw, unformatted lyrics straight from API
    this.lines = this.lyrics.split("\n"); // split raw lyrics by \n into array of lines
    this.words = this.lyrics
      .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, ' $1 ') // add spaces around symbols excluding letters with accents
      .replace(/\n/g, ' ') // replace any instance of \n with a space
      .replace(/\s{2,}/g, ' ') // remove extra spaces
      .split(' ') // split raw lyrics by spaces into array of words, numbers, and symbols
      .filter(str => str !== ""); // removes empty strings from array, needed because index 1 seems to always be an empty string
    this.lyricsLower = this.lyrics // for comparison
      .toLowerCase() // make all letters lowercase
      .normalize("NFD") // decompose letters and diatrics
      .replace(/\p{Diacritic}/gu, ''); // replace them with non-accented characters
    this.linesLower = this.lyricsLower.split("\n");
    this.wordsLower = this.lyricsLower
    .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, ' $1 ') // add spaces around symbols excluding letters with accents
      .replace(/\n/g, ' ') // replace any instance of \n with a space
      .replace(/\s{2,}/g, ' ') // remove extra spaces
      .split(' ') // split raw lyrics by spaces into array of words, numbers, and symbols
      .filter(str => str !== ""); // removes empty strings from array, needed because index 1 seems to always be an empty string
  }
}

function getSong() {
  // Ask the user to choose a song
  // get the div element getSong from the HTML document and set it to the variable named container so we can manipulate it
  var container = document.getElementById("getSong");

  var paragraph = document.createElement("p"); // create a paragraph element within the document
  paragraph.innerHTML = "Enter the song you'd like to play:"; // populate the paragraph
  container.appendChild(paragraph); // append the paragraph to the div container (this is where it actually populates?)

  var input = document.createElement("input"); // Create an input element
  input.type = "text"; // set it as text input
  input.id = "songInput"; // give it an id name
  container.appendChild(input); // append the input text box element to the container div

  var button = document.createElement("button"); // Create a button element
  button.innerHTML = "Select Song"; // Define the text within the button to label it
  button.addEventListener("click", startGame); // Add event listener to the button so it responds to clicks and calls the startGame function (so the song can be selected and loaded in the future)
  container.appendChild(button); // append the button to the div
}

function selectNextInput(input, wordIndex) {
  // 
  var nextInputIndex = wordIndex + 1; // set the nextInputIndex to the wordIndex + 1
  var nextInput = document.getElementById("myInput" + (nextInputIndex)); // get the next sibling element (nextSiblingElement doesn't work here)
  while (nextInput && nextInput.disabled) { // loop until we find the next non-disabled sibling element
    nextInputIndex ++; // increment the nextInputIndex by 1
    nextInput = document.getElementById("myInput" + (nextInputIndex));; // get the next sibling element
  }
  if (nextInput) {
    // if there is a next input box (i.e. we're not at the end of the song)
    nextInput.focus(); // focus on the next input box
  }
}

function wordboxInputListener(input, song, wordIndex) { // Event listener function for lyric input boxes
  // Add event listener to disallow all characters but normal English letters and numbers 0-9
  input.value = input.value.replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, ""); // disallow any input that isn't a standard English letter or number
  updateColor(input, song, wordIndex); // call the updateColor function
  if (input.style.backgroundColor === "green") {
    // if the words matched, the input is correct, and the background color of the wordbox is green
    input.disabled = true; // disable the input box so it can't be changed
    wordsCorrect++; // increment the wordsCorrect score by 1

    if (wordsCorrect === song.words.length) { // if the wordsCorrect score equals the number of words in the song
      completeGame(song); // call function that executes game completion code
    }

    selectNextInput(input, wordIndex); // call function that selects the next input box
  }
}

function updateColor(input, song, wordIndex) { // Update the color of the lyric input boxes based on guess correctness
  var formattedInput = input.value // for comparison
  .toLowerCase() // make all letters lowercase
  .normalize("NFD") // decompose letters and diatrics
  .replace(/\p{Diacritic}/gu, ''); // replace them with non-accented characters
  var comparisonWord = song.wordsLower[wordIndex]; // set the comparisonWord to a variable
  var currentLine = parseInt(input.className.match(/Line(\d+)/)[1]); // extract the line number from the class name

  if (formattedInput === comparisonWord) {
    input.style.backgroundColor = "green"; // Set background color to green if input matches the corresponding word in the secret string
  } else {
    input.style.backgroundColor = "white"; // Set background color to white if input does not match the corresponding word in the secret string
  }
  
  if (currentLine === lastLine && !input.classList.contains("StartOfLine")) { // if the current line is the same as the last line and the input box is not the start of a new line
    var previousInput = input.previousElementSibling; // get the previous input box element
    while (previousInput) { // while the previous input box exists
    if (previousInput.disabled != true) { // If the previous input box exists and is not disabled, change its background color to yellow
      previousInput.style.backgroundColor = "yellow";
    }
    if(previousInput.classList.contains("StartOfLine")){ //break out of the loop if the previous input box is the start of a new line
      break;
    }
    previousInput = previousInput.previousElementSibling; // get the previous input box element again and sets it to the new previous box
  }
  }
  
  if (currentLine > lastLine) { // if the current line is greater than the last line will color all non disabled boxes to red
    currentworkingline = currentLine - 1; // set currentworkingline to the line before the current line
    while (currentworkingline >= 0) {   // while the currentworkingline is greater than or equal to 0
    var line = "Line" + currentworkingline; // set the line variable to the currentworkingline but add the string "Line" to the beginning so it matches the class
    Array.from(document.getElementsByClassName(line)).forEach(function(inputBox) { // get all the elements with the class of line and execute the following function
      if(inputBox.disabled != true) // if the input box is not disabled, change its background color to red
      { 
        inputBox.style.backgroundColor = "red";
      }
    });
    currentworkingline--; // decrement the currentworkingline by 1
  }
  }
  
  lastLine = currentLine; // set the lastLine to the currentLine so it can be used to compare for the next run of the script
}

function constructInputBoxes(song, container) {
  // Construct the input boxes for the song lyrics
  var wordIndex = 0; // initialize wordIndex to 0
  var lineIndex = 0; // Keep track of the line index
  var maxWidth = 100; // Define a maximum width for the input boxes (should 100 be the value? will any realistic word require more pixels than this?)
  var startOfNextLine = true; // Defines Start of Next Line as true so it can be used to determine if the input box is the start of a new line during the loop

  // for each line in the song, execute the following function
  song.linesLower.forEach(function (line) {
    var lineWords = line // there is probably a more efficient way to do this in the original construction of the object (dictionary/hashmap?)
      .replace(/([^a-zA-Z0-9\s])/g, ' $1 ') // add spaces around symbols
      .replace(/\n/g, ' ') // replace any instance of \n with a space
      .replace(/\s{2,}/g, ' ') // remove extra spaces
      .split(' ') // split raw lyrics by spaces into array of words, numbers, and symbols
      .filter(str => str !== ""); // removes empty strings from array, needed because index 1 seems to always be an empty string
    lineWords.forEach(function (word) {
      // executes a function against each word from lineWords array
      var input = document.createElement("input"); // creates an input element
      input.type = "text"; // makes the element a text input
      input.id = "myInput" + wordIndex; // defines the unique id of the input element based on the index of the word in the secret string
      if (startOfNextLine == true) {
        // if the input box is the start of a new line it adds the StartOfLine and Line# classes to the input element
        input.classList.add("StartOfLine", "Line" + lineIndex);
        startOfNextLine = false;
      } else {
        //else it just adds the Line# class to the input element
        input.className = "Line" + lineIndex;
      }
      var width = Math.min(10 * word.length, maxWidth); // defines variable width using the Math.min static method to set the value to either the length of the word * 10
      // or the maxWidth value, whichever is smaller. This means a word with more than 10 characters will be restricted to the maxWidth value.
      input.style.width = width + "px"; // width needs to be defined in px (pixels) so we add the px string to the end of the width value
      input.style.textAlign = "center"; // center the text within the input box
      input.addEventListener('focus', function() { // adds event listener for focus on wordbox
        updateColor(input, song, wordIndex); // calls the updateColor function on focus
      });
      input.addEventListener(
        "input",
        (function (input, wordIndex) {
          // adds event listener so any time there is input into the input box, it executes the function
          return function () {
            // calls the function defined below and returns parent function from addEventListener
            wordboxInputListener(input, song, wordIndex); // executes the wordboxInputListener function with relevant parameters/arguments
          };
        })(input, wordIndex)
      ); // ensures the correct input and wordIndex values are passed to the wordboxInputListener function ?

      // if it's the first line (which we give for free to indicate where in the song we are)
      // OR if the current word is a symbol
      if (lineIndex === 0 || /([^a-zA-Z0-9\s])/.test(song.wordsLower[wordIndex])) {
        input.value = song.words[wordIndex]; // populate the input box with the unformatted secret word at wordIndex
        input.style.backgroundColor = "green"; // set the input box background color to green
        input.disabled = true; // disable the input box
        wordsCorrect++; // increment the wordsCorrect score by 1
      }

      container.appendChild(input); // appends the input element to the container div so it's populated in the HTML document
      wordIndex++; // increments the wordIndex value by 1
    });
    startOfNextLine = true;
    lineIndex++;

    container.appendChild(document.createElement("br")); // adds a line break after each line of the song
  });
}

function constructSubmit(song) {
  var submitContainer = document.getElementById("submit"); // Get the submit container/div
  submitContainer.innerHTML = ""; // Clear the submit container/div

  submitContainer.style.textAlign = "center"; // center align the content of the container div

  // create a button labeled "Submit" to submit the guessed lyrics
  var button = document.createElement("button"); // create a button element
  button.innerHTML = "Submit"; // populate the button with the text "Submit"
  button.addEventListener("click", function () { // add event listener to the button so it responds to clicks and calls the submit function
    submit(song); // call the submit function
  });
  submitContainer.appendChild(button); // append the button to the container div
}

function startGame() { // Loads main game with song lyrics to guess
  document.getElementById("songLyrics").innerHTML = ""; // Clear the songLyrics div
  document.getElementById("resultsMessage").innerHTML = ""; // Clear the resultsMessage div
  document.getElementById("score").innerHTML = ""; // Clear the score div

  wordsCorrect = 0;

  // construct a new Song object using the songData object
  var song = new Song(songData.title, songData.artist, songData.lyrics);
  console.log(song); // log the song object to the console

  var container = document.getElementById("songLyrics"); // Get the songLyrics div

  container.style.textAlign = "center"; // center align the content of the container div

  // Create a div to hold the song title and artist
  var titleDiv = document.createElement("div"); // create a div element
  titleDiv.innerHTML = "<b>" + song.title + "</b> by " + song.artist; // populate the div with the song title and artist
  container.appendChild(titleDiv); // append the div to the container div
  // append a line break to the container div to space out the title and artist from the lyrics
  container.appendChild(document.createElement("br"));

  // construct the input boxes for the song lyrics to start the game
  constructInputBoxes(song, container);

  // add a line break to the container div to space out the lyrics from the submit button
  container.appendChild(document.createElement("br"));

  constructSubmit(song);

  container.addEventListener("keyup", function (event) {
    // adds event listener for key input on wordbox
    if (event.key === "Enter") {
      // if the key pressed is the Enter key
      submit(song); // call the submit function
    }
  });
}

function completeGame(song) {
  submitContainer = document.getElementById("submit"); // Get the submit container/div
  // add event listener to the button so it responds to clicks and calls the submit function
  var allCorrect = wordsCorrect === song.words.length
  if (allCorrect) {
    document.getElementById("resultsMessage").innerHTML = // populate the resultsMessage div with the following text
      "<b style='color:green;'>SUCCESS!</b>";
  } else {
    document.getElementById("resultsMessage").innerHTML = // populate the resultsMessage div with the following text
      "<b style='color:red;'>Better luck next time!</b>";
  }
  // Display the score
  document.getElementById("score").innerHTML = wordsCorrect + " Words Correct!"; // populate the score div with the final score

  // Clear the submit container/div
  submitContainer.innerHTML = "";

  // Remove the Restart button (for the future)
}

function submit(song) { // submit the guessed lyrics and calculate and return score
  // Replace "Submit" button with the following text:
  // "Are you sure you want to submit? [Yes] [No]"
  submitContainer = document.getElementById("submit"); // Get the submit container/div
  submitContainer.innerHTML = ""; // Clear the submit container/div
  var paragraph = document.createElement("p"); // create a paragraph element
  paragraph.innerHTML = "Are you sure you want to submit?"; // populate the paragraph
  submitContainer.appendChild(paragraph); // append the paragraph to the submit container/div
  var yesButton = document.createElement("button"); // create a button element
  yesButton.innerHTML = "Yes"; // populate the button with the text "Yes"
  yesButton.addEventListener("click", function () {
    completeGame(song)
  });

  submitContainer.appendChild(yesButton); // append the button to the submit container/div
  var noButton = document.createElement("button"); // create a button element
  noButton.innerHTML = "No"; // populate the button with the text "No"
  noButton.addEventListener("click", function () { // add event listener to the button so it responds to clicks and calls the submit function
    constructSubmit(song); // reset the submit container/div
  }
  );
  submitContainer.appendChild(noButton); // append the button to the submit container/div
}

function init() {
  // Initialize the game
  //getSong();
  startGame();
}

window.onload = init; // upon loading the page, initialize the game
