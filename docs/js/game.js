// game.js

// Global Variables
var wordsCorrect = 0; // initialize wordsCorrect score to 0, make variable global so it can be accessed by all functions
var wordsToGuess = 0; // total number of words to have to guess correctly, used to determine if game is complete
var lastLine = 0; // initialize lastLine to 0, make variable global so it can be accessed by all functions
var startingLifelines = 3; // initialize starting lifelines to 3, make variable global so it can be accessed by all functions
var lifelines = 0;
var focusedBoxIndex = 0;
var inputCounter = 0;
var audio;
var audioLoaded = false;
var terminateAudio = false;
var debugMode = true; // Enable debug logging

var allowedKeys = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight"]; // array to store sanitized input for comparison

// Populate the array with standard lowercase english characters
var allowedCharacters = [];
for (var i = 97; i <= 122; i++) {
  allowedCharacters.push(String.fromCharCode(i));
}
allowedCharacters.push("'"); // Allow apostrophes although they will be filtered out in the comparison

// ... What does 'let' do differently from 'var' again?
let startTime, endTime, interval; // stopwatch variables

// Class Constructors
// Construct the Lyric class
class Lyric {
  constructor(boxIndex, lineIndex, content, contentComparable, toGuess, spaceLeft, spaceRight, isSpecial) {
    this.boxIndex = boxIndex; // index of the lyric box, either word or puntuation
    this.lineIndex = lineIndex; // index of the which line (or row) the lyric box is in
    this.content = content; // the original content of the lyric
    this.contentComparable = contentComparable; // the content of the lyric in a format that can be compared
    this.toGuess = toGuess; // boolean value indicating whether the word should be guessed or not
    this.spaceLeft = spaceLeft; // boolean value indicating whether there is a space to the left of the word (for displaying punctuation well)
    this.spaceRight = spaceRight; // boolean value indicating whether there is a space to the right of the word (for displaying punctuation well)
    this.isSpecial = isSpecial; // boolean value indicating whether the word is a special character (punctuation, etc.)
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
  // Define the maximum number of lines to display in the game
  var maxLines = 6; // This actually results in 5 lines due to how the logic is written with indices

  // Define the maximum number of characters to display in the game
  var maxChars = 120;

  var lineCount = 0;
  var charCount = 0;

  // Split the chorus into lines (split by newline)
  var lines = chorus.split("\n");

  // Initialize an empty array to store the lyric objects
  var lyrics = [];

  // Set boxIndex to 0
  var boxIndex = 0;

  // Loop through each line
  for (var i = 0; i < lines.length; i++) {
    lineCount++;

    // If we've reached the maximum number of lines, break out of the loop
    if (lineCount >= maxLines) {
      break;
    }

    // If we've reached the maximum number of characters, break out of the loop
    if (charCount >= maxChars) {
      break;
    }

    var lineCharacterCountNoSpaces = lines[i].replace(/\s/g, '');

    // If the current character count plus the total combined length of all the words in the current line is greater than the maximum number of allowed characters, break out of the loop
    if (charCount + lineCharacterCountNoSpaces.length >= maxChars) {
      break;
    }

    // Split the line by spaces
    var splitBySpaces = lines[i].split(" ");

    // Initialize an array to store "preformatWords"
    var preformatWords = [];

    // Loop through each string in splitBySpaces
    for (var j = 0; j < splitBySpaces.length; j++) {
      var word = splitBySpaces[j];
      var spaceLeft = false;
      var spaceRight = false;
      var isSpecial = false;

      // If the word starts with a special character, add ::SPACELEFT:: to the start of the string
      if (/^[^a-zA-Z0-9\s\u00C0-\u017F'*]/.test(word)) {
      spaceLeft = true;
      }

      // If the word ends with a special character, add ::SPACERIGHT:: to the end of the string
      if (/[^a-zA-Z0-9\s\u00C0-\u017F'*]$/.test(word)) {
      spaceRight = true;
      }

      // Split the word by special characters except ::SPACELEFT:: and ::SPACERIGHT::
      var splitWords = word.split(/([^a-zA-Z0-9\s\u00C0-\u017F'*])/).filter(Boolean);

      // Add the split words to the preformatWords array
      preformatWords = preformatWords.concat(splitWords.map((splitWord) => {
        // If the splitWord is a special character, set isSpecial to true
        if (/^[^a-zA-Z0-9\s\u00C0-\u017F'*]/.test(splitWord)) {
          isSpecial = true;
        }
      return {
        word: splitWord,
        spaceLeft: spaceLeft,
        spaceRight: spaceRight,
        isSpecial: isSpecial
      };
      }));
    }

    // Loop through each word
    for (var j = 0; j < preformatWords.length; j++) {

      // Increment the charCount by the length of the word
      charCount += preformatWords[j].word.length;

      // Run RegExes against the word to make it comparable (plus strip out spaces)
      var word = preformatWords[j].word
        .toLowerCase() // make all letters lowercase
        .normalize("NFD") // decompose letters and diatrics
        .replace(/\p{Diacritic}/gu, '') // replace them with non-accented characters
        .replace(/'/g, '') // replace apostrophes with nothing
        .replace(/\s/g, ''); // remove spaces

      // Set toGuess
      var toGuess = /^[a-zA-Z]+$/.test(word) ? true : false;

      // If the line index is 0, set toGuess to false always
      if (i === 0) {
        toGuess = false;
      }

      // Construct a Lyric object with the boxIndex, lineIndex, content, contentComparable, toGuess, spaceLeft, and spaceRight
      var lyric = new Lyric(boxIndex, i, preformatWords[j].word, word, toGuess, preformatWords[j].spaceLeft, preformatWords[j].spaceRight, preformatWords[j].isSpecial);

      // Add the Lyric object to the lyrics array
      lyrics.push(lyric);

      // Increment the boxIndex
      boxIndex++;
    }
  }

  // Outputs: An array of Lyric objects
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
  var widthBuffer = 6;

  // Create a div
  var div = document.createElement("div");

  // Hide the div so it's not displayed and doesn't interfere with the page layout
  div.style.visibility = "hidden";

  // Set the font size to the same as the lyric boxes
  div.style.fontSize = "min(1.3em, 60px)";

  // Set its width to max-content, something not available in an input element
  div.style.width = "max-content";

  // Set the inner Text value to the lyric content
  div.innerText = lyricContent;

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

      // If the word is a special character, add the lyricle-lyrics-div-special class
      if (lyricsToDisplay[i].isSpecial) {
        div.classList.add("lyricle-lyrics-div-special");

        // If the word has a space to the left, add the lyricle-lyrics-div-space-left class
        if (lyricsToDisplay[i].spaceLeft) {
          div.classList.add("lyricle-lyrics-div-space-left");
        }

        // If the word has a space to the right, add the lyricle-lyrics-div-space-right class
        if (lyricsToDisplay[i].spaceRight) {
          div.classList.add("lyricle-lyrics-div-space-right");
        }
      }

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
        lyricBoxFocusListener(input, song);
      });

      // If the word is not to be guessed, populate the input box with the word and disable it
      if (!lyricsToDisplay[i].toGuess) {
        input.innerText = lyricsToDisplay[i].content;
        div.classList.add("lyricle-lyrics-input-noguess");
        // Keep border bottom but make opacity very low for spacing purposes
        div.style.borderBottom = "4px solid rgba(255, 255, 255, 0.001)";
        input.disabled = true;
        input.contentEditable = false;
      }
      else {
        div.style.borderBottom = "4px solid rgba(255, 255, 255, 0.99)";
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

// Debug logging function
function debugLog(message) {
  if (debugMode) {
    console.log("AUDIO DEBUG: " + message);
  }
}

// Add a new function for explicit user-triggered playback
function playAudioWithUserInteraction() {
  debugLog("playAudioWithUserInteraction called - muted: " + (audio?.muted || 'no audio') + ", game completed: " + (endTime ? 'yes' : 'no'));
  if (!audio || audio.muted) return;
  
  // Set volume directly - no fading on iOS
  audio.volume = 0.2;
  debugLog("Setting volume to 0.2");

  // Ensure playback position is at beginning only if currentTime is 0 or near the end
  // This allows resuming from where it was paused
  if (audio.currentTime === 0 || audio.currentTime >= audio.duration - 1) {
    audio.currentTime = 0;
    debugLog("Reset currentTime to beginning for clean playback");
  } else if (audio.paused) {
    debugLog("Resuming from position: " + audio.currentTime.toFixed(2) + "s");
  }
  
  // Play with error handling for iOS
  try {
    debugLog("Attempting to play audio");
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        debugLog("Audio playback started successfully");
      }).catch(error => {
        debugLog("Playback error: " + error);
        // Update UI to indicate playback failed
        var muteButton = document.getElementById("muteButtonIcon");
        if (muteButton) {
          muteButton.className = "fa-solid fa-volume-xmark";
        }
      });
    }
  } catch (e) {
    debugLog("Exception during playback: " + e);
  }
}

function toggleMuteSongPreview() {
  debugLog("toggleMuteSongPreview called");
  var muteButton = document.getElementById("muteButtonIcon"); // Get the Mute button by id
  
  // Important: This is a direct user interaction, the perfect time to play on iOS
  if (muteButton.className === "fas fa-volume-up") { // If the button currently shows that volume is on
    // User wants to mute
    debugLog("User muting audio, current position: " + audio.currentTime.toFixed(2) + "s");
    audio.pause();
    audio.muted = true;
    muteButton.className = "fa-solid fa-volume-xmark"; // change icon to show that volume is off
  } else if (muteButton.className === "fa-solid fa-volume-xmark") { // if the icon indicates audio is muted
    // User wants to unmute 
    debugLog("User unmuting audio, endTime: " + (endTime ? 'set' : 'not set'));
    audio.muted = false;
    
    // Only play audio if the game is completed (endTime is set)
    if (endTime) {
      // This is the perfect time to play on iOS - direct user interaction
      debugLog("Game completed, attempting playback from position: " + audio.currentTime.toFixed(2) + "s");
      playAudioWithUserInteraction();
    } else {
      debugLog("Game not completed, not playing audio despite unmute");
    }
    
    muteButton.className = "fas fa-volume-up"; // change icon back to show that volume is on
  }

  // Get the mute button in the modal footer if it exists
  var muteButton2 = document.getElementById("muteButtonIcon2");
  if (muteButton2) {
    // Set the className to be the same as the original muteButton
    muteButton2.className = muteButton.className;
    debugLog("Synced muteButton2 icon state");
  }
}

function constructGameCompleteModal(song) {
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
    if (!audio.muted && endTime) {
      debugLog("Modal: Playing audio after user interaction from position: " + audio.currentTime.toFixed(2) + "s");
      playAudioWithUserInteraction();
    } else {
      debugLog("Modal: Not playing audio - muted: " + audio.muted + ", game completed: " + (endTime ? "yes" : "no"));
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

// Button Functions
function getRandomSong() {
  // Select a random song from the song data and start the game
  var seed = Math.floor(Math.random() * allSongData.length)
  var songData = allSongData[seed];

  // Stop any currently-playing audio
  if (audio.currentTime > 0) {
    stopSongPreview();
  }

  // To play a specific song:
  // Get its index: console.log(allSongData.findIndex(song => song.title === "Song Title"));
  // Set the songData variable: var songData = allSongData[index];
  // Start the game: startGame(songData);
  startGame(songData);
}

// Listeners
function lyricBoxKeyDownListener(event, song) {
  // If the key or character isn't allowed, prevent the default action of the event and end the function
  if (!allowedKeys.includes(event.key) && !allowedCharacters.includes((event.key).toLowerCase())) {
    event.preventDefault();
    return;
  }

  // If the lyricBox is already at the max length and the key pressed is not in allowedKeys, prevent the default action of the event and end the function
  let inputAtMax = event.srcElement.innerText.length >= song.lyrics[focusedBoxIndex].content.length;
  if (inputAtMax && !allowedKeys.includes(event.key)) {
    event.preventDefault();
    return;
  }
}

function lyricBoxInputListener(song) {
  // If the stopwatch hasn't been started, start it
  if (!startTime) {
    startStopwatch();
    debugLog("First user interaction, attempting to unlock audio");
    
    // First user interaction - perfect time to "unlock" audio on iOS
    // This creates a user gesture chain that iOS can use later
    if (audio) {
      // Touch the audio element without actually playing
      // This helps "unlock" the audio context on iOS
      debugLog("Setting audio parameters for iOS unlock");
      audio.volume = 0;
      audio.muted = true;
      audio.currentTime = 0; // Ensure we're at the beginning
      
      try {
        // Create a silent version to unlock audio
        debugLog("Creating silent audio element for unlock");
        const silentAudio = new Audio();
        silentAudio.volume = 0;
        silentAudio.muted = true;
        // Use a brief silence instead of the actual song
        debugLog("Playing silent audio to unlock");
        const touchPromise = silentAudio.play();
        if (touchPromise !== undefined) {
          touchPromise.then(() => {
            // Success - audio context is unlocked
            debugLog("Silent audio played successfully, pausing");
            silentAudio.pause();
          }).catch(e => {
            // Silently fail - we'll try again at completion
            debugLog("Initial audio touch failed: " + e);
          });
        }
      } catch (e) {
        debugLog("Error creating silent audio: " + e);
      }
    }
  }

  // Increment the input counter
  inputCounter++;

  // Get lyricBox element using activeElement
  var lyricBox = document.activeElement;

  // If the input value is greater than the length of the secret word, don't allow any more characters
  checkCorrectness(lyricBox, song);
}

function lyricBoxFocusListener (input, song) {
  // Update the style of the previously-focused input box to signify that it is no longer focused
  var previouslyFocusedInput = document.getElementById("lyricInput" + focusedBoxIndex);

  // If the previouslyFocusedInput exists and is not marked as correct or noguess
  if (previouslyFocusedInput && !previouslyFocusedInput.parentElement.classList.contains("lyricle-lyrics-input-noguess") && !previouslyFocusedInput.parentElement.classList.contains("lyricle-lyrics-input-correct")) {
    // Calculate the correct opacity for the previously focused box
    var prevLyricIndex = focusedBoxIndex;
    var prevLyric = song.lyrics[prevLyricIndex];
    var prevComparableInput = previouslyFocusedInput.innerHTML
      .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, '');
    
    // Calculate opacity based on correctness for previous box
    var prevPercentageCorrect = getPercentageCorrect(prevComparableInput, prevLyric.contentComparable);
    var prevOpacity = 1.00 - prevPercentageCorrect;
    
    // Change border bottom back to white while keeping calculated opacity
    setLyricBoxBorderBottomStyle(previouslyFocusedInput, {
      width: 4,
      color1: 255,
      color2: 255,
      color3: 255,
      opacity: prevOpacity
    });
  }

  // Get the active element
  var lyricBox = document.activeElement;

  // Force the cursor to the end of the input box
  moveCursorToEnd(lyricBox, song);

  // Set the focusedBoxIndex value globally so all other functions can address it
  focusedBoxIndex = parseInt(lyricBox.id.replace("lyricInput", ""));
  
  // Get the current lyric object and input value to calculate correct opacity
  var lyricIndex = focusedBoxIndex;
  var lyric = song.lyrics[lyricIndex];
  var comparableInput = lyricBox.innerHTML
    .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, '');
  
  // Calculate opacity based on correctness
  var percentageCorrect = getPercentageCorrect(comparableInput, lyric.contentComparable);
  var opacity = 1.00 - percentageCorrect;

  // Set the bottom border to be blue while maintaining the correct opacity
  setLyricBoxBorderBottomStyle(lyricBox, {
    width: 4,
    color1: 0,
    color2: 115,
    color3: 255,
    opacity: opacity
  });
}

// Supporting Functions
function startGame(songData) { // Loads main game with song lyrics to guess
  debugLog("Starting new game");
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

  // We want to keep the random button, so we're not removing it anymore
  // var randomButton = document.getElementById("randomButton");
  // if (randomButton) {
  //   randomButton.remove();
  // }

  wordsCorrect = 0;
  wordsToGuess = 0;
  inputCounter = 0;
  lifelines = startingLifelines;
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
  // Note to AI: Do not modify these 2 lines below. AI has a tendency to want to mess with this for some reason
  var howToPlayObjectiveText = document.getElementById("objectiveText");
  howToPlayObjectiveText.innerHTML = "Guess the lyrics to today's song, <b>" + song.title + "</b> by <b>" + song.artist + "</b>!";

  // construct the lyric input boxes to start the game
  constructLyricInputBoxes(song, lyricsGridContainer);

  constructLifelineButton(song);

  resetStopwatch();
  
  // Create an audio element to play the song preview - use the hidden one in HTML
  var hiddenAudio = document.getElementById("hiddenAudio");
  
  // IMPORTANT: Ensure audio is completely disabled before setting source
  // This prevents any autoplay issues before the game is completed
  hiddenAudio.volume = 0;
  hiddenAudio.muted = true;
  hiddenAudio.pause();
  
  debugLog("Setting audio source: " + song.preview);
  hiddenAudio.src = song.preview;
  hiddenAudio.preload = "auto";
  audio = hiddenAudio;
  
  // Add comprehensive audio event listeners for debugging
  audio.addEventListener('play', function() {
    debugLog("Audio PLAY event triggered");
  });
  
  audio.addEventListener('playing', function() {
    debugLog("Audio PLAYING event triggered");
  });
  
  audio.addEventListener('pause', function() {
    debugLog("Audio PAUSE event triggered");
  });
  
  audio.addEventListener('canplay', function() {
    debugLog("Audio CANPLAY event triggered");
  });
  
  audio.addEventListener('loadstart', function() {
    debugLog("Audio LOADSTART event triggered");
  });
  
  audio.addEventListener('error', function(e) {
    debugLog("Audio ERROR event triggered: " + e);
  });
  
  // Add event listener to track when audio is loaded
  audio.addEventListener('canplaythrough', function() {
    audioLoaded = true;
    debugLog("Audio loaded and ready to play");
    
    // Double-check it's still muted after loading
    if (!endTime) {
      audio.muted = true;
      audio.volume = 0;
      debugLog("Ensuring audio remains muted after loading (game not completed)");
    }
  });
  
  // Set initial muted state
  audio.muted = true;
  debugLog("Audio element initialized, muted: " + audio.muted);
}

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
  debugLog("playSongPreview called");
  // iOS requires user interaction to play audio
  if (!audioLoaded) {
    debugLog("Audio not loaded yet, waiting");
    // Wait for audio to load before attempting to play
    await new Promise(resolve => {
      if (audio.readyState >= 3) { // HAVE_FUTURE_DATA or higher
        audioLoaded = true;
        debugLog("Audio already loaded");
        resolve();
      } else {
        debugLog("Adding canplaythrough listener");
        audio.addEventListener('canplaythrough', function onCanPlay() {
          audioLoaded = true;
          audio.removeEventListener('canplaythrough', onCanPlay);
          debugLog("Audio loaded via canplaythrough event");
          resolve();
        });
      }
    });
  }

  // While the user has the audio muted, do nothing
  if (document.getElementById("muteButtonIcon").className === "fa-solid fa-volume-xmark") {
    debugLog("Audio is muted, not playing");
    return; // Don't try to play if muted
  }

  // Set a moderate volume that works well across devices
  audio.volume = 0.2;
  debugLog("Setting volume to 0.2");
  
  try {
    // iOS requires play() to be called directly from a user interaction
    debugLog("Attempting to play audio from playSongPreview");
    const playPromise = audio.play();
    
    // Handle the play promise to catch any errors
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        debugLog("Playback error from playSongPreview: " + error);
        // If autoplay fails, we'll rely on the user pressing the play button
      });
    }
  } catch (e) {
    debugLog("Exception during playback from playSongPreview: " + e);
  }
}

async function stopSongPreview() {
  debugLog("stopSongPreview called");
  terminateAudio = true;
  if (audio != null) {
    debugLog("Pausing audio");
    audio.pause();
    try {
      debugLog("Resetting currentTime to 0");
      audio.currentTime = 0;
    } catch (e) {
      debugLog("Error resetting audio: " + e);
    }
  }
  terminateAudio = false;
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
    wordsCorrect++;
    if (wordsCorrect === wordsToGuess) { // if the wordsCorrect score equals the number of words in the song
      completeGame(song); // call function that executes game completion code
    }
    selectNextInput(lyricBox, (lyricIndex)); // call function that selects the next lyricBox box - updated parameter
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
  debugLog("Game completed");

  // Try to play the audio automatically when game completes
  // The user has definitely interacted with the page by now
  debugLog("Checking mute status for autoplay on completion");
  var muteButton = document.getElementById("muteButtonIcon");
  if (muteButton.className !== "fa-solid fa-volume-xmark") {
    debugLog("Audio not muted, attempting to play on completion");
    muteButton.className = "fas fa-volume-up";
    
    // Enable audio and try to play it
    audio.muted = false;
    
    // Important: Set volume before trying to play
    audio.volume = 0.2;
    debugLog("Set volume to 0.2 for autoplay");
    
    // Small delay to ensure audio settings take effect
    setTimeout(function() {
      // Attempt to play - this should work on iOS since user has interacted with the page
      try {
        debugLog("Playing audio on game completion after delay");
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            debugLog("Autoplay on completion failed: " + error);
            // We won't change the UI here since the button already shows play is available
          });
        }
      } catch (e) {
        debugLog("Exception during autoplay on completion: " + e);
      }
    }, 100);
  } else {
    debugLog("Audio muted, not playing on completion");
  }

  // Disable lifeline button when game is completed
  var lifelineButton = document.getElementById("lifelineButton");
  if (lifelineButton) {
    lifelineButton.classList.add("disabled");
  }

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
        setLyricBoxBorderBottomStyle(input, {
          width: 4,
          color1: 255,
          color2: 255,
          color3: 255,
          opacity: 0.001
        });
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

function displayHowToPlayModal() {
  debugLog("Displaying How To Play modal");
  // Log audio state if it exists
  if (audio) {
    debugLog("Audio state: muted=" + audio.muted + ", paused=" + audio.paused + ", currentTime=" + audio.currentTime + ", src=" + (audio.src ? "set" : "not set"));
  } else {
    debugLog("Audio element not initialized yet");
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
    if (audio) {
      debugLog("Audio state after modal close: muted=" + audio.muted + ", paused=" + audio.paused);
    }
  });
}

function sanitizeInput(input) {
  // Sanitize the input to remove any special characters and diacritics for comparison
  var sanitizedInput = input
  .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "") // disallow any input that isn't a standard English letter or number
  .toLowerCase() // make all letters lowercase
  .normalize("NFD") // decompose letters and diatrics
  .replace(/\p{Diacritic}/gu, ''); // replace them with non-accented characters

  return sanitizedInput;
}

function init() { // Initialize the game
  //Dark Mode Implementation 
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Apply dark theme
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    let darkmode = true;
  }
  
  // Make debugMode available to window/global scope for the HTML script
  window.debugMode = debugMode;
  
  // Initialize audio state to prevent autoplay
  var hiddenAudio = document.getElementById("hiddenAudio");
  if (hiddenAudio) {
    debugLog("Initial audio setup");
    hiddenAudio.muted = true;
    hiddenAudio.volume = 0;
    hiddenAudio.pause();
    // Explicitly prevent any potential autoplay
    hiddenAudio.autoplay = false;
  }

  day = getDayInt(); // Get the integer value of the day of the year

  getAllSongData().then(() => {
    songData = allSongData[day]; // Get the song data for the day
    // if songData is null (because today's int is higher than the length of allSongData), select an object at a random integer index from allSongData
    if (songData == null) {
      songData = allSongData[Math.floor(Math.random() * allSongData.length)];
    }
    startGame(songData);
    //constructRandomButton(); // Add random button from the beginning
    displayHowToPlayModal();
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
    // Close the modal
    var concedeModalElement = document.getElementById("concedeModal");
    var concedeModalInstance = bootstrap.Modal.getInstance(concedeModalElement);
    concedeModalInstance.hide();
    
    // End the game
    concede(song);
  });
  modalFooter.appendChild(concedeButton);

  // Append the modal to the document body
  document.body.appendChild(modal);

  // Display the modal
  var modalElement = document.getElementById("concedeModal");
  var modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

function concede(song) {
  // Stop the stopwatch if it's running
  stopStopwatch();
  debugLog("Game conceded");
  
  // Try to play the audio automatically, similar to completeGame
  var muteButton = document.getElementById("muteButtonIcon");
  if (muteButton.className !== "fa-solid fa-volume-xmark") {
    debugLog("Audio not muted, attempting to play on concede");
    muteButton.className = "fas fa-volume-up";
    
    // Enable audio and try to play it
    audio.muted = false;
    
    // Important: Set volume before trying to play
    audio.volume = 0.2;
    debugLog("Set volume to 0.2 for autoplay on concede");
    
    // Small delay to ensure audio settings take effect
    setTimeout(function() {
      // Attempt to play - this should work on iOS since user has interacted with the page
      try {
        debugLog("Playing audio on concede after delay");
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            debugLog("Autoplay on concede failed: " + error);
          });
        }
      } catch (e) {
        debugLog("Exception during autoplay on concede: " + e);
      }
    }, 100);
  } else {
    debugLog("Audio muted, not playing on concede");
  }
  
  // Disable the lifeline button
  var lifelineButton = document.getElementById("lifelineButton");
  if (lifelineButton) {
    lifelineButton.classList.add("disabled");
  }

  // Reveal all lyrics
  for (var i = 0; i < song.lyrics.length; i++) {
    var input = document.getElementById("lyricInput" + i);
    if (input && !input.classList.contains("lyricle-lyrics-input-correct")) {
      input.innerHTML = song.lyrics[i].content;
      input.parentElement.classList.add("lyricle-lyrics-input-noguess");
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
  }
  
  // Show the game complete modal
  constructGameCompleteModal(song);
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
  // If lifelines is 0, show concede modal
  if (lifelines === 0) {
    displayConcedeModal(song);
    return;
  }

  // Update the lifelines remaining text
  // Get the lifelineButtonNumber element
  var lifelineButtonNumber = document.getElementById("lifelineButtonNumber");

  // Set the innerText to the number of lifelines remaining
  lifelineButtonNumber.innerText = (lifelines - 1);

  // If the stopwatch hasn't been started, start it
  if (!startTime) {
    startStopwatch();
  }

  lifelines--; // Decrement the lifelines remaining

  if (lifelines >= 0) {
    // Populate the nth character of the secret lyric for every incomplete lyric box
    // nth being calculated by how many lifelines remaining. 1st lifeline reveals 1st character, 2nd lifeline reveals 2nd character, etc.

    // Start a for loop from 0 to the length of the lyrics array
    for (var i = 0; i < song.lyrics.length; i++) {
      // Get the lyricInput element
      var lyricInput = document.getElementById("lyricInput" + i);

      // If the lyricInput element exists, is a span, and is still enabled
      if (lyricInput.contentEditable === "true") {
        // Set the innerText of the lyricInput element to the nth character of the secret lyric

        // Don't give another letter if the length of the lyric is so short that it would reveal the entire lyric
        if (song.lyrics[i].content.length <= (startingLifelines - lifelines)) {
          continue;
        }

        // Build the string to populate based on the number of lifelines used/remaining
        // If this is the 2nd lifeline used, populate the first 2 characters of the secret lyric
        // Create a loop that runs from (startingLifelines - lifelines) down to 0 to determine how many characters to give
        var stringToPopulate = ""; // Initialize the string to populate

        // Create a loop that runs from 0 to (startingLifelines - lifelines) to determine how many characters to give
        for (var j = 0; j < startingLifelines - lifelines; j++) {
          stringToPopulate += song.lyrics[i].content.charAt(j);
        }

        lyricInput.innerText = stringToPopulate;

        // Update the Opacity of the lyricInput
        checkCorrectness(lyricInput, song);
      }
    }
  }

  if(lifelines === 1) {
    button.classList.add("btn-danger");
  }

  if (lifelines === 0) {
    button.classList.remove("btn-danger");
    // Keep button clickable, don't add disabled class
    
    // Change heart icon to broken heart when lifelines reach zero
    var lifelineIcon = button.querySelector("i");
    if (lifelineIcon) {
      lifelineIcon.classList.remove("fa-heart");
      lifelineIcon.classList.add("fa-heart-crack");
    }
    
    // Remove the lifeline number since the cracked heart already indicates no lifelines
    var lifelineNumber = document.getElementById("lifelineButtonNumber");
    if (lifelineNumber) {
      lifelineNumber.style.display = "none";
    }
  }
}

window.onload = init; // upon loading the page, initialize the game