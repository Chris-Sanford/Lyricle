// game.js

//Dark Mode Implementation 
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  // Apply dark theme
  document.documentElement.setAttribute('data-bs-theme', 'dark');
  let darkmode = true;
}

// is this bad practice to make global? should it be a local variable in the startGame function?
var wordsCorrect = 0; // initialize wordsCorrect score to 0, make variable global so it can be accessed by all functions
var lastLine = 0; // initialize lastLine to 0, make variable global so it can be accessed by all functions
var lifelines = 0;
var focusedWordIndex = 0;
var inputCounter = 0;
var audio;
var terminateAudio = false;

let startTime, endTime, interval; // stopwatch variables

// construct/declare a class called Song that will contain the original data and the properties/values that we calculate for the game
class Song {
  constructor(title, artist, preview, lyrics) {
    this.title = title;
    this.artist = artist;
    this.preview = preview
    this.lyrics = lyrics;  // raw, unformatted lyrics straight from API
    this.lines = this.lyrics.split("\n"); // split raw lyrics by \n into array of lines
    this.words = this.lyrics
      .replace(/([^a-zA-Z0-9\s\u00C0-\u017F'*])/g, ' $1 ') // add spaces around symbols excluding letters with accents, apostrophes, and asterisks
      .replace(/\n/g, ' ') // replace any instance of \n with a space
      .replace(/\s{2,}/g, ' ') // remove extra spaces
      .split(' ') // split raw lyrics by spaces into array of words, numbers, and symbols
      .filter(str => str !== ""); // removes empty strings from array, needed because index 1 seems to always be an empty string
    this.lyricsLower = this.lyrics // for comparison
      .toLowerCase() // make all letters lowercase
      .normalize("NFD") // decompose letters and diatrics
      .replace(/\p{Diacritic}/gu, '') // replace them with non-accented characters
      .replace(/'/g, ''); // replace apostrophes with nothing
    this.linesLower = this.lyricsLower.split("\n");
    this.wordsLower = this.lyricsLower
    .replace(/([^a-zA-Z0-9\s\u00C0-\u017F'*])/g, ' $1 ') // add spaces around symbols excluding letters with accents, apostrophes, and asterisks
      .replace(/\n/g, ' ') // replace any instance of \n with a space
      .replace(/\s{2,}/g, ' ') // remove extra spaces
      .split(' ') // split raw lyrics by spaces into array of words, numbers, and symbols
      .filter(str => str !== ""); // removes empty strings from array, needed because index 1 seems to always be an empty string
  }
}

async function getAllSongData() {
  /* Sadly, GitHub Pages doesn't support hosting files that are not HTML, CSS, or JS, so we can't use a local JSON file
  // Either way, you're still going to need to use the await fetch method which is not instantaneous and does not load in parallel to the index page
  // Code for Obtaining SongData via Local JSON File
  try {
    const response = await fetch('../docs/gameData.json');
    allSongData = await response.json();
    console.log(allSongData);
  } catch (error) {
    console.error('Error:', error);
  }
  */

  // Code for Obtaining SongData via HTTP Request
  var jsonUrl = 'https://pub-9d70620f0c724e4595b80ff107d19f59.r2.dev/gameData.json'
  const response = await fetch(jsonUrl);
  allSongData = await response.json();
}

function startStopwatch() {
  startTime = Date.now();
  interval = setInterval(function() {
      var elapsedTime = Date.now() - startTime;
  }, 1000); // update every second
}

function stopStopwatch() {
  clearInterval(interval);
  endTime = Date.now();
}

function resetStopwatch() {
  //console.log("Resetting Stopwatch");
  clearInterval(interval);
  startTime = null;
  endTime = null;
}

// Audio Playback Functions
async function playSongPreview() {
  audio.volume = 0; // Set initial volume to 0
  audio.play();

  var fadeDuration = 5; // Duration of fade in and fade out in seconds
  while (!audio.ended && !terminateAudio) {
    // Check if audio is muted
    // if it is, restart while loop
    if (audio.muted) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100 milliseconds before checking again
      continue;
    }

    // Fade in the audio in the first 5 seconds
    var fadeInInterval = setInterval(function() {
      if (audio.currentTime < fadeDuration) {
        audio.volume = audio.currentTime / fadeDuration * 0.1;
      } else {
        clearInterval(fadeInInterval);
      }
    }, 100); // Check every 100 milliseconds

    // Fade out the audio in the last 5 seconds
    var fadeOutInterval = setInterval(function() {
      if (audio.currentTime >= audio.duration - fadeDuration) {
        audio.volume = (audio.duration - audio.currentTime) / fadeDuration * 0.1;
      } else {
        clearInterval(fadeOutInterval);
      }
    }, 100); // Check every 100 milliseconds

    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100 milliseconds before checking again
    console.log("Volume: "+ audio.volume);
  }

  terminateAudio = false; // Reset the terminateAudio variable
}

async function stopSongPreview() {
  terminateAudio = true;
  while (terminateAudio) {
    // while we wait for the async audio player/fader to terminate
    if (audio != null) { // if the audio object exists
      audio.pause();
      audio.ended = true;
    }
    else { // if the audio object doesn't exist
      terminateAudio = false; // terminate the loop and async function
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

function toggleMuteSongPreview() {
  var muteButton = document.getElementById("muteButton"); // Get the Mute button by id
  if (muteButton.innerHTML === "Mute") {
    audio.pause();
    audio.muted = true;
    muteButton.innerHTML = "Unmute"; // Flip Button back to Unmute
  } else if (muteButton.innerHTML === "Unmute") {
    if (audio.currentTime > 0) { // if the audio has already started playing after game completion
      audio.play(); // Resume playback
    }
    audio.muted = false;
    muteButton.innerHTML = "Mute"; // Flip Button back to Mute
  }
}

function useLifeline(song, button) {
  // If the stopwatch hasn't been started, start it
  if (!startTime) {
    startStopwatch();
  }

  if (lifelines > 0) {
    lifelines--;
    console.log("Lifelines Remaining: " + lifelines);

    button.innerHTML = "&hearts; (" + lifelines + " remaining)";

    var input = document.getElementById("myInput" + focusedWordIndex);
    input.value = song.words[focusedWordIndex];
    //console.log("Focused Input Value: " + input.value);
    input.style.backgroundColor = "green";
    input.disabled = true;
    wordsCorrect++;

    if (wordsCorrect === song.words.length) { // if the wordsCorrect score equals the number of words in the song
      button.remove(); // Remove the lifelines button
      completeGame(song); // call function that executes game completion code
    }
    selectNextInput(input, focusedWordIndex); // call function that selects the next input box
  }
  if(lifelines === 1) {
    button.classList.add("btn-danger");
  }

  if (lifelines === 0) {
    button.remove(); // Remove the lifelines button
    completeGame(song); // call function that executes game completion code
  }
}

function constructLifelineButton(song) {
  var lifelineContainer = document.getElementById("lifeline"); // get the div element from the HTML document and set it to the variable named container so we can manipulate it
  lifelineContainer.style.textAlign = "center"; // center align the content of the container div
  var button = document.createElement("button"); // create a button element
  button.classList.add("btn", "btn-primary"); // add the btn and btn-primary classes to the button
  button.innerHTML = "&hearts; (" + lifelines + " remaining)"; // Define the text within the button to label it

  // Add event listener to the button so it responds to clicks and calls the useLifeline function
  button.addEventListener('click', function() {
    useLifeline(song, button);
  });

  lifelineContainer.appendChild(button); // append the button to the div

}

function constructRandomButton() {
  // Populate a button in the HTML document labeled "Random" that will call the startGame function with a random song
  var container = document.getElementById("random"); // get the div element from the HTML document and set it to the variable named container so we can manipulate it
  container.style.textAlign = "center"; // center align the content of the container div
  var button = document.createElement("button"); // create a button element
  button.classList.add("btn", "btn-info"); // add the btn and btn-primary classes to the button
  button.innerHTML = "Random"; // Define the text within the button to label it
  button.addEventListener("click", getRandomSong); // Add event listener to the button so it responds to clicks and calls the getRandomSong function
  container.appendChild(button); // append the button to the div
}

function constructGameCompleteButton() {
  var container = document.getElementById("gameCompleteButton"); // get the div element from the HTML document and set it to the variable named container so we can manipulate it
  container.style.textAlign = "center"; // center align the content of the container div
  var button = document.createElement("button"); // create a button element
  button.classList.add("btn", "btn-info"); // add the btn and btn-primary classes to the button
  button.innerHTML = "My Stats"; // Define the text within the button to label it
  button.addEventListener("click", displayGameCompleteModal); // Add event listener to the button so it responds to clicks and calls the getRandomSong function
  container.appendChild(button); // append the button to the div
}

function getRandomSong() {
  // Select a random song from the song data and start the game
  var seed = Math.floor(Math.random() * allSongData.length)
  //console.log(seed)
  var songData = allSongData[seed];

  // Stop any currently-playing audio
  if (audio.currentTime > 0) {
    stopSongPreview();
  }

  startGame(songData);
}

function getDayInt() { // Get the integer value (1-365) of the day of the year
  var now = new Date(); // create a new Date object
  var start = new Date(now.getFullYear(), 0, 0); // create a new Date object for the start of the year
  var diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000; // calculate the difference between the two dates
  var oneDay = 1000 * 60 * 60 * 24; // calculate the number of milliseconds in a day
  var day = Math.floor(diff / oneDay); // calculate the day of the year
  return day
}

function selectSong() {
  // Ask the user to choose a song
  // get the div element selectSong from the HTML document and set it to the variable named container so we can manipulate it
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
  button.addEventListener("click", startGame(songData)); // Add event listener to the button so it responds to clicks and calls the startGame function (so the song can be selected and loaded in the future)
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

  // If the stopwatch hasn't been started, start it
  if (!startTime) {
    startStopwatch();
  }

  // Increment the input counter
  inputCounter++;

  // Add event listener to disallow all characters but normal English letters, numbers 0-9, and apostrophes (')
  input.value = input.value.replace(/([^a-zA-Z0-9\u00C0-\u017F'])/g, ""); // disallow any input that isn't a standard English letter, number, or apostrophe
  updateColor(input, song, wordIndex); // call the updateColor function
  if (input.style.backgroundColor === "green") {
    // if the words matched, the input is correct, and the background color of the wordbox is green
    input.value = song.words[wordIndex]; // populate the input box with the unformatted secret word at wordIndex
    input.disabled = true; // disable the input box so it can't be changed
    wordsCorrect++; // increment the wordsCorrect score by 1

    if (wordsCorrect === song.words.length) { // if the wordsCorrect score equals the number of words in the song
      completeGame(song); // call function that executes game completion code
    }

    selectNextInput(input, wordIndex); // call function that selects the next input box
  }
}

function wordboxFocusListener (input, song, wordIndex) {
  updateColor(input, song, wordIndex); // calls the updateColor function on focus

  // Get the current word index from the input box
  var wordIndex = parseInt(input.id.match(/\d+/)[0]);
  //console.log("Word Index: " + wordIndex);
  focusedWordIndex = wordIndex;
  //console.log("Focused Word Index: " + focusedWordIndex);
}

function updateColor(input, song, wordIndex) { // Update the color of the lyric input boxes based on guess correctness
  var formattedInput = input.value // for comparison
  .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "") // disallow any input that isn't a standard English letter or number
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
      .replace(/([^a-zA-Z0-9\s*])/g, ' $1 ') // add spaces around symbols except asterisks
      .replace(/\n/g, ' ') // replace any instance of \n with a space
      .replace(/\s{2,}/g, ' ') // remove extra spaces
      .split(' ') // split raw lyrics by spaces into array of words, numbers, and symbols
      .filter(str => str !== ""); // removes empty strings from array, needed because index 1 seems to always be an empty string
    lineWords.forEach(function (word) {
      // executes a function against each word from lineWords array
      var input = document.createElement("input"); // creates an input element
      input.type = "text"; // makes the element a text input
      input.style.color = "black"; // This will change the typed text color to black
      input.id = "myInput" + wordIndex; // defines the unique id of the input element based on the index of the word in the secret string
      if (startOfNextLine == true) {
        // if the input box is the start of a new line it adds the StartOfLine and Line# classes to the input element
        input.classList.add("StartOfLine", "Line" + lineIndex);
        startOfNextLine = false;
      } else {
        //else it just adds the Line# class to the input element
        input.className = "Line" + lineIndex;
      }
      var width = Math.min(((12 * word.length) + 10), maxWidth); // defines variable width using the Math.min static method to set the value to either the length of the word * 10
      // or the maxWidth value, whichever is smaller. This means a word with more than 10 characters will be restricted to the maxWidth value.
      input.style.width = width + "px"; // width needs to be defined in px (pixels) so we add the px string to the end of the width value
      input.style.textAlign = "center"; // center the text within the input box
      input.addEventListener('focus', function() { // adds event listener for focus on wordbox
        wordboxFocusListener(input, song, wordIndex); // calls the wordboxFocusListener function on focus
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

function startGame(songData) { // Loads main game with song lyrics to guess
  // Clear/Reset Divs from Previous Song
  document.getElementById("songLyrics").innerHTML = "";
  document.getElementById("lifeline").innerHTML = "";
  document.getElementById("gameCompleteButton").innerHTML = "";

  wordsCorrect = 0;
  inputCounter = 0;
  lifelines = 3;
  //console.log("Starting Lifelines: " + lifelines);

  // construct a new Song object using the songData object
  var song = new Song(songData.title, songData.artist, songData.preview_url, songData.chorus);
  console.log(song); // log the song object to the console

  var container = document.getElementById("songLyrics"); // Get the songLyrics div

  container.style.textAlign = "center"; // center align the content of the container div

  // Create a div to hold the song title and artist
  var titleDiv = document.createElement("div"); // create a div element
  titleDiv.innerHTML = "<b>" + song.title + "</b> by " + song.artist; // populate the div with the song title and artist
  container.appendChild(titleDiv); // append the div to the container div
  // append a line break to the container div to space out the title and artist from the lyrics
  container.appendChild(document.createElement("br"));

  // Populate the How To Play text with the song title and artist
  var howToPlayObjectiveText = document.getElementById("objectiveText");
  howToPlayObjectiveText.innerHTML = "Guess the hidden lyrics to today's song, <b>" + song.title + "</b> by <b>" + song.artist + "</b>!";

  // construct the input boxes for the song lyrics to start the game
  constructInputBoxes(song, container);

  // add a line break to the container div to space out the lyrics from the buttons
  container.appendChild(document.createElement("br"));

  constructLifelineButton(song);

  //calculateProperties(song)

  resetStopwatch();
  
  // Create an audio element to play the song preview
  audio = new Audio(song.preview);
}

function completeGame(song) {
  stopStopwatch();

  // Clear the lifeline div
  var lifelineContainer = document.getElementById("lifeline");
  while (lifelineContainer.firstChild) {
    lifelineContainer.removeChild(lifelineContainer.firstChild);
  }
  
  calculateStats(song);
  playSongPreview();

  var allCorrect = wordsCorrect === song.words.length
  if (allCorrect) {
    // Do Nothing
  } else {
    // populate every incorrect input box with the correct word and shade it yellow
    for (var i = 0; i < song.words.length; i++) {
      var input = document.getElementById("myInput" + i); // get the input box element by id
      if (input.style.backgroundColor !== "green") { // if the input box background color is not green
        input.value = song.words[i]; // populate the input box with the correct word
        input.style.backgroundColor = "yellow"; // set the input box background color to yellow
      }
    }
  }

  constructGameCompleteModal(song)
}

function calculateProperties(song) { // For Debugging: Calculate properties of song lyrics
  // Output number of lines in song
  console.log("LinesCount: " + song.lines.length);

  // Output number of words in song excluding symbols
  const wordsWithoutSymbols = song.words.filter(word => /^[a-zA-Z]+$/.test(word));
  console.log("WordsCount: " + wordsWithoutSymbols.length);

  // Calculate and Output number of unique words in song
  const uniqueWords = new Set(song.lyrics.split(" "));
  console.log("UniqueWordsCount: " + uniqueWords.size);
  
  // Calculate number of censored words (indicated by sequence of *'s)
  const censoredWords = song.lyrics.match(/\*+/g);

  // if there are censored words in the lyrics, output the number of censored words
  // else, output 0
  if (censoredWords != null) {
    console.log("CensoredWordsCount: " + censoredWords.length);
  }
  else {
    console.log("CensoredWordsCount: 0");
  }
}

function calculateStats(song) {
  // Percentage of lyrics correct without decimals
  let percentageCorrect = Math.floor((wordsCorrect / song.words.length) * 100);
  console.log("Percentage Correct: " + percentageCorrect + "%");

  // Lifelines Remaining
  console.log("Final Lifelines Remaining: " + lifelines);

  // Time to Completion
  let totalTime = endTime - startTime; // Time in milliseconds
  let totalSeconds = totalTime / 1000; // Convert to seconds
  let minutes = Math.floor(totalSeconds / 60); // Get minutes
  let seconds = Math.floor(totalSeconds % 60); // Get remaining seconds

  console.log("Total Time to Completion: " + minutes + " minutes and " + seconds + " seconds");

  // Number of total inputs
  console.log("Total Inputs: " + inputCounter);
}

function constructGameCompleteModal(song) {

  constructGameCompleteButton();

  // Check if modal already exists
  var existingModal = document.getElementById("gameCompleteModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create the modal element
  var modal = document.createElement("div");
  modal.classList.add("modal", "fade");
  modal.id = "gameCompleteModal";
  modal.tabIndex = "-1";
  modal.setAttribute("aria-labelledby", "gameCompleteModalLabel");
  modal.setAttribute("aria-hidden", "true");

  // Create the modal dialog
  var modalDialog = document.createElement("div");
  modalDialog.classList.add("modal-dialog");
  modal.appendChild(modalDialog);

  // Create the modal content
  var modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");
  modalDialog.appendChild(modalContent);

  // Create the modal header
  var modalHeader = document.createElement("div");
  modalHeader.classList.add("modal-header");
  modalContent.appendChild(modalHeader);

  // Create the modal title
  var modalTitle = document.createElement("h1");
  modalTitle.classList.add("modal-title", "fs-5");
  modalTitle.id = "gameCompleteModalLabel";
  modalTitle.innerText = "Game Complete";
  modalHeader.appendChild(modalTitle);

  // Create the close button
  var closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.classList.add("btn-close");
  closeButton.setAttribute("data-bs-dismiss", "modal");
  closeButton.setAttribute("aria-label", "Close");
  modalHeader.appendChild(closeButton);

  // Create the modal body
  var modalBody = document.createElement("div");
  modalBody.classList.add("modal-body");
  modalContent.appendChild(modalBody);

  // Create the modal body content
  var modalBodyContent = document.createElement("table");
  modalBodyContent.classList.add("table", "table-borderless"); // Add the "table-borderless" class to remove table row outlines

  // Create the table body
  var tableBody = document.createElement("tbody");

  // Create the body header
  var bodyHeaderRow = document.createElement("tr");
  var bodyHeaderCell = document.createElement("td");
  bodyHeaderCell.setAttribute("colspan", "2");
  bodyHeaderCell.innerHTML = '<span class="fs-4 fw-bold">How\'d you do?</span>';
  bodyHeaderRow.appendChild(bodyHeaderCell);
  tableBody.appendChild(bodyHeaderRow);

  // Create the rows and cells for each statistic
  var percentageCorrectRow = document.createElement("tr");
  var percentageCorrectCell1 = document.createElement("td");
  percentageCorrectCell1.innerText = "Percentage Correct";
  var percentageCorrectCell2 = document.createElement("td");
  percentageCorrectCell2.innerText = `${wordsCorrect} of ${song.words.length} (${Math.floor((wordsCorrect / song.words.length) * 100)}%)`;
  percentageCorrectRow.appendChild(percentageCorrectCell1);
  percentageCorrectRow.appendChild(percentageCorrectCell2);
  tableBody.appendChild(percentageCorrectRow);

  var lifelinesRemainingRow = document.createElement("tr");
  var lifelinesRemainingCell1 = document.createElement("td");
  lifelinesRemainingCell1.innerText = "Lifelines Remaining";
  var lifelinesRemainingCell2 = document.createElement("td");
  lifelinesRemainingCell2.innerText = lifelines + " of 3";
  lifelinesRemainingRow.appendChild(lifelinesRemainingCell1);
  lifelinesRemainingRow.appendChild(lifelinesRemainingCell2);
  tableBody.appendChild(lifelinesRemainingRow);

  var totalTimeRow = document.createElement("tr");
  var totalTimeCell1 = document.createElement("td");
  totalTimeCell1.innerText = "Time to Completion";
  var totalTimeCell2 = document.createElement("td");
  var totalTime = endTime - startTime;
  var totalSeconds = totalTime / 1000;
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = Math.floor(totalSeconds % 60);
  totalTimeCell2.innerText = minutes + " minutes and " + seconds + " seconds";
  totalTimeRow.appendChild(totalTimeCell1);
  totalTimeRow.appendChild(totalTimeCell2);
  tableBody.appendChild(totalTimeRow);

  var totalInputsRow = document.createElement("tr");
  var totalInputsCell1 = document.createElement("td");
  totalInputsCell1.innerText = "Total Inputs";
  var totalInputsCell2 = document.createElement("td");
  totalInputsCell2.innerText = inputCounter;
  totalInputsRow.appendChild(totalInputsCell1);
  totalInputsRow.appendChild(totalInputsCell2);
  tableBody.appendChild(totalInputsRow);

  modalBodyContent.appendChild(tableBody);
  modalBody.appendChild(modalBodyContent);

  // Create the modal footer
  var modalFooter = document.createElement("div");
  modalFooter.classList.add("modal-footer");
  modalContent.appendChild(modalFooter);

  // Append the modal to the document body
  document.body.appendChild(modal);

  // Add text after the table
  var thanksText = document.createElement("p");
  thanksText.innerText = "Thanks for playing!";
  thanksText.style.textAlign = "center"; // Center the text
  modalBody.appendChild(thanksText);

  // Display the modal
  var modalElement = document.getElementById("gameCompleteModal");
  var modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

function displayGameCompleteModal() {
  var modalElement = document.getElementById("gameCompleteModal");
  var modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

function init() { // Initialize the game
  constructRandomButton();
  day = getDayInt(); // Get the integer value of the day of the year

  getAllSongData().then(() => {
    //console.log(allSongData)
    //console.log(day);
    songData = allSongData[day]; // Get the song data for the day
    // if songData is null (because today's int is higher than the length of allSongData), select an object at a random integer index from allSongData
    if (songData == null) {
      songData = allSongData[Math.floor(Math.random() * allSongData.length)];
    }
    startGame(songData);
});
}
window.onload = init; // upon loading the page, initialize the game