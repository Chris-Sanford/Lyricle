// game.js

// Import song-related classes and functions
import { Song, Lyric, constructSongObject, constructLyricObjects } from './song.js';
// Import the new AudioController
import { AudioController, toggleMuteSongPreview } from './audio.js';
// Import the KeyboardController
import { KeyboardController } from './keyboard.js';
// Import debugLog
import { debugLog } from './debug.js';
// Import helper functions
import { isMobileDevice, splitLineForDisplay, getDayInt, sanitizeInput } from './helpers.js';
// Import the updated useLifeline function
import { useLifeline } from './lifelines.js';

// **************** Global Variables ****************
var lastLine = 0; // initialize lastLine to 0, make variable global so it can be accessed by all functions
var startingLifelines = 3; // initialize starting lifelines to 3, make variable global so it can be accessed by all functions
var lifelines = 0;
var allSongData; // Declare allSongData globally

var allowedKeys = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight"]; // array to store sanitized input for comparison

// Populate the array with standard lowercase english characters
var allowedCharacters = [];
for (var i = 97; i <= 122; i++) {
  allowedCharacters.push(String.fromCharCode(i));
}
allowedCharacters.push("'"); // Allow apostrophes although they will be filtered out in the comparison

// **************** UI Element Constructors ****************
function constructLifelineButton(song) {
  // Lifeline button creation is now handled by KeyboardController.construct
  // We just need to ensure the display is updated initially.
  updateLifelineDisplay(); // Call the game.js version which now calls the KeyboardController version
  
  // If standalone button exists, ensure it has the right click behavior
  const originalLifelineButton = document.getElementById("lifelineButton");
  if (originalLifelineButton) {
    // Remove any existing click listeners
    const newButton = originalLifelineButton.cloneNode(true);
    originalLifelineButton.parentNode.replaceChild(newButton, originalLifelineButton);
    
    // Add click listener that checks lifelines count and calls displayConcedeModal when needed
    newButton.addEventListener("click", function() {
      if (lifelines <= 0) {
        debugLog("Standalone lifeline button clicked with zero lifelines - showing concede modal");
        displayConcedeModal(song);
      } else {
        useLifeline(song);
      }
    });
  }
  
  return; // No need to create the old button
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

function constructGameCompleteModal(song, elapsedTime) { // Add elapsedTime parameter
  debugLog("Constructing game complete modal");
  // Random button is now created at initialization, no need to create it here
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

  // Get completion stats
  const stats = Stats.getCompletionStats(lifelines, elapsedTime); // Pass elapsedTime

  // Create the rows and cells for each statistic
  var percentageCorrectRow = document.createElement("tr");
  var percentageCorrectCell1 = document.createElement("td");
  percentageCorrectCell1.innerText = "Percentage Correct";
  var percentageCorrectCell2 = document.createElement("td");
  percentageCorrectCell2.innerText = `${stats.wordsCorrect} of ${stats.wordsToGuess} (${stats.percentageComplete}%)`;
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
  // Format the elapsed time nicely
  const minutes = Math.floor(stats.elapsedTime / 60);
  const seconds = Math.floor(stats.elapsedTime % 60);
  totalTimeCell2.innerText = `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
  totalTimeRow.appendChild(totalTimeCell1);
  totalTimeRow.appendChild(totalTimeCell2);
  tableBody.appendChild(totalTimeRow);

  var totalInputsRow = document.createElement("tr");
  var totalInputsCell1 = document.createElement("td");
  totalInputsCell1.innerText = "Total Inputs";
  var totalInputsCell2 = document.createElement("td");
  totalInputsCell2.innerText = stats.inputCounter;
  totalInputsRow.appendChild(totalInputsCell1);
  totalInputsRow.appendChild(totalInputsCell2);
  tableBody.appendChild(totalInputsRow);

  modalBodyContent.appendChild(tableBody);
  modalBody.appendChild(modalBodyContent);

  // Create the modal footer
  var modalFooter = document.createElement("div");
  modalFooter.classList.add("modal-footer", "d-flex", "justify-content-center");
  modalContent.appendChild(modalFooter);

  // Populate the modal footer with a mute button - reverted to simple icon style
  var muteButton = document.createElement("button");
  muteButton.type = "button";
  muteButton.classList.add("btn", "btn-secondary", "lyricle-icon-button");
  muteButton.id = "muteButton2";
  muteButton.setAttribute("aria-label", "Toggle song preview");
  muteButton.addEventListener("click", function() {
    debugLog("Modal mute button clicked");
    toggleMuteSongPreview();
    // Try to directly play after user interaction on iOS
    if (!AudioController.isMuted() && endTime) {
      debugLog("Modal: Playing audio after user interaction from position: " + AudioController.getCurrentTime().toFixed(2) + "s");
      AudioController.playWithUserInteraction();
    } else {
      debugLog("Modal: Not playing audio - muted: " + AudioController.isMuted() + ", game completed: " + (endTime ? "yes" : "no"));
    }
  });
  
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

function calculateOptimizedLyricBoxWidth(lyricContent, customBuffer) {
  // Slightly increase the buffer for better word separation
  var widthBuffer = customBuffer !== undefined ? customBuffer : 6;

  // Create a div
  var div = document.createElement("div");
  div.style.visibility = "hidden";
  div.style.fontSize = "min(1.3em, 60px)";
  div.style.width = "max-content";
  div.innerText = lyricContent;
  document.body.appendChild(div);
  var width = div.clientWidth;
  div.remove();
  
  // Add a slight extra buffer for words that might need it
  // Words that are likely to blend visually with neighbors: shorter words, 
  // words ending with 'f', 't', etc.
  if (lyricContent.length < 5 || /[ftsrl]$/i.test(lyricContent.trim())) {
    widthBuffer += 1; // Add just 1px extra for these cases
  }
  
  return width + widthBuffer;
}

// Update constructLyricInputBoxes to properly handle keyboard input on all devices
function constructLyricInputBoxes(song, lyricsGridContainer) {
  // Reset container
  lyricsGridContainer.innerHTML = '';
  lyricsGridContainer.style.width = "100%";
  lyricsGridContainer.style.maxWidth = "100%";
  lyricsGridContainer.style.margin = "0 auto";
  
  var lineIndex = 0;
  var lyricsToDisplay = song.lyrics.filter(lyric => lyric.lineIndex === lineIndex);

  while (lyricsToDisplay != null && lyricsToDisplay.length > 0) {
    // Create a new row for each line
    var row = document.createElement("div");
    row.classList.add("row", "lyricle-lyrics-row");
    row.style.maxWidth = "100%";
    row.style.width = "100%";
    row.style.marginTop = "0.15em";
    row.style.marginBottom = "0.15em";
    lyricsGridContainer.appendChild(row);

    // Create a column for the row
    var col = document.createElement("div");
    col.classList.add("col", "lyricle-lyrics-col", "lyricle-lyrics-flex-wrap");
    col.style.maxWidth = "100%";
    col.style.margin = "0 auto";
    col.style.padding = "0 3px";
    row.appendChild(col);

    // Create each lyric box in the line
    for (var i = 0; i < lyricsToDisplay.length; i++) {
      // Create the container div
      var div = document.createElement("div");
      div.id = "lyricInputDiv" + lyricsToDisplay[i].boxIndex;
      div.classList.add("lyricle-lyrics-div");

      // Handle special characters
      if (lyricsToDisplay[i].isSpecial) {
        div.classList.add("lyricle-lyrics-div-special");
        if (lyricsToDisplay[i].spaceLeft) {
          div.classList.add("lyricle-lyrics-div-space-left");
        }
        if (lyricsToDisplay[i].spaceRight) {
          div.classList.add("lyricle-lyrics-div-space-right");
        }
      }

      // Calculate optimal width for the lyric box
      var widthBuffer = 5;
      var width = calculateOptimizedLyricBoxWidth(lyricsToDisplay[i].content, widthBuffer);
      div.style.width = width + "px";
      div.style.maxWidth = "calc(100vw - 25px)";
      div.style.marginLeft = "3px";
      div.style.marginRight = "3px";

      // Create the input element
      var input = document.createElement("span");
      input.classList.add("input", "lyricle-lyrics-input");
      input.role = "textbox";
      input.id = "lyricInput" + lyricsToDisplay[i].boxIndex;
      
      // Add event listeners
      input.addEventListener("click", function(event) {
        // Set active input via KeyboardController
        KeyboardController.setActiveInput(this);
        
        // Call focus listener to handle styling
        lyricBoxFocusListener(this, song);
      });
      
      // Always make contentEditable true for desktop, but handle mobile via KeyboardController
      if (isMobileDevice() && KeyboardController.isEnabled()) {
        input.contentEditable = false;
      } else {
        input.contentEditable = "true";
      }
      
      // Handle focus events
      input.addEventListener("focus", function(event) {
        // Set active input via KeyboardController
        KeyboardController.setActiveInput(this);
        
        lyricBoxFocusListener(this, song);
      });
      
      // Always include keyboard event listeners for desktop (or if custom keyboard is disabled)
      input.addEventListener("keydown", function(event) {
        // Only run desktop handler if custom keyboard isn't active or it's not mobile
        if (!KeyboardController.isEnabled() || !isMobileDevice()) {
           lyricBoxKeyDownListener(event, song);
        }
      });
      
      input.addEventListener("input", function() {
         // Only run desktop handler if custom keyboard isn't active or it's not mobile
         if (!KeyboardController.isEnabled() || !isMobileDevice()) {
            lyricBoxInputListener(song);
         }
      });

      // Handle non-guessable words
      if (!lyricsToDisplay[i].toGuess) {
        input.innerText = lyricsToDisplay[i].content;
        div.classList.add("lyricle-lyrics-input-noguess");
        div.style.borderBottom = "4px solid rgba(255, 255, 255, 0.001)";
        input.disabled = true;
        input.contentEditable = false;
      } else {
        div.style.borderBottom = "4px solid rgba(255, 255, 255, 0.99)";
      }

      div.appendChild(input);
      col.appendChild(div);
    }

    lineIndex++;
    lyricsToDisplay = song.lyrics.filter(lyric => lyric.lineIndex === lineIndex);
  }

  // Add resize handlers
  window.addEventListener('resize', function() {
    adjustLyricLineHeights();
    adjustLyricContentPosition();
  });
  
  // Adjust layout after a short delay to ensure everything is rendered
  setTimeout(function() {
    adjustLyricLineHeights();
    adjustLyricContentPosition();
  }, 100);
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

// **************** UI Element Constructor Helpers ****************
// Update the preventNativeKeyboard function to only apply to mobile devices
// function preventNativeKeyboard(event) { ... }

// NEW: Function to adjust lyric line heights based on content wrapping
function adjustLyricLineHeights() {
  const lyricsRows = document.querySelectorAll('.lyricle-lyrics-row');
  
  lyricsRows.forEach(row => {
    const col = row.querySelector('.lyricle-lyrics-col');
    if (!col) return;
    
    // Reset height to auto first to measure actual content
    row.style.height = 'auto';
    row.style.minHeight = 'auto';
    
    // Get actual content height with minimal padding
    const contentHeight = col.offsetHeight;
    // Reduce padding from 10px to just 2px
    const newHeight = contentHeight + 2 + 'px';
    
    // Set the new height
    row.style.height = newHeight;
    row.style.minHeight = newHeight;
  });
}

// Update the adjustLyricContentPosition function to account for the larger keyboard
function adjustLyricContentPosition() {
  // Get key elements
  const songTitle = document.getElementById('songTitle');
  const lyricsContainer = document.getElementById('lyrics');
  const lyricsGrid = document.getElementById('lyricsGrid');
  const oskbContainer = document.getElementById('oskb');
  
  if (!songTitle || !lyricsContainer || !lyricsGrid || !oskbContainer) return;
  
  // Calculate available height between song title and keyboard
  const viewportHeight = window.innerHeight;
  const songTitleBottom = songTitle.getBoundingClientRect().bottom;
  
  // Get the actual keyboard height including all rows
  const oskbHeight = oskbContainer.offsetHeight;
  debugLog("Keyboard height: " + oskbHeight + "px");
  
  // Calculate the available space with a buffer
  const availableHeight = viewportHeight - songTitleBottom - oskbHeight - 15;
  
  // Set the lyrics container height
  lyricsContainer.style.height = `${availableHeight}px`;
  
  // Ensure the lyrics container is properly positioned
  lyricsContainer.style.position = "relative";
  lyricsContainer.style.left = "0";
  lyricsContainer.style.right = "0";
  lyricsContainer.style.width = "100%";
  
  // Measure the lyrics grid height
  const lyricsGridHeight = lyricsGrid.offsetHeight;
  
  // Center the lyrics grid vertically in the available space
  if (lyricsGridHeight < availableHeight) {
    const verticalMargin = Math.max(5, Math.floor((availableHeight - lyricsGridHeight) / 2));
    lyricsGrid.style.marginTop = `${verticalMargin}px`;
    lyricsGrid.style.marginBottom = `${verticalMargin}px`;
  } else {
    // If content is too tall for centering, just use minimal top margin
    lyricsGrid.style.marginTop = '5px';
    lyricsGrid.style.marginBottom = '5px';
  }
  
  // Ensure positioning is correct
  lyricsGrid.style.position = 'relative';
  lyricsGrid.style.top = '0';
  lyricsGrid.style.transform = 'none';
  
  // Check for horizontal overflow
  checkAndPreventHorizontalOverflow();
  
  // Log layout details for debugging
  debugLog(`Layout: 
    - Viewport height: ${viewportHeight}px
    - Song title bottom: ${songTitleBottom}px
    - Keyboard height: ${oskbHeight}px
    - Available height: ${availableHeight}px
    - Lyrics grid height: ${lyricsGridHeight}px`);
}

// NEW: Function to detect and fix horizontal overflow
function checkAndPreventHorizontalOverflow() {
  const lyricsRows = document.querySelectorAll('.lyricle-lyrics-row');
  const viewportWidth = window.innerWidth;
  
  lyricsRows.forEach(row => {
    const col = row.querySelector('.lyricle-lyrics-col');
    if (!col) return;
    
    const children = col.children;
    let totalRowWidth = 0;
    
    // Update margin calculation to match our new spacing
    for (let i = 0; i < children.length; i++) {
      totalRowWidth += children[i].offsetWidth + 6; // Increased from 4px to 6px per item
    }
    
    if (totalRowWidth > viewportWidth) {
      col.style.flexWrap = 'wrap';
      col.style.maxWidth = '100%';
      col.style.justifyContent = 'center';
    }
  });
}

// Add a new function for explicit user-triggered playback
function playAudioWithUserInteraction() {
  debugLog("playAudioWithUserInteraction (game.js wrapper) called");
  AudioController.playWithUserInteraction(); // Delegate to AudioController
}

// **************** UI Button Functions ****************
function getRandomSong() {
  // Select a random song from the song data and start the game
  var seed = Math.floor(Math.random() * allSongData.length)
  var songData = allSongData[seed];

  // Stop any currently-playing audio
  if (AudioController.getCurrentTime() > 0) { // New check using controller
    AudioController.stop(true); // Stop and reset time
  }

  // To play a specific song:
  // Get its index: console.log(allSongData.findIndex(song => song.title === "Song Title"));
  // Set the songData variable: var songData = allSongData[index];
  // Start the game: startGame(songData);
  startGame(songData);
}

// **************** UI Element Listeners ****************
function lyricBoxKeyDownListener(event, song) {
  // If the game is complete, don't allow any input
  if (Stopwatch.endTime) {
    event.preventDefault();
    return;
  }

  // Start stopwatch on first input if not started
  if (!Stopwatch.startTime) {
    Stopwatch.start();
  }

  // Handle special keys
  if (event.key === "Tab") {
    // Allow default Tab behavior for keyboard navigation
    return;
  } else if (event.key === "Enter") {
    event.preventDefault();
    selectNextInput(event.target, focusedBoxIndex);
    return;
  }

  // If the key or character isn't allowed, prevent the default action
  if (!allowedKeys.includes(event.key) && !allowedCharacters.includes(event.key.toLowerCase())) {
    event.preventDefault();
    return;
  }

  // If the lyricBox is already at max length and the key isn't a control key, prevent input
  const lyric = song.lyrics[focusedBoxIndex];
  let inputAtMax = event.target.innerText.length >= lyric.content.length;
  if (inputAtMax && !allowedKeys.includes(event.key)) {
    event.preventDefault();
    return;
  }

  // For allowed input, increment the counter
  Stats.incrementInputCounter();
}

function lyricBoxInputListener(song) {
  // If the stopwatch hasn't been started, start it
  if (!Stopwatch.startTime) {
    Stopwatch.start();
    debugLog("First user interaction, attempting to unlock audio via AudioController");
    // Attempt to unlock audio context on first interaction
    AudioController.unlockAudioContext();
  }

  // Increment the input counter
  Stats.incrementInputCounter();

  // Get lyricBox element using activeElement
  var lyricBox = document.activeElement;
  
  // Get the index of the lyric from the input element ID
  var lyricIndex = parseInt(lyricBox.id.replace("lyricInput", ""));
  
  // Define a variable containing the lyric object that the lyricBox corresponds to
  var lyric = song.lyrics[lyricIndex];
  
  // Check if input exceeds maximum length and trim if necessary
  if (lyricBox.innerText.length > lyric.content.length) {
    lyricBox.innerText = lyricBox.innerText.substring(0, lyric.content.length);
    
    // Move cursor to end after trimming
    const range = document.createRange();
    const sel = window.getSelection();
    
    if (!lyricBox.firstChild) {
      lyricBox.appendChild(document.createTextNode(''));
    }
    
    const textNode = lyricBox.firstChild || lyricBox;
    const length = lyricBox.innerText.length;
    range.setStart(textNode, length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Check correctness
  checkCorrectness(lyricBox, song);
}

// Update lyricBoxFocusListener to work properly on all devices and notify KeyboardController
function lyricBoxFocusListener(input, song) {
  // Update KeyboardController's active input
  KeyboardController.setActiveInput(input);
  const focusedBoxIndex = KeyboardController.focusedBoxIndex; // Get index from controller

  // First, reset all lyric boxes to their default state
  for (let i = 0; i < song.lyrics.length; i++) {
    const otherInput = document.getElementById(`lyricInput${i}`);
    if (otherInput && otherInput !== input) {
      // Skip if this is a completed or non-guessable lyric
      if (otherInput.parentElement.classList.contains("lyricle-lyrics-input-correct") ||
          !song.lyrics[i].toGuess) {
        continue;
      }
      
      // Calculate the percentage correct for proper opacity
      const comparableInput = otherInput.innerHTML
        .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, '');
      
      const percentageCorrect = getPercentageCorrect(comparableInput, song.lyrics[i].contentComparable);
      const opacity = 1.00 - percentageCorrect;
      
      // Reset to default white underline with calculated opacity
      setLyricBoxBorderBottomStyle(otherInput, {
        width: 4,
        color1: 255,
        color2: 255,
        color3: 255,
        opacity: opacity
      });
    }
  }
  
  // Calculate styling for current input
  const comparableInput = input.innerHTML
    .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, '');
  
  const percentageCorrect = getPercentageCorrect(comparableInput, song.lyrics[focusedBoxIndex].contentComparable);
  const opacity = 1.00 - percentageCorrect;

  // Apply focused style (blue) only to the current input
  setLyricBoxBorderBottomStyle(input, {
    width: 4,
    color1: 0,
    color2: 115,
    color3: 255,
    opacity: opacity
  });
  
  // Move cursor to end of content if there is any
  if (input.innerText.length > 0) {
    const range = document.createRange();
    const sel = window.getSelection();
    
    // Create a text node if one doesn't exist
    if (!input.firstChild) {
      input.appendChild(document.createTextNode(''));
    }
    
    // Set cursor position to end
    const textNode = input.firstChild || input;
    const length = input.innerText.length;
    range.setStart(textNode, length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// **************** UI Control Logic ****************
function moveCursorToEnd(lyricBox, song) {
  // If the lyricBox is empty, no need to move cursor
  if (lyricBox.innerText.length === 0) {
    return;
  }

  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart(lyricBox, 1);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  lyricBox.focus();
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

  // Return the percentage of correct characters
  return percentageCorrect;
}

function setLyricBoxBorderBottomStyle(lyricBox, params) {
  // Get the current values of the border bottom style of the lyricBox element
  try {
    var currentBorderBottom = lyricBox.parentElement.style.borderBottom;
    var currentValuesString = currentBorderBottom.match(/\(([^)]+)\)/)[1];
  } catch (error) {
    currentValuesString = "0, 0, 0, 0.99";
  }

  try {
    var currentWidth = currentBorderBottom.match(/(\d+)px/)[1];
  } catch (error) {
    currentWidth = 4;
  }

  var currentValues = currentValuesString.split(", ");

  // Update the color and opacity of the border bottom style
  var width = params.width !== "" ? params.width : currentWidth;
  var color1 = params.color1 !== "" ? params.color1 : currentValues[0];
  var color2 = params.color2 !== "" ? params.color2 : currentValues[1];
  var color3 = params.color3 !== "" ? params.color3 : currentValues[2];
  var opacity = params.opacity !== "" && params.opacity !== undefined ? params.opacity : 0.99;

  lyricBox.parentElement.style.borderBottom = width + "px solid rgba(" + color1 + ", " + color2 + ", " + color3 + ", " + opacity + ")";
}

function checkCorrectness(lyricBox, song) {
  // Compare the lyricBox value to the contentComparable of the lyric object
  var comparableInput = lyricBox.innerHTML // for comparison
  .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "") // disallow any input that isn't a standard English letter or number
  .toLowerCase() // make all letters lowercase
  .normalize("NFD") // decompose letters and diatrics
  .replace(/\p{Diacritic}/gu, ''); // replace them with non-accented characters

  // Get the index of the lyric from the input element ID
  var lyricIndex = parseInt(lyricBox.id.replace("lyricInput", ""));
  
  // Define a variable containing the lyric object that the lyricBox corresponds to
  var lyric = song.lyrics[lyricIndex];

  // Set the opacity of the div relative to the percentage of correct characters
  var percentageCorrect = getPercentageCorrect(comparableInput, lyric.contentComparable);
  var opacity = 1.00 - percentageCorrect;
  setLyricBoxBorderBottomStyle(lyricBox, {
    width: "",
    color1: "",
    color2: "",
    color3: "",
    opacity: opacity
  });

  if (comparableInput === lyric.contentComparable) {
    lyricBox.innerHTML = lyric.content; // populate the lyricBox box with the unformatted secret word at boxIndex
    lyricBox.classList.add("lyricle-lyrics-input-correct");
    lyricBox.parentElement.classList.add("lyricle-lyrics-input-correct");
    setLyricBoxBorderBottomStyle(lyricBox, {
      width: 4,
      color1: 255,
      color2: 255,
      color3: 255,
      opacity: 0.001
    });
    lyricBox.disabled = true;
    lyricBox.contentEditable = false;
    
    // Important: If we're on mobile and using custom keyboard, clear the KeyboardController's active input reference
    // since this one is now complete
    if (isMobileDevice() && window.KeyboardController && window.KeyboardController.isEnabled() && 
        window.KeyboardController.activeInputElement === lyricBox) {
      debugLog("Clearing KeyboardController active input reference as it's now complete");
      // We'll set a new active input in selectNextInput
    }
    
    if (Stats.incrementWordsCorrect()) { // if all words are correct
      completeGame(song); // call function that executes game completion code
    }
    selectNextInput(lyricBox, (lyricIndex)); // call function that selects the next lyricBox box - updated parameter
  }
}

function selectNextInput(input, boxIndex) {
  debugLog(`selectNextInput called with input ID: ${input.id}, boxIndex: ${boxIndex}`);
  
  var nextInputIndex = boxIndex + 1; // set the nextInputIndex to the boxIndex + 1
  var nextInput = document.getElementById("lyricInput" + (nextInputIndex)); // get the next sibling element (nextSiblingElement doesn't work here)
  while (nextInput && nextInput.disabled) { // loop until we find the next non-disabled sibling element
    nextInputIndex ++; // increment the nextInputIndex by 1
    nextInput = document.getElementById("lyricInput" + (nextInputIndex)); // get the next sibling element
  }
  
  if (nextInput) {
    // if there is a next input box (i.e. we're not at the end of the song)
    debugLog(`Found next input: lyricInput${nextInputIndex}`);
    
    // Focus the next input box
    nextInput.focus();
    
    // Also manually set it as active in KeyboardController for mobile devices
    if (window.KeyboardController) {
      window.KeyboardController.setActiveInput(nextInput);
      
      // Make sure cursor is at the end for native keyboard users
      if (nextInput.innerText.length > 0) {
        // Move cursor to end via range selection
        const range = document.createRange();
        const sel = window.getSelection();
        
        // Create a text node if one doesn't exist
        if (!nextInput.firstChild) {
          nextInput.appendChild(document.createTextNode(''));
        }
        
        // Set cursor position to end
        const textNode = nextInput.firstChild || nextInput;
        const length = nextInput.innerText.length;
        range.setStart(textNode, length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    
    // Highlight the focused input with the proper styling via the focus listener
    if (window.currentSong) {
      lyricBoxFocusListener(nextInput, window.currentSong);
    }
  } else {
    debugLog("No next input found - either at end of lyrics or all completed");
  }
}

function displayGameCompleteModal() {
  var modalElement = document.getElementById("gameCompleteModal");
  var modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

function displayHowToPlayModal() {
  debugLog("Displaying How To Play modal");
  // Log audio state if it exists
  if (AudioController.audio) { // Check if controller has initialized audio
    debugLog(`Audio state (Controller): muted=${AudioController.isMuted()}, loaded=${AudioController.isLoaded()}, currentTime=${AudioController.getCurrentTime().toFixed(2)}, src=${AudioController.audio.src ? 'set' : 'not set'}`);
  } else {
    debugLog("AudioController has not initialized audio element yet");
  }
  
  var modalElement = document.getElementById("howToPlay");
  var modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
  
  // Add an event listener for when the modal is shown
  modalElement.addEventListener('shown.bs.modal', function() {
    debugLog("How To Play modal fully shown");
  });
  
  // Add an event listener for when the modal is hidden
  modalElement.addEventListener('hidden.bs.modal', function() {
    debugLog("How To Play modal hidden");
    // Log audio state after modal close using AudioController
    if (AudioController.audio) {
        debugLog(`Audio state after modal close (Controller): muted=${AudioController.isMuted()}, paused=${AudioController.audio.paused}`);
    }
    // Focus first unfilled lyric after modal is hidden
    focusFirstUnfilledLyric();
  });
}

function displayConcedeModal(song) {
  // Check if modal already exists
  var existingModal = document.getElementById("concedeModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create the modal element
  var modal = document.createElement("div");
  modal.classList.add("modal", "fade");
  modal.id = "concedeModal";
  modal.tabIndex = "-1";
  modal.setAttribute("aria-labelledby", "concedeModalLabel");
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
  modalTitle.id = "concedeModalLabel";
  modalTitle.innerText = "Concede Game?";
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
  var modalBodyContent = document.createElement("p");
  modalBodyContent.innerText = "Are you sure you want to concede? This will end the game and reveal all the lyrics.";
  modalBody.appendChild(modalBodyContent);

  // Create the modal footer
  var modalFooter = document.createElement("div");
  modalFooter.classList.add("modal-footer", "d-flex", "justify-content-center");
  modalContent.appendChild(modalFooter);

  // Create the cancel button
  var cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.classList.add("btn", "btn-secondary");
  cancelButton.setAttribute("data-bs-dismiss", "modal");
  cancelButton.innerText = "Cancel";
  modalFooter.appendChild(cancelButton);

  // Create the concede button
  var concedeButton = document.createElement("button");
  concedeButton.type = "button";
  concedeButton.classList.add("btn", "btn-danger");
  concedeButton.innerText = "Concede";
  concedeButton.addEventListener("click", function() {
    // Blur button first to prevent aria-hidden warning
    concedeButton.blur();
    document.activeElement.blur();
    
    // Use a small delay to ensure focus is properly cleared before hiding the modal
    setTimeout(() => {
      try {
        // Close the modal
        var concedeModalElement = document.getElementById("concedeModal");
        if (concedeModalElement) {
          var concedeModalInstance = bootstrap.Modal.getInstance(concedeModalElement);
          if (concedeModalInstance) {
            concedeModalInstance.hide();
          } else {
            concedeModalElement.classList.remove('show');
            concedeModalElement.style.display = 'none';
            concedeModalElement.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            
            // Remove any backdrop
            const backdrops = document.getElementsByClassName('modal-backdrop');
            while (backdrops.length > 0) {
              backdrops[0].parentNode.removeChild(backdrops[0]);
            }
          }
        }
      } catch (modalError) {
        debugLog("Error hiding concede modal: " + modalError.message);
      }
      
      // End the game
      concede(song);
    }, 50);
  });
  modalFooter.appendChild(concedeButton);

  // Append the modal to the document body
  document.body.appendChild(modal);

  // Display the modal
  var modalElement = document.getElementById("concedeModal");
  var modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

// Update the focusFirstUnfilledLyric function to be more robust and use KeyboardController
function focusFirstUnfilledLyric() {
  // Use the song reference from the controller if available, otherwise fallback to window
  const currentSong = KeyboardController._songRef || window.currentSong;
  if (!currentSong) {
      debugLog("Cannot focus first unfilled lyric: No current song reference.");
      return;
  }
  const lyrics = currentSong.lyrics;
  for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].toGuess) {
          const input = document.getElementById(`lyricInput${i}`);
          // Check parent class as well for correctness
          if (input && !input.parentElement.classList.contains("lyricle-lyrics-input-correct")) {
              // Focus the input element directly
              input.focus();
              // Manually call the focus listener to update styling and KeyboardController state
              lyricBoxFocusListener(input, currentSong);
              debugLog(`Focused first unfilled lyric: lyricInput${i}`);
              break;
          }
      }
  }
}

// Function to update the lifeline display (now primarily calls KeyboardController)
function updateLifelineDisplay() {
  debugLog(`Updating lifeline display. Current lifelines: ${lifelines}`);
  
  // Call the KeyboardController's method to update its display
  if (KeyboardController && typeof KeyboardController.updateLifelineDisplay === 'function') {
    KeyboardController.updateLifelineDisplay(lifelines);
  }

  // Keep updating the original button only if it exists (for non-keyboard scenario, though unlikely now)
  const originalLifelineButton = document.getElementById("lifelineButton");
  const originalLifelineNumber = document.getElementById("lifelineButtonNumber");
  if (originalLifelineButton && originalLifelineNumber) {
      // Apply styling similar to keyboard button if needed
      if (lifelines === 1) {
         originalLifelineButton.classList.add("btn-danger");
      } else {
         originalLifelineButton.classList.remove("btn-danger");
      }
      if (lifelines <= 0) {
          var lifelineIcon = originalLifelineButton.querySelector("i");
          if (lifelineIcon) {
              lifelineIcon.classList.remove("fa-heart");
              lifelineIcon.classList.add("fa-heart-crack");
          }
          originalLifelineNumber.innerText = ''; // Set to empty string instead of hiding
          // Keep button clickable but with visual indication
          originalLifelineButton.style.cursor = "pointer";
          originalLifelineButton.style.pointerEvents = "auto";
          originalLifelineButton.removeAttribute("aria-disabled");
          // Keep button enabled but styled differently
          originalLifelineButton.classList.remove("disabled");
      } else {
          // Ensure icon is normal heart and number is visible if lifelines > 0
          var lifelineIcon = originalLifelineButton.querySelector("i");
          if (lifelineIcon) {
              lifelineIcon.classList.remove("fa-heart-crack");
              lifelineIcon.classList.add("fa-heart");
          }
          originalLifelineNumber.innerText = lifelines; // Set lifeline number for counts > 0
      }
  }
}

// **************** Song Data Functions ****************
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

// **************** High-Level Main Game Functions ****************
function startGame(songData) { // Loads main game with song lyrics to guess
  debugLog("Starting new game");
  var lyricsGridContainer = document.getElementById("lyricsGrid"); // Get the lyricsGrid div

  // Clear/Reset Divs from Previous Song
  lyricsGridContainer.innerHTML = "";
  document.getElementById("songTitleName").innerHTML = "";
  document.getElementById("songTitleArtist").innerHTML = "";
  // Don't clear oskbRow1Col1 here, KeyboardController manages it
  // document.getElementById("oskbRow1Col1").innerHTML = "";

  // If statsButton exists, remove it
  var statsButton = document.getElementById("statsButton");
  if (statsButton) {
    statsButton.remove();
  }

  Stats.resetStats();
  lifelines = startingLifelines;
  KeyboardController.setActiveInput(null); // Reset active input in controller

  // construct a new Song object using the songData object
  var song = constructSongObject(songData.title, songData.artist, songData.preview_url, songData.chorus);

  Stats.setWordsToGuess(song.lyrics.filter(lyric => lyric.toGuess).length);

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
  // Note to AI: Do not modify these 2 lines below. AI has a tendency to want to mess with this for some reason
  var howToPlayObjectiveText = document.getElementById("objectiveText");
  howToPlayObjectiveText.innerHTML = "Guess the lyrics to today's song, <b>" + song.title + "</b> by <b>" + song.artist + "</b>!";

  // Save current song in a global variable for keyboard access
  window.currentSong = song;
  
  // CRITICAL: Update KeyboardController internal song reference directly
  // This is important for lifeline functionality
  if (typeof KeyboardController !== 'undefined') {
    // Using internal variable approach (not recommended but keeping with existing pattern)
    if (window.KeyboardController) window.KeyboardController._songRef = song;
    
    // Use the actual module reference
    try {
      debugLog("Directly updating KeyboardController._songRef");
      KeyboardController._songRef = song;
    } catch (e) {
      debugLog("Error updating KeyboardController song reference: " + e.message);
    }
  }

  // construct the lyric input boxes to start the game
  constructLyricInputBoxes(song, lyricsGridContainer);

  // Construct the custom keyboard via the controller
  // Pass the initial number of lifelines for the display
  KeyboardController.construct(lifelines);

  // Check one more time that song reference is set in KeyboardController
  if (!KeyboardController._songRef) {
    debugLog("WARNING: KeyboardController._songRef is still not set after construct. Setting it one more time.");
    KeyboardController._songRef = song;
  }

  Stopwatch.reset();

  // Set the audio source using AudioController
  AudioController.setSource(song.preview);
}

function completeGame(song) {
  Stopwatch.stop();
  const elapsedTime = (Stopwatch.endTime - Stopwatch.startTime) / 1000; // Use properties
  debugLog(`GAME DEBUG: completeGame called. Elapsed time: ${elapsedTime.toFixed(2)}s`);

  // Try to play the audio automatically when game completes using AudioController
  debugLog(`GAME DEBUG: Checking audio state before playing preview. AudioController.isMuted(): ${AudioController.isMuted()}`);
  if (!AudioController.isMuted()) {
      debugLog("GAME DEBUG: AudioController is NOT muted. Attempting to play preview.");
      // Small delay before playing to ensure other UI updates/state changes settle
      setTimeout(() => {
          debugLog("GAME DEBUG: Inside setTimeout for playPreview. Calling AudioController.playPreview().");
          AudioController.playPreview();
          debugLog("GAME DEBUG: After calling AudioController.playPreview().");
      }, 100);
  } else {
      debugLog("GAME DEBUG: AudioController IS muted. Skipping playPreview.");
  }

  // Disable the keyboard lifeline button via the controller
  KeyboardController.disableLifelineButton();

  var allCorrect = Stats.wordsCorrect === Stats.wordsToGuess; // Use Stats properties
  if (allCorrect) {
    // Do Nothing
  } else {
    // populate every incorrect input box with the correct word
    for (var i = 0; i < song.lyrics.length; i++) {
      var input = document.getElementById("lyricInput" + i);
      if (input && !input.classList.contains("lyricle-lyrics-input-correct")) { // Check parent too
        input.innerHTML = song.lyrics[i].content;
        input.parentElement.classList.add("lyricle-lyrics-input-noguess"); // Use noguess style for revealed
        setLyricBoxBorderBottomStyle(input, {
          width: 4,
          color1: 255,
          color2: 255,
          color3: 255,
          opacity: 0.001
        });
        input.disabled = true; // Disable revealed inputs
        input.contentEditable = false;
      }
    }
  }

  constructGameCompleteModal(song, elapsedTime); // Pass elapsedTime
}

function concede(song) {
  try {
    // Stop the stopwatch if it's running
    Stopwatch.stop();
    const elapsedTime = Stopwatch.endTime ? (Stopwatch.endTime - Stopwatch.startTime) / 1000 : 0; // Use properties
    debugLog(`GAME DEBUG: concede called. Elapsed time: ${elapsedTime.toFixed(2)}s`);
    
    // Try to play the audio automatically, similar to completeGame, using AudioController
    debugLog(`GAME DEBUG: Checking audio state before playing preview on concede. AudioController.isMuted(): ${AudioController.isMuted()}`);
    if (!AudioController.isMuted()) {
        debugLog("GAME DEBUG: AudioController is NOT muted on concede. Attempting to play preview.");
        // Small delay before playing
        setTimeout(() => {
          try {
            debugLog("GAME DEBUG: Inside setTimeout for playPreview on concede. Calling AudioController.playPreview().");
            AudioController.playPreview();
            debugLog("GAME DEBUG: After calling AudioController.playPreview() on concede.");
          } catch (audioError) {
            debugLog("GAME DEBUG: Error playing audio preview on concede: " + audioError.message);
          }
        }, 100);
    } else {
        debugLog("GAME DEBUG: AudioController IS muted on concede. Skipping playPreview.");
    }
    
    // Disable the keyboard lifeline button via the controller
    try {
      KeyboardController.disableLifelineButton();
    } catch (keyboardError) {
      debugLog("GAME DEBUG: Error disabling keyboard lifeline button: " + keyboardError.message);
    }

    // Reveal all lyrics
    for (var i = 0; i < song.lyrics.length; i++) {
      try {
        var input = document.getElementById("lyricInput" + i);
        // Ensure input exists and isn't already correct (check parent class too)
        if (input && !input.classList.contains("lyricle-lyrics-input-correct") && !input.parentElement.classList.contains("lyricle-lyrics-input-correct")) {
          input.innerHTML = song.lyrics[i].content;
          input.parentElement.classList.add("lyricle-lyrics-input-noguess"); // Use noguess style
          setLyricBoxBorderBottomStyle(input, {
            width: 4,
            color1: 255,
            color2: 255,
            color3: 255,
            opacity: 0.001
          });
          input.disabled = true;
          input.contentEditable = false;
        }
      } catch (lyricError) {
        debugLog("GAME DEBUG: Error revealing lyric at index " + i + ": " + lyricError.message);
      }
    }
    
    // Show the game complete modal
    constructGameCompleteModal(song, elapsedTime); // Pass elapsedTime
  } catch (error) {
    debugLog("GAME DEBUG: Critical error in concede function: " + error.message);
    // Failsafe - try to show game complete modal even if other parts fail
    try {
      constructGameCompleteModal(song, 0);
    } catch (modalError) {
      debugLog("GAME DEBUG: Failed to show game complete modal: " + modalError.message);
      alert("Game completed, but there was an error displaying the results.");
    }
  }
}

// Update init function to handle both desktop and mobile correctly and init KeyboardController
function init() {
  var songData; // Declare songData here
  // Dark Mode Implementation
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    let darkmode = true;
  }
  
  // Detect if user is on mobile
  const isMobile = isMobileDevice();
  debugLog("Device detection: " + (isMobile ? "Mobile device" : "Desktop device"));
  
  // Initialize AudioController
  AudioController.init();

  // Make sure KeyboardController is accessible
  if (!KeyboardController) {
    debugLog("ERROR: KeyboardController module not properly loaded!");
  } else {
    debugLog("KeyboardController module is available");
  }

  // Create comprehensive callbacks for KeyboardController
  const keyboardCallbacks = {
      // Create a wrapper for useLifeline that provides all necessary context
      useLifeline: (song, button) => {
          debugLog("Using lifeline via keyboard callback with song: " + song.title);
          // Call the imported useLifeline with all needed callbacks
          useLifeline(song, button, {
              getLifelines: () => lifelines,
              getStartingLifelines: () => startingLifelines,
              decrementLifelines: () => { 
                debugLog(`Decrementing lifelines from ${lifelines} to ${lifelines-1}`);
                lifelines--; 
              },
              displayConcedeModal: displayConcedeModal,
              isStopwatchStarted: () => Stopwatch.startTime !== null,
              startStopwatch: () => Stopwatch.start(),
              incrementInputCounter: () => Stats.incrementInputCounter(),
              updateLifelineDisplay: updateLifelineDisplay,
              getPercentageCorrect: getPercentageCorrect,
              isActiveInput: (input) => KeyboardController.activeInputElement === input,
              setLyricBoxBorderBottomStyle: setLyricBoxBorderBottomStyle,
              checkCorrectness: checkCorrectness
          });
      },
      checkCorrectness: checkCorrectness,
      selectNextInput: selectNextInput,
      focusFirstUnfilledLyric: focusFirstUnfilledLyric,
      updateLifelineDisplay: updateLifelineDisplay,
      isGameComplete: () => !!Stopwatch.endTime
  };
  
  // Initialize the KeyboardController
  try {
    debugLog("Initializing KeyboardController with callbacks");
    KeyboardController.init(keyboardCallbacks, window.currentSong, Stats);
    debugLog("KeyboardController initialized successfully");
  } catch (e) {
    debugLog("ERROR initializing KeyboardController: " + e.message);
  }

  // Get day int and load song data
  var day;
  day = getDayInt();

  // Load song data and start game
  getAllSongData().then(() => {
    debugLog("Song data loaded, starting game...");
    songData = allSongData[day]; // Get the song data for the day
    
    // if songData is null (because today's int is higher than the length of allSongData), select an object at a random integer index from allSongData
    if (songData == null) {
      songData = allSongData[Math.floor(Math.random() * allSongData.length)];
    }

    // Start the game with the selected song
    startGame(songData);
    
    // Add the random button
    constructRandomButton();
    
    // Show the how to play modal
    displayHowToPlayModal();

    // Final check to ensure KeyboardController has the correct song reference
    debugLog("Final check of KeyboardController._songRef");
    if (KeyboardController._songRef !== window.currentSong) {
      debugLog("WARNING: KeyboardController._songRef mismatch - fixing");
      KeyboardController._songRef = window.currentSong;
    }

    // Ensure layout adjustment happens *after* keyboard is likely constructed by startGame
    setTimeout(() => {
      adjustLyricContentPosition();
    }, 250); // Slightly longer delay
  });

  // Add event listeners previously in HTML
  const mainMuteButton = document.getElementById('muteButton');
  if (mainMuteButton) {
      mainMuteButton.addEventListener('click', toggleMuteSongPreview);
      debugLog("GAME DEBUG: Added click listener to main muteButton."); // Log listener addition
  } else {
      debugLog("GAME DEBUG: ERROR - Main muteButton not found during init.");
  }
  
  const howToPlayModalElement = document.getElementById('howToPlay');
  const playButton = howToPlayModalElement.querySelector('.modal-footer .btn-primary');
  if (playButton) { // Ensure playButton exists
      playButton.addEventListener('click', () => {
        if (window.debugLog) window.debugLog('Play button clicked in How To Play modal');
        focusFirstUnfilledLyric();
      });
  } else {
      debugLog("ERROR: Play button not found in How To Play modal.");
  }
}

window.onload = function() {
  // First ensure the KeyboardController is available
  if (typeof KeyboardController === 'undefined') {
    console.error("KeyboardController not found - attempting to load it dynamically");
    
    // Create a safety fallback for KeyboardController
    window.KeyboardController = window.KeyboardController || {
      init: () => console.log("Using fallback KeyboardController.init"),
      construct: () => console.log("Using fallback KeyboardController.construct"),
      setActiveInput: () => {},
      updateLifelineDisplay: () => {},
      isEnabled: () => true,
      _songRef: null
    };
  }
  
  // Call the regular init function
  init();
  
  // Add a safety timeout to ensure keyboard is constructed
  setTimeout(() => {
    const oskb = document.getElementById('oskb');
    if (oskb) {
      const row1 = document.getElementById('oskbRow1Col1');
      const row2 = document.getElementById('oskbRow2Col1');
      const row3 = document.getElementById('oskbRow3Col1');
      
      // If any row is empty, reconstruct the keyboard
      if (!row1.children.length || !row2.children.length || !row3.children.length) {
        console.log("Keyboard rows empty - reconstructing keyboard");
        KeyboardController.construct(window.lifelines || 3);
      }
    }
  }, 1000);
};