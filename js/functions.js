// functions.js

var songData = {
  // hard code a song to guess until we can get the API working
  title: "All Together Now",
  artist: "The Beatles",
  lyrics: `One, two, three, four
Can I have a little more?
Five, six, seven, eight, nine, ten, I love you`,
};

// is this bad practice to make global? should it be a local variable in the startGame function?
var wordsCorrect = 0; // initialize score to 0, make variable global so it can be accessed by all functions
var lastLine = 0; // initialize lastLine to 1, make variable global so it can be accessed by all functions
// construct/declare a class called Song that will contain the original data and the properties/values that we calculate for the game
class Song {
  constructor(title, artist, lyrics) {
    this.title = title;
    this.artist = artist;
    this.lyrics = lyrics;
    this.lines = lyrics.split("\n"); // Split the secret string into lines separated by new lines
    this.words = lyrics
      .replace(/[^a-zA-Z0-9\n\s]/g, "")
      .toLowerCase()
      .split(/\s+/); // Remove all special characters except \n and make all lowercase
    this.formattedLyrics = this.words.join(" "); // Join the words back into a string with spaces
    this.formattedLines = lyrics
      .replace(/[^a-zA-Z0-9\n\s]/g, "")
      .toLowerCase()
      .split("\n");
    this.formattedWords = lyrics
      .replace(/[^a-zA-Z0-9\n\s]/g, "")
      .toLowerCase()
      .split(/\s+/);
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

function wordboxInputListener(input, song, wordIndex) {
  // Event listener function for lyric input boxes
  updateColor(input, song, wordIndex); // call the updateColor function
  if (input.style.backgroundColor === "green") {
    // if the words matched, the input is correct, and the background color of the wordbox is green
    input.disabled = true; // disable the input box so it can't be changed
    wordsCorrect++; // increment the wordsCorrect score by 1
    if (wordsCorrect === song.words.length) {
      // if the wordsCorrect score equals the number of words in the song
      submit(song); // call the submit function (to end the game
    }
    var nextInput = document.getElementById("myInput" + (wordIndex + 1)); // get next input box element by ID using current index + 1
    if (nextInput) {
      // if there is a next input box (i.e. we're not at the end of the song)
      nextInput.focus(); // focus on the next input box
    }
  }
}

function updateColor(input, song, wordIndex) { // Update the color of the lyric input boxes based on guess correctness
  var formattedInput = input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase(); // from input, remove all punctuation and make all lowercase
  var comparisonWord = song.formattedWords[wordIndex]; // set the comparisonWord to a variable
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
  song.formattedLines.forEach(function (line) {
    // executes a function against each line from the formattedLines array
    var lineWords = line.split(/\s+/); // Split the line into words separated by spaces
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

      container.appendChild(input); // appends the input element to the container div so it's populated in the HTML document
      wordIndex++; // increments the wordIndex value by 1
    });
    startOfNextLine = true;
    lineIndex++;

    container.appendChild(document.createElement("br")); // adds a line break after each line of the song
  });
}

function startGame() {
  // Loads main game with song lyrics to guess
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

  // create a button labeled "Submit" to submit the guessed lyrics
  var button = document.createElement("button"); // create a button element
  button.innerHTML = "Submit"; // populate the button with the text "Submit"
  button.addEventListener("click", function () {
    // add event listener to the button so it responds to clicks and calls the submit function
    submit(song); // call the submit function
  });
  container.appendChild(button); // append the button to the container div

  container.addEventListener("keyup", function (event) {
    // adds event listener for key input on wordbox
    if (event.key === "Enter") {
      // if the key pressed is the Enter key
      submit(song); // call the submit function
    }
  });
}

function submit(song) {
  // submit the guessed lyrics and calculate and return score
  // Some of this code is currently redundant but may prove useful in the future
  var inputs = Array.from(
    // set inputs variable to an array of all the input elements to get the full answer
    document.getElementById("songLyrics").children // get the children of the songLyrics div
  ).filter(function (child) {
    return child.tagName === "INPUT"; // Filter out the 'br' elements to only get the input elements
  });

  var formattedInputs = inputs.map(function (input) {
    // map method creates a new array with the results of the nested function for every element in the input array
    return input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase(); // returns the resultant parsed input value to populate the formattedInputs array (no special characters, all lowercase)
  });

  var comparisonWords = song.formattedWords;

  // Verify that all text boxes are filled
  var allFilled = formattedInputs.every(function (input) {
    return input !== ""; // Check if all text boxes are filled
  });

  if (allFilled) {
    // in the future, allow user to submit partially completed lyrics
    var allCorrect = wordsCorrect === song.words.length;
    if (allCorrect) {
      document.getElementById("resultsMessage").innerHTML = // populate the resultsMessage div with the following text
        "<b style='color:green;'>SUCCESS!</b>";
    } else {
      document.getElementById("resultsMessage").innerHTML = // populate the resultsMessage div with the following text
        "<b style='color:red;'>Better luck next time!</b>";
    }
  } else {
    // if not, update box coloring and tell user to fill out all boxes
    inputs.forEach(function (input, index) {
      // execute the following function against each input box
      if (input.value === "") {
        input.style.backgroundColor = "red"; // Highlight the input field in red if it's blank
      } else {
        input.style.backgroundColor = ""; // Reset the background color if it's not blank
      }
    });
    document.getElementById("resultsMessage").innerHTML = // populate resultsMessage to urge player to finish the rest of the game
      "Please fill out the blank text boxes.";
  }

  // Display the score
  document.getElementById("score").innerHTML = wordsCorrect + " Words Correct!"; // populate the score div with the final score
}

function init() {
  // Initialize the game
  //getSong();
  startGame();
}

window.onload = init; // upon loading the page, initialize the game
