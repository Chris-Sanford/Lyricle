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
    this.boxIndex = boxIndex; // index of the lyric box, either word or puntuation
    this.lineIndex = lineIndex; // index of the which line (or row) the lyric box is in
    this.content = content; // the original content of the lyric
    this.contentComparable = contentComparable; // the content of the lyric in a format that can be compared
    this.toGuess = toGuess; // boolean value indicating whether the word should be guessed or not
    //this.spaceLeft = spaceLeft; // boolean value indicating whether there is a space to the left of the word (for displaying punctuation well)
    //this.spaceRight = spaceRight; // boolean value indicating whether there is a space to the right of the word (for displaying punctuation well)
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
  
  var maxLines = 5; // Maximum number of lines to display in the game
  // If the total number of lines is less than maxLines, set maxLines to the total number of lines
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

      // If the word originally had a space to the left of it, set spaceLeft to true
      // else, set spaceLeft to false

      // If the word originally had a space to the right of it, set spaceRight to true
      // else, set spaceRight to false

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
  // Get the OSKB Col element to populate the lifeline button into
  var oskbRow = document.getElementById("oskbRow1Col1");

  // Create the lifeline button
  var lifelineButton = document.createElement("button");
  lifelineButton.id = "lifelineButton";
  lifelineButton.type = "button";
  lifelineButton.classList.add("btn", "lyricle-lifeline-button");

  // Set the click event listener for the lifeline button
  lifelineButton.addEventListener("click", function() {
    useLifeline(song, lifelineButton);
  });

  // Create the lifeline button icon
  var lifelineButtonIcon = document.createElement("i");
  lifelineButtonIcon.classList.add("fas", "fa-heart");
  lifelineButton.appendChild(lifelineButtonIcon);

  // Create the lifeline button number
  var lifelineButtonNumber = document.createElement("span");
  lifelineButtonNumber.id = "lifelineButtonNumber";
  lifelineButtonNumber.classList.add("lyricle-lifeline-number");
  lifelineButtonNumber.innerText = lifelines;
  lifelineButton.appendChild(lifelineButtonNumber);

  // Append the lifeline button to the OSKB Col element
  oskbRow.appendChild(lifelineButton);
}

function constructStatsButton() {
  var topBarLeftButtons = document.getElementById("topBarLeftButtons");

  var button = document.createElement("button");
  button.type = "button";
  button.id = "statsButton";
  button.classList.add("btn", "lyricle-icon-button");

  topBarLeftButtons.appendChild(button);

  var icon = document.createElement("i");
  icon.classList.add("fa-solid", "fa-chart-column");
  button.appendChild(icon);
  button.addEventListener("click", displayGameCompleteModal);
}

function constructRandomButton() {
  var topBarLeftButtons = document.getElementById("topBarLeftButtons");

  var button = document.createElement("button");
  button.type = "button";
  button.id = "randomButton";
  button.classList.add("btn", "lyricle-icon-button");

  topBarLeftButtons.appendChild(button);

  var icon = document.createElement("i");
  icon.id = "randomButtonIcon";
  icon.classList.add("fa-solid", "fa-dice");
  button.appendChild(icon);
  button.addEventListener("click", getRandomSong);
}

function calculateOptimizedLyricBoxWidth(lyricContent) {
  // Define the standard width buffer to add to each calculated width
  // I believe this is only necessary for input elements because their sizing is handled differently
  var widthBuffer = 5;

  // Create a div
  var div = document.createElement("div");

  // Hide the div so it's not displayed and doesn't interfere with the page layout
  div.style.visibility = "hidden";

  // Get the font size of div element "lyrics"
  //var lyricsDiv = document.getElementById("lyrics");
  //var fontSize = window.getComputedStyle(lyricsDiv).getPropertyValue("font-size");
  // Set its font size to the same font size as the actual lyric boxes
  //console.log(fontSize);
  //div.style.fontSize = fontSize;

  // Set the font size to the same as the lyric boxes
  div.style.fontSize = "min(1.2em, 60px)";

  // Set its width to max-content, something not available in an input element
  div.style.width = "max-content";

  // Set the inner HTML value to the lyric content
  div.innerHTML = lyricContent;

  // Append the div to the body so it's rendered and we can get the width
  document.body.appendChild(div);

  // Get the width of the div to get the exact pixel width that will fit the secret lyric content perfectly
  var width = div.clientWidth;

  // Remove the div from the body
  div.remove();

  // Return the width
  return width + widthBuffer;
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
      // Create a parent div within the column
      var div = document.createElement("div");
      div.id = "lyricInputDiv" + lyricsToDisplay[i].boxIndex;
      
      // Add the lyricle-lyrics-div class
      div.classList.add("lyricle-lyrics-div");

      // Add the default bottom border
      div.style.borderBottom = "2px solid rgb(255, 255, 255, 0.99)";

      // Dynamically calculate the width of the div based on the content of the lyric
      var width = calculateOptimizedLyricBoxWidth(lyricsToDisplay[i].content)
      div.style.width = width + "px";

      // Create a span as an input box within the div
      var input = document.createElement("span");
      input.classList.add("input", "lyricle-lyrics-input");
      input.role = "textbox"
      input.contentEditable = true;
      input.id = "lyricInput" + lyricsToDisplay[i].boxIndex;

      // Add a keydown listener to the input box
      input.addEventListener("keydown", function(event) {
        lyricBoxKeyDownListener(event, song);
      });

      // Add an input listener to the input box
      input.addEventListener("input", function() {
        lyricBoxInputListener(song);
      });

      // Add focus listener to the input box
      input.addEventListener("focus", function() {
        lyricBoxFocusListener(input);
      });

      // If the word is not to be guessed, populate the input box with the word and disable it
      if (!lyricsToDisplay[i].toGuess) {
        input.innerHTML = lyricsToDisplay[i].content;
        div.classList.add("lyricle-lyrics-input-noguess");
        // Remove bottom border from style
        div.style.borderBottom = "none";
        input.disabled = true;
        input.contentEditable = false;
      }

      // Add the input box to the div
      div.appendChild(input);

      // Add the div to the column
      col.appendChild(div);
    }

    // Increment lineIndex by 1
    lineIndex++;

    // Get all lyric objects from the next lineIndex
    var lyricsToDisplay = song.lyrics.filter(lyric => lyric.lineIndex === lineIndex);
  }
}

function constructGameCompleteModal(song) {

  constructRandomButton();
  constructStatsButton();

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
  percentageCorrectCell2.innerText = `${wordsCorrect} of ${wordsToGuess} (${Math.floor((wordsCorrect / wordsToGuess) * 100)}%)`;
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
  modalFooter.classList.add("modal-footer","center");
  modalContent.appendChild(modalFooter);

  // Populate the modal footer with a mute button
  var muteButton = document.createElement("button");
  muteButton.type = "button";
  muteButton.classList.add("btn", "btn-secondary");
  muteButton.id = "muteButton2";
  muteButton.addEventListener("click", toggleMuteSongPreview);
  var muteButtonIcon = document.createElement("i");
  muteButtonIcon.id = "muteButtonIcon2";
  var originalMuteButtonIcon = document.getElementById("muteButtonIcon"); // Get the original mute button icon element
  muteButtonIcon.className = originalMuteButtonIcon.className; // Set the className to be the same as the original muteButton
  muteButton.appendChild(muteButtonIcon);
  modalFooter.appendChild(muteButton);

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

  // Get the mute button in the modal footer if it exists
  var muteButton2 = document.getElementById("muteButtonIcon2");
  if (muteButton2) {
    // Set the className to be the same as the original muteButton
    muteButton2.className = muteButton.className;
  }
}

async function populateAlertsDiv() {
  const alertsDiv = document.getElementById("alerts");
  const alertHTML = `
    <div class="alert alert-warning" role="alert">
      <span id="alertText">Select a lyric before using a lifeline!</span>
    </div>
  `;
  alertsDiv.innerHTML = alertHTML;

  // Remove the alert after 3 seconds
  setTimeout(() => {
    alertsDiv.innerHTML = '';
  }, 3000);
}

function useLifeline(song, button) {
  // If lifelines is 0, return/end the function
  // We shouldn't be able to hit this but it's just an extra layer of protection against bugs
  if (lifelines === 0) {
    return;
  }

  // if the current focusedBoxIndex is already marked as correct or is disabled, return/end the function
  var input = document.getElementById("lyricInput" + focusedBoxIndex);
  if (input.classList.contains("lyricle-lyrics-input-correct") || input.disabled) {
    populateAlertsDiv()
    return;
  }

  lifelines--;

  // Update the lifelines remaining text
  // Get the lifelineButtonNumber element
  var lifelineButtonNumber = document.getElementById("lifelineButtonNumber");

  // Set the innerText to the number of lifelines remaining
  lifelineButtonNumber.innerText = lifelines;

  // If the stopwatch hasn't been started, start it
  if (!startTime) {
    startStopwatch();
  }

  if (lifelines > 0) {
    input.innerHTML = song.lyrics[focusedBoxIndex].content;
    input.classList.add("lyricle-lyrics-input-correct");
    input.parentElement.classList.add("lyricle-lyrics-input-correct");
    input.style.borderBottom = "none"; // Remove bottom border from style
    input.parentElement.style.borderBottom = "none"; // Remove bottom border from style
    input.disabled = true;
    wordsCorrect++;

    if (wordsCorrect === wordsToGuess) {
      button.classList.remove("btn-danger");
      button.classList.add("disabled"); // Add disabled attribute to lifeline button
      completeGame(song); // call function that executes game completion code
      return;
    }
    selectNextInput(input, focusedBoxIndex); // call function that selects the next input box
  }
  if(lifelines === 1) {
    button.classList.add("btn-danger");
  }

  if (lifelines === 0) {
    button.classList.remove("btn-danger");
    button.classList.add("disabled"); // Add disabled attribute to lifeline button
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
function lyricBoxKeyDownListener(event, song) {
  // If the key pressed is not the backspace key and the length of the input is greater than or equal to the length of the secret word
  if (event.key !== "Backspace" && event.srcElement.innerText.length >= song.lyrics[focusedBoxIndex].content.length) {
    // Prevent the default action of the event, thusly preventing additional characters from being entered
    event.preventDefault();
  }
}

function lyricBoxInputListener(song) {
  // If the stopwatch hasn't been started, start it
  if (!startTime) {
    startStopwatch();
  }

  // Increment the input counter
  inputCounter++;

  // Get lyricBox element using activeElement
  var lyricBox = document.activeElement;

  // If the input value is greater than the length of the secret word, don't allow any more characters
  checkCorrectness(lyricBox, song);
}

function lyricBoxFocusListener (input) {
  // Update the style of the previously-focused input box to signify that it is no longer focused
  var previouslyFocusedInput = document.getElementById("lyricInput" + focusedBoxIndex);

  // If the previouslyFocusedInput exists and is not marked as correct or noguess
  if (previouslyFocusedInput && !previouslyFocusedInput.parentElement.classList.contains("lyricle-lyrics-input-noguess") && !previouslyFocusedInput.parentElement.classList.contains("lyricle-lyrics-input-correct")) {
    console.log("A new lyric box was focused, updating the border bottom style of the previously focused input box");
    // Change border bottom back to white while keeping current opacity
    setLyricBoxBorderBottomStyle(previouslyFocusedInput, 255, 255, 255, null);
  }

  // Get the active element
  var lyricBox = document.activeElement;

  // Set the focusedBoxIndex value globally so all other functions can address it
  focusedBoxIndex = parseInt(lyricBox.id.replace("lyricInput", ""));

  // Set the bottom border to be a blue, while maintaining opacity in case it was focused before, indicating active/focus
  setLyricBoxBorderBottomStyle(lyricBox, 0, 115, 255, null);
}

// Supporting Functions
function startGame(songData) { // Loads main game with song lyrics to guess
  var lyricsGridContainer = document.getElementById("lyricsGrid"); // Get the lyricsGrid div

  // Clear/Reset Divs from Previous Song
  lyricsGridContainer.innerHTML = "";
  document.getElementById("songTitleName").innerHTML = "";
  document.getElementById("songTitleArtist").innerHTML = "";
  document.getElementById("oskbRow1Col1").innerHTML = "";

  // If statsButton exists, remove it
  var statsButton = document.getElementById("statsButton");
  if (statsButton) {
    statsButton.remove();
  }

  // If randomButton exists, remove it
  var randomButton = document.getElementById("randomButton");
  if (randomButton) {
    randomButton.remove();
  }

  wordsCorrect = 0;
  wordsToGuess = 0;
  inputCounter = 0;
  lifelines = 3;
  focusedBoxIndex = 0;

  // construct a new Song object using the songData object
  var song = constructSongObject(songData.title, songData.artist, songData.preview_url, songData.chorus);

  wordsToGuess = song.lyrics.filter(lyric => lyric.toGuess).length;

  // Get the songTitle, songTitleName and songTitleArtist divs
  var songTitleDiv = document.getElementById("songTitle");
  var songTitleNameDiv = document.getElementById("songTitleName");
  var artistDiv = document.getElementById("songTitleArtist");

  // Calculate the font size to use based on character length
  var songTitleFontSize = (1.2 - (((song.title.length + song.artist.length) - 20) * 0.015));

  // Set the font size of the songTitle div
  songTitleDiv.style.fontSize = songTitleFontSize + "em";

  // Update the divs with the song title and artist
  songTitleNameDiv.innerHTML = '<b>' + song.title + '</b>';
  artistDiv.innerHTML = song.artist;

  // Populate the How To Play text with the song title and artist
  var howToPlayObjectiveText = document.getElementById("objectiveText");
  howToPlayObjectiveText.innerHTML = "Guess the hidden lyrics to today's song, <b>" + song.title + "</b> by <b>" + song.artist + "</b>!";

  // construct the lyric input boxes to start the game
  constructLyricInputBoxes(song, lyricsGridContainer);

  constructLifelineButton(song);

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
    splitLines = splitLineForDisplay(line, 35); // Maximum allowed characters on 1 line is 40

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

  // While the user has the audio muted, wait for the user to unmute the audio
  while (document.getElementById("muteButtonIcon").className === "fa-solid fa-volume-xmark") {
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100 milliseconds before checking again
  }

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

function getPercentageCorrect(input, secret) {
  // Create an array of characters from input and secret
  var inputChars = input.split('');
  var secretChars = secret.split('');

  // Initialize a variable to store the number of correct characters
  var correctChars = 0;

  // For each character in inputChars
  for (var i = 0; i < inputChars.length; i++) {
    // If the currently-iterated character in the inputChars array is found anywhere in the secretChars array
    if (secretChars.includes(inputChars[i])) {
      // Remove the first instance of the character from the secretChars array
      secretChars.splice(secretChars.indexOf(inputChars[i]), 1);
      // Increment correctChars by 1
      correctChars++;
    }
  }

  // Calculate percentageCorrect based on the number of correct characters and the length of the secret word
  var percentageCorrect = (correctChars / secret.length);

  console.log("Percentage Correct: " + percentageCorrect + "");

  // Return the percentage of correct characters
  return percentageCorrect;
}

function setLyricBoxBorderBottomStyle(lyricBox, color1, color2, color3, opacity) {
  // Log the values provided by the parameters
  console.log("Updating border bottom style of lyricBox " + focusedBoxIndex);
  console.log("Color1: " + color1);
  console.log("Color2: " + color2);
  console.log("Color3: " + color3);
  console.log("Opacity: " + opacity);

  // Get the current values of the border bottom style of the lyricBox element
  var currentBorderBottom = lyricBox.parentElement.style.borderBottom;
  var currentValuesString = currentBorderBottom.match(/\(([^)]+)\)/)[1];
  var currentValues = currentValuesString.split(", ");

  // Log the current values of the border bottom style of the lyricBox element
  console.log("Current border bottom style: " + currentValuesString);

  // If opacity was provided, set opacity to the provided value
  if (opacity) {
    var setOpacity = opacity;
  }
  else { // if opacity was not provided as a param
    if (currentValues[3]) {
      var setOpacity = currentValues[3]; // set opacity to the current opacity value if it exists
    }
    else {
      var setOpacity = 0.99; // otherwise, set it to the base default of 0.99
    }
  }
  
  // Update the color and opacity of the border bottom style
  lyricBox.parentElement.style.borderBottom = "2px solid rgb(" + color1 + ", " + color2 + ", " + color3 + ", " + setOpacity + ")";

  // Log the new border bottom style of the lyricBox element
  console.log("New border bottom style: " + lyricBox.parentElement.style.borderBottom);
}

function checkCorrectness(lyricBox, song) {
  // Compare the lyricBox value to the contentComparable of the lyric object
  var comparableInput = lyricBox.innerHTML // for comparison
  .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "") // disallow any input that isn't a standard English letter or number
  .toLowerCase() // make all letters lowercase
  .normalize("NFD") // decompose letters and diatrics
  .replace(/\p{Diacritic}/gu, ''); // replace them with non-accented characters

  // Define a variable containing the lyric object that the lyricBox corresponds to
  var lyric = song.lyrics[focusedBoxIndex];

  // Set the opacity of the div relative to the percentage of correct characters
  var percentageCorrect = getPercentageCorrect(comparableInput, lyric.contentComparable);
  var opacity = 1.00 - percentageCorrect;
  console.log("Opacity: " + opacity + "");
  setLyricBoxBorderBottomStyle(lyricBox, 0, 115, 255, opacity)

  if (comparableInput === lyric.contentComparable) {
    lyricBox.innerHTML = lyric.content; // populate the lyricBox box with the unformatted secret word at boxIndex
    lyricBox.classList.add("lyricle-lyrics-input-correct");
    lyricBox.parentElement.classList.add("lyricle-lyrics-input-correct");
    lyricBox.style.borderBottom = "none"; // Remove bottom border from style
    lyricBox.parentElement.style.borderBottom = "none"; // Remove bottom border from style
    lyricBox.disabled = true;
    lyricBox.contentEditable = false;
    wordsCorrect++;
    if (wordsCorrect === wordsToGuess) { // if the wordsCorrect score equals the number of words in the song
      completeGame(song); // call function that executes game completion code
    }
    selectNextInput(lyricBox, (focusedBoxIndex)); // call function that selects the next lyricBox box
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

  playSongPreview();

  var allCorrect = wordsCorrect === wordsToGuess
  if (allCorrect) {
    // Do Nothing
  } else {
    // populate every incorrect input box with the correct word
    for (var i = 0; i < song.lyrics.length; i++) {
      var input = document.getElementById("lyricInput" + i); // get the input box element by id
      if (!input.classList.contains("lyricle-lyrics-input-correct")) { // if the lyric isn't already correct
        input.innerHTML = song.lyrics[i].content; // populate the input box with the correct word
        input.parentElement.classList.add("lyricle-lyrics-input-noguess");
        input.parentElement.style.borderBottom = "none"; // Remove bottom border from style
      }
    }
  }

  constructGameCompleteModal(song)
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