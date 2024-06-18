// game.js

// Global Variables
var wordsCorrect = 0; // initialize wordsCorrect score to 0, make variable global so it can be accessed by all functions
var wordsToGuess = 0; // total number of words to have to guess correctly, used to determine if game is complete
var lastLine = 0; // initialize lastLine to 0, make variable global so it can be accessed by all functions
var lifelines = 0;
var focusedBoxIndex = 0;
var inputCounter = 0;
var audio;
var terminateAudio = false;

// ... What does 'let' do differently from 'var' again?
let startTime, endTime, interval; // stopwatch variables

// Class Constructors
// Construct the Lyric class
class Lyric {
  constructor(boxIndex, lineIndex, content, contentComparable, toGuess) {
    this.boxIndex = boxIndex;
    this.lineIndex = lineIndex;
    this.content = content;
    this.contentComparable = contentComparable;
    this.toGuess = toGuess;
  }
}

// Construct the Song class
class Song {
  constructor(title, artist, preview, lyrics) {
    this.title = title;
    this.artist = artist;
    this.preview = preview;
    this.lyrics = lyrics;
  }
}

// Object and Element Constructors

// Define the function that creates Lyric objects from the chorus
function constructLyricObjects(chorus) {
  // Split the chorus into lines (split by newline)
  var lines = chorus.split("\n");

  // Process the lyric lines to be Lyricle-friendly (not too long)
  lines = splitLengthyLyricLines(lines);
  
  // Initialize an empty array to store the lyric objects
  var lyrics = [];

  // Set boxIndex to 0
  var boxIndex = 0;
  // Set lineIndex to 0
  var lineIndex = 0;
  
  var maxLines = 7; // Maximum number of lines to display in the game
  // If the total number of lines is less than 7, set maxLines to the total number of lines
  if (lines.length < maxLines) {
    var maxLines = lines.length;
  }

  // For each line in the chorus
  for (var i = 0; i < maxLines; i++) {
    // Split the line into words
    var words = lines[i]
      .replace(/([^a-zA-Z0-9\s\u00C0-\u017F'*])/g, ' $1 ') // add spaces around symbols excluding letters with accents, apostrophes, and asterisks
      .replace(/\s{2,}/g, ' ') // remove extra spaces
      .split(' ') // split raw lyrics by spaces into array of words, numbers, and symbols
      .filter(str => str !== ""); // removes empty strings from array, needed because index 1 seems to always be an empty string

    // For each word in the line
    for (var j = 0; j < words.length; j++) {
      // Run RegExes against the word to make it comparable
      var word = words[j]
      .toLowerCase() // make all letters lowercase
      .normalize("NFD") // decompose letters and diatrics
      .replace(/\p{Diacritic}/gu, '') // replace them with non-accented characters
      .replace(/'/g, ''); // replace apostrophes with nothing

      // If 'word' (contentComparable) is anything other than standard english letters, set toGuess to false
      // else, set toGuess to true
      var toGuess = /^[a-zA-Z]+$/.test(word) ? true : false;

      // if lineIndex is 0, set toGuess to false
      if (lineIndex === 0) {
        toGuess = false;
      }

      // Construct a Lyric object with the boxIndex, lineIndex, content, and contentComparable
      var lyric = new Lyric(boxIndex, lineIndex, words[j], word, toGuess);

      // Add the Lyric object to the lyrics array
      lyrics.push(lyric);
      
      // Increment the boxIndex
      boxIndex++;
    }

    // Increment the lineIndex
    lineIndex++;
  }

  // Return the array of lyric objects
  return lyrics;
}

// Define the function that creates a Song object from the title, artist, preview, and lyric objects
function constructSongObject(title, artist, preview, chorus) {
  // Construct the lyric objects
  var lyrics = constructLyricObjects(chorus);

  // Construct the Song object
  var song = new Song(title, artist, preview, lyrics);

  // Return the Song object
  return song;
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
  var button = document.getElementById("statsButton");
  var icon = document.createElement("i");
  icon.classList.add("fa-solid", "fa-chart-column");
  button.appendChild(icon);
  button.addEventListener("click", displayGameCompleteModal);
}

function constructLyricInputBoxes(song, lyricsGridContainer) {
  // Set lineIndex to 0
  var lineIndex = 0;

  // Get all lyric objects from lineIndex 0
  var lyricsToDisplay = song.lyrics.filter(lyric => lyric.lineIndex === lineIndex);

  // while there are still lyrics to display
  while (lyricsToDisplay != null && lyricsToDisplay.length > 0) {
    // Create a row within the lyrics container
    var row = document.createElement("div");
    row.classList.add("row");
    row.classList.add("lyricle-lyrics-row");
    lyricsGridContainer.appendChild(row);

    // Create a column within the row to store all lyrics
    var col = document.createElement("div");
    col.classList.add("col");
    col.classList.add("lyricle-lyrics-col");
    row.appendChild(col);

    // For each lyric object in the lyricsToDisplay array
    for (var i = 0; i < lyricsToDisplay.length; i++) {
      // Create an input box within the column
      var input = document.createElement("input");
      input.type = "text";
      input.id = "lyricInput" + lyricsToDisplay[i].boxIndex;
      input.classList.add("lyricle-lyrics-input");
      input.style.width = (10 + (lyricsToDisplay[i].content.length * 10)) + "px";

      // Add input listener to the input box
      input.addEventListener("input", function() {
        lyricBoxInputListener(song);
      });

      // Add focus listener to the input box
      input.addEventListener("focus", function() {
        lyricBoxFocusListener(input);
      });

      // If the word is not to be guessed, populate the input box with the word and disable it
      if (!lyricsToDisplay[i].toGuess) {
        input.value = lyricsToDisplay[i].content;
        input.disabled = true;
      }

      // Add the input box to the column
      col.appendChild(input);
    }

    // Increment lineIndex by 1
    lineIndex++;

    // Get all lyric objects from the next lineIndex
    var lyricsToDisplay = song.lyrics.filter(lyric => lyric.lineIndex === lineIndex);
  }
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
  percentageCorrectCell2.innerText = `${wordsCorrect} of ${song.lyrics.length} (${Math.floor((wordsCorrect / song.lyrics.length) * 100)}%)`;
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

// Button Functions
function toggleMuteSongPreview() {
  var muteButton = document.getElementById("muteButtonIcon"); // Get the Mute button by id
  if (muteButton.className === "fas fa-volume-up") { // If the button currently shows that volume is on
    audio.pause();
    audio.muted = true;
    muteButton.className = "fa-solid fa-volume-xmark"; // change icon to show that volume is off
  } else if (muteButton.className === "fa-solid fa-volume-xmark") { // if the icon indicates audio is muted
    if (audio.currentTime > 0) { // if the audio has already started playing after game completion
      audio.play(); // Resume playback
    }
    audio.muted = false;
    muteButton.className = "fas fa-volume-up"; // change icon back to show that volume is on
  }
}

function useLifeline(song, button) {

  // if the current focusedBoxIndex is already marked as green (correct) or is disabled, return/end the function
  if (document.getElementById("lyricInput" + focusedBoxIndex).style.backgroundColor === "green" || document.getElementById("lyricInput" + focusedBoxIndex).disabled) {
    console.log("You need to select a lyric input field to use your lifeline on before clicking the lifeline button!");
    return;
  }

  // If the stopwatch hasn't been started, start it
  if (!startTime) {
    startStopwatch();
  }

  if (lifelines > 0) {
    lifelines--;

    button.innerHTML = "&hearts; (" + lifelines + " remaining)";

    var input = document.getElementById("lyricInput" + focusedBoxIndex);
    input.value = song.lyrics[focusedBoxIndex].content;
    input.style.backgroundColor = "green";
    input.disabled = true;
    wordsCorrect++;

    if (wordsCorrect === wordsToGuess) {
      button.remove(); // Remove the lifelines button
      completeGame(song); // call function that executes game completion code
    }
    selectNextInput(input, focusedBoxIndex); // call function that selects the next input box
  }
  if(lifelines === 1) {
    button.classList.add("btn-danger");
  }

  if (lifelines === 0) {
    button.remove(); // Remove the lifelines button
    completeGame(song); // call function that executes game completion code
  }
}

function getRandomSong() {
  // Select a random song from the song data and start the game
  var seed = Math.floor(Math.random() * allSongData.length)
  var songData = allSongData[seed];

  // Stop any currently-playing audio
  if (audio.currentTime > 0) {
    stopSongPreview();
  }

  startGame(songData);
}

// Listeners
function lyricBoxInputListener(song) { // Event listener function for lyric input boxes

  // If the stopwatch hasn't been started, start it
  if (!startTime) {
    startStopwatch();
  }

  // Increment the input counter
  inputCounter++;

  // Get lyricBox element using activeElement
  var lyricBox = document.activeElement;

  // If the input value is greater than the length of the secret word, don't allow any more characters
  checkCorrectness(lyricBox, song)
}

function lyricBoxFocusListener (input) {
  focusedBoxIndex = parseInt(document.activeElement.id.replace("lyricInput", ""));
}

// Supporting Functions
function startGame(songData) { // Loads main game with song lyrics to guess
  var lyricsGridContainer = document.getElementById("lyricsGrid"); // Get the lyricsGrid div

  // Clear/Reset Divs from Previous Song
  lyricsGridContainer.innerHTML = "";
  document.getElementById("songTitle").innerHTML = "";
  document.getElementById("lifeline").innerHTML = "";
  document.getElementById("gameCompleteButton").innerHTML = "";
  document.getElementById("statsButton").innerHTML = "";

  wordsCorrect = 0;
  wordsToGuess = 0;
  inputCounter = 0;
  lifelines = 3;

  // construct a new Song object using the songData object
  var song = constructSongObject(songData.title, songData.artist, songData.preview_url, songData.chorus);
  console.log(song); // log the song object to the console

  wordsToGuess = song.lyrics.filter(lyric => lyric.toGuess).length;

  // Get the songTitle div
  var songTitle = document.getElementById("songTitle");

  // Populate the songTitle div with the song title and artist
  songTitle.innerHTML = '<span id="title"><b>' + song.title + '</b></span>' +
              '<span id="by" class="lyricle-songtitle-spacer">by</span>' +
              '<span id="artist">' + song.artist + '</span>';

  // Populate the How To Play text with the song title and artist
  var howToPlayObjectiveText = document.getElementById("objectiveText");
  howToPlayObjectiveText.innerHTML = "Guess the hidden lyrics to today's song, <b>" + song.title + "</b> by <b>" + song.artist + "</b>!";

  // construct the lyric input boxes to start the game
  constructLyricInputBoxes(song, lyricsGridContainer);

  constructLifelineButton(song);

  //calculateProperties(song)

  resetStopwatch();
  
  // Create an audio element to play the song preview
  audio = new Audio(song.preview);
}

function splitLineForDisplay(line, maxLineLength) {
  // if the line is less than or equal to the maxLineLength, return the line as is
  if (line.length <= maxLineLength) {
    return [line];
  }

  // Calculate total number of lines to create
  // This is determined by dividing the length of the line by the maxLineLength and rounding up
  var totalLines = Math.ceil(line.length / maxLineLength);

  // Calculate the max number of characters per line for this specific provided line
  // This is based on the length of the line divided by the total number of lines
  var maxCharsPerLine = Math.ceil(line.length / totalLines);

  // Initialize newLines array
  var newLines = [];

  // For each word in the original line
  var words = line.split(" ");
  var i = 0;
  while (i < words.length) {
    // Initialize a new line
    var newLine = "";

    // While the new line is less than the maxCharsPerLine and there are still words left
    while (newLine.length < maxCharsPerLine && i < words.length) {
      // Add the next word to the new line
      newLine += words[i] + " ";
      i++;
    }

    // Push the new line to the newLines array
    newLines.push(newLine.trim());
  }

  // Return the newLines array
  return newLines;
}

function splitLengthyLyricLines(lines) {
  // Initialize newLines array
  let newLines = [];

  // For each line in the provided lines array
  for (let line of lines) {
    splitLines = splitLineForDisplay(line, 30);

    // For each split line in the splitLines array
    for (let splitLine of splitLines) {
      newLines.push(splitLine);
    }
  }

  // Remove any undefined values from the end of the array
  newLines = newLines.filter(line => line !== undefined);

  // return the new array of lines that have been split to not be too long for the game to display
  return newLines;
}

async function getAllSongData() {
  /* Sadly, GitHub Pages doesn't support hosting files that are not HTML, CSS, or JS, so we can't use a local JSON file
  // Either way, you're still going to need to use the await fetch method which is not instantaneous and does not load in parallel to the index page
  // Code for Obtaining SongData via Local JSON File
  try {
    const response = await fetch('../docs/gameData.json');
    allSongData = await response.json();
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
  clearInterval(interval);
  startTime = null;
  endTime = null;
}

async function playSongPreview() {
  var maxVolume = 0.2 // Set maximum allowable volume
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
        audio.volume = audio.currentTime / fadeDuration * maxVolume;
      } else {
        clearInterval(fadeInInterval);
      }
    }, 100); // Check every 100 milliseconds

    // Fade out the audio in the last 5 seconds
    var fadeOutInterval = setInterval(function() {
      if (audio.currentTime >= audio.duration - fadeDuration) {
        audio.volume = (audio.duration - audio.currentTime) / fadeDuration * maxVolume;
      } else {
        clearInterval(fadeOutInterval);
      }
    }, 100); // Check every 100 milliseconds

    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100 milliseconds before checking again
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

function checkCorrectness(input, song) {
  // Compare the input value to the contentComparable of the lyric object
  var comparableInput = input.value // for comparison
  .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "") // disallow any input that isn't a standard English letter or number
  .toLowerCase() // make all letters lowercase
  .normalize("NFD") // decompose letters and diatrics
  .replace(/\p{Diacritic}/gu, ''); // replace them with non-accented characters

  if (comparableInput === song.lyrics[focusedBoxIndex].contentComparable) {
    input.value = song.lyrics[focusedBoxIndex].content; // populate the input box with the unformatted secret word at boxIndex
    input.classList.add("lyricle-lyrics-input-correct");
    input.disabled = true;
    wordsCorrect++;
    if (wordsCorrect === wordsToGuess) { // if the wordsCorrect score equals the number of words in the song
      completeGame(song); // call function that executes game completion code
    }
    selectNextInput(input, (focusedBoxIndex)); // call function that selects the next input box
  }
}

function getDayInt() { // Get the integer value (1-365) of the day of the year
  var now = new Date(); // create a new Date object
  var start = new Date(now.getFullYear(), 0, 0); // create a new Date object for the start of the year
  var diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000; // calculate the difference between the two dates
  var oneDay = 1000 * 60 * 60 * 24; // calculate the number of milliseconds in a day
  var day = Math.floor(diff / oneDay); // calculate the day of the year
  return day
}

function selectNextInput(input, boxIndex) {
  // 
  var nextInputIndex = boxIndex + 1; // set the nextInputIndex to the boxIndex + 1
  var nextInput = document.getElementById("lyricInput" + (nextInputIndex)); // get the next sibling element (nextSiblingElement doesn't work here)
  while (nextInput && nextInput.disabled) { // loop until we find the next non-disabled sibling element
    nextInputIndex ++; // increment the nextInputIndex by 1
    nextInput = document.getElementById("lyricInput" + (nextInputIndex));; // get the next sibling element
  }
  if (nextInput) {
    // if there is a next input box (i.e. we're not at the end of the song)
    nextInput.focus(); // focus on the next input box
  }
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

  var allCorrect = wordsCorrect === wordsToGuess
  if (allCorrect) {
    // Do Nothing
  } else {
    // populate every incorrect input box with the correct word and shade it yellow
    for (var i = 0; i < song.lyrics.length; i++) {
      var input = document.getElementById("lyricInput" + i); // get the input box element by id
      if (input.style.backgroundColor !== "green") { // if the input box background color is not green
        input.value = song.lyrics[i].content; // populate the input box with the correct word
      }
    }
  }

  constructGameCompleteModal(song)
}

function calculateProperties(song) { // For Debugging: Calculate properties of song lyrics
  // Output number of lines in song
  console.log("LinesCount: " + song.lines.length);

  // Output number of words in song excluding symbols
  const wordsWithoutSymbols = song.lyrics.filter(word => /^[a-zA-Z]+$/.test(word));
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
  let percentageCorrect = Math.floor((wordsCorrect / song.lyrics.length) * 100);

  // Time to Completion
  let totalTime = endTime - startTime; // Time in milliseconds
  let totalSeconds = totalTime / 1000; // Convert to seconds
  let minutes = Math.floor(totalSeconds / 60); // Get minutes
  let seconds = Math.floor(totalSeconds % 60); // Get remaining seconds
}

function displayGameCompleteModal() {
  var modalElement = document.getElementById("gameCompleteModal");
  var modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

function init() { // Initialize the game
  //Dark Mode Implementation 
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Apply dark theme
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    let darkmode = true;
  }

  constructRandomButton();
  day = getDayInt(); // Get the integer value of the day of the year

  getAllSongData().then(() => {
    songData = allSongData[day]; // Get the song data for the day
    // if songData is null (because today's int is higher than the length of allSongData), select an object at a random integer index from allSongData
    if (songData == null) {
      songData = allSongData[Math.floor(Math.random() * allSongData.length)];
    }
    startGame(songData);
});
}
window.onload = init; // upon loading the page, initialize the game