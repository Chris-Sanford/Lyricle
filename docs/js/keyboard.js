import { debugLog } from './debug.js';
import { isMobileDevice } from './helpers.js';

// Store callbacks provided by game.js during initialization
let _callbacks = {};
let _songRef = null; // Reference to the current song object
let _statsRef = null; // Reference to the Stats object

const KeyboardController = {
  activeInputElement: null,
  focusedBoxIndex: null,
  customKeyboardEnabled: true, // Default, can be configured

  // Method to initialize the controller with necessary callbacks and references from game.js
  init(callbacks, songRef, statsRef) {
    debugLog("KeyboardController initializing...");
    _callbacks = callbacks; // Store { useLifeline, checkCorrectness, selectNextInput, focusFirstUnfilledLyric, updateLifelineDisplay, getLifelines }
    _songRef = songRef; // Store reference to the song object managed by game.js
    _statsRef = statsRef; // Store reference to the Stats object managed by game.js

    // Add event listener to prevent native keyboard on mobile
    document.addEventListener('focusin', this.preventNativeKeyboard.bind(this));

    debugLog("KeyboardController initialized.");
  },

  // Method to construct the keyboard UI
  construct(initialLifelines) {
    debugLog("KeyboardController constructing keyboard UI...");

    // First row (QWERTYUIOP)
    const row1Keys = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
    const row1Container = document.getElementById("oskbRow1Col1");
    if (!row1Container) {
        debugLog("ERROR: oskbRow1Col1 not found!");
        return;
    }
    row1Container.innerHTML = ""; // Clear previous content

    row1Keys.forEach(key => {
      const keyButton = this._createKeyButton(key, key);
      row1Container.appendChild(keyButton);
    });

    // Second row (ASDFGHJKL)
    const row2Keys = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
    const row2Container = document.getElementById("oskbRow2Col1");
     if (!row2Container) {
        debugLog("ERROR: oskbRow2Col1 not found!");
        return;
    }
    row2Container.innerHTML = ""; // Clear previous content

    row2Keys.forEach(key => {
      const keyButton = this._createKeyButton(key, key);
      row2Container.appendChild(keyButton);
    });

    // Third row (Lifeline + ZXCVBNM + Backspace)
    const row3Container = document.getElementById("oskbRow3Col1");
     if (!row3Container) {
        debugLog("ERROR: oskbRow3Col1 not found!");
        return;
    }
    row3Container.innerHTML = ""; // Clear previous content

    // Add Lifeline button
    const lifelineKey = this._createLifelineButton(initialLifelines);
    row3Container.appendChild(lifelineKey);

    // Add letter keys
    const row3Keys = ["z", "x", "c", "v", "b", "n", "m"];
    row3Keys.forEach(key => {
      const keyButton = this._createKeyButton(key, key);
      row3Container.appendChild(keyButton);
    });

    // Add Backspace key
    const backspaceKey = this._createSpecialKey("Backspace", '<i class="fas fa-delete-left"></i>', ["special-key", "backspace-key"]);
    row3Container.appendChild(backspaceKey);

    // Make sure all rows are visible and layout is recalculated
    this._ensureKeyboardVisible();

    // Initial update of lifeline display based on game state
    this.updateLifelineDisplay(initialLifelines);

    debugLog("KeyboardController keyboard UI constructed.");
  },

  // Helper to create a standard key button
  _createKeyButton(key, text) {
    const keyButton = document.createElement("div");
    keyButton.className = "lyricle-key";
    keyButton.textContent = text;
    keyButton.dataset.key = key;
    keyButton.addEventListener("click", this.handleKeyPress.bind(this));
    return keyButton;
  },

   // Helper to create a special key button (like Backspace, Lifeline)
  _createSpecialKey(key, innerHTML, additionalClasses = []) {
    const keyButton = document.createElement("div");
    keyButton.className = "lyricle-key " + additionalClasses.join(" ");
    keyButton.innerHTML = innerHTML;
    keyButton.dataset.key = key;
    keyButton.addEventListener("click", this.handleKeyPress.bind(this));
    return keyButton;
  },

  // Helper to create the lifeline button
  _createLifelineButton(initialLifelines) {
    const lifelineKey = document.createElement("div");
    lifelineKey.className = "lyricle-key special-key wide-key lyricle-keyboard-lifeline";
    lifelineKey.id = "keyboardLifelineButton"; // Keep ID for styling/updates
    lifelineKey.dataset.key = "Lifeline";

    const heartIcon = document.createElement("i");
    heartIcon.className = "fas fa-heart"; // Initial icon
    lifelineKey.appendChild(heartIcon);

    const lifelineNumber = document.createElement("span");
    lifelineNumber.id = "keyboardLifelineNumber"; // Keep ID for updates
    lifelineNumber.className = "lyricle-keyboard-lifeline-number";
    lifelineNumber.innerText = initialLifelines;
    lifelineKey.appendChild(lifelineNumber);

    lifelineKey.addEventListener("click", () => {
      debugLog("Lifeline button clicked - checking if callback and song are available");
      
      // Get the song reference - try multiple approaches
      let song = _songRef;
      if (!song) {
        debugLog("No _songRef available, trying window.currentSong");
        song = window.currentSong;
      }
      
      // Only call lifeline callback if all requirements are met
      if (_callbacks && _callbacks.useLifeline && song) {
        debugLog("Lifeline requirements met - executing useLifeline callback");
        // Pass the song reference and button element for potential styling in the callback
        _callbacks.useLifeline(song, lifelineKey);
      } else {
        // Log detailed diagnostic info
        debugLog(`Keyboard lifeline button clicked but not all requirements met:
          - _callbacks exists: ${!!_callbacks}
          - useLifeline callback exists: ${_callbacks && !!_callbacks.useLifeline}
          - song reference exists: ${!!song}`);
      }
    });
    return lifelineKey;
  },

  // Force layout recalculation and ensure visibility
   _ensureKeyboardVisible() {
        const oskbElement = document.getElementById('oskb');
        if (oskbElement) {
            oskbElement.style.display = 'block'; // Ensure it's block

            // Force a reflow
            oskbElement.style.visibility = 'hidden'; // Hide temporarily
            oskbElement.style.opacity = '0';
            void oskbElement.offsetHeight; // Trigger reflow

            // Make sure all rows are explicitly flex
             const rows = oskbElement.querySelectorAll('.lyricle-oskb-row');
             rows.forEach(row => {
                 row.style.display = 'flex';
                 row.style.visibility = 'visible'; // Ensure rows are visible too
             });

            // Restore visibility and opacity smoothly
            oskbElement.style.visibility = 'visible';
            oskbElement.style.opacity = '1';

            debugLog("Keyboard visibility ensured, height: " + oskbElement.offsetHeight + "px");
        } else {
             debugLog("ERROR: OSKB container not found for visibility check.");
        }
    },


  // Handle key presses from the custom keyboard
  handleKeyPress(event) {
    const key = event.currentTarget.dataset.key;

    if (!this.activeInputElement) {
      debugLog("Keyboard key pressed, but no active input. Attempting focus.");
      if (_callbacks.focusFirstUnfilledLyric) {
        _callbacks.focusFirstUnfilledLyric(); // This should set activeInputElement via lyricBoxFocusListener
      }
      // If still no active input after attempt, bail
      if (!this.activeInputElement) {
          debugLog("Still no active input after focus attempt. Ignoring keypress.");
          return;
      }
       debugLog(`Active input set to: ${this.activeInputElement.id}`);
    }

    // Check if game is complete (using a callback or reference)
     if (_callbacks.isGameComplete && _callbacks.isGameComplete()) {
        debugLog("Key press ignored: Game is complete.");
        return;
    }

    // Increment input counter via callback
    if (_statsRef && _statsRef.incrementInputCounter) {
        _statsRef.incrementInputCounter();
    } else {
        debugLog("Warning: Stats reference or incrementInputCounter not available.");
    }

    const currentSong = _songRef; // Use the reference
    if (!currentSong) {
      debugLog("Error: currentSong reference is null in handleKeyPress.");
      return;
    }

    if (key === "Backspace") {
      let text = this.activeInputElement.innerText;
      if (text.length > 0) {
        this.activeInputElement.innerText = text.slice(0, -1);
        if (_callbacks.checkCorrectness) {
          _callbacks.checkCorrectness(this.activeInputElement, currentSong);
        }
      }
    } else if (key === "Enter") { // Assuming 'Enter' might be added later or needed
        if (_callbacks.selectNextInput) {
            _callbacks.selectNextInput(this.activeInputElement, this.focusedBoxIndex);
        }
    } else if (key === "Lifeline") {
        // Lifeline logic is handled by its dedicated button listener created in _createLifelineButton
        debugLog("Lifeline key press detected (should be handled by button listener).");
    }
    else { // Regular character keys
      const lyric = currentSong.lyrics[this.focusedBoxIndex];
      if (!lyric) {
          debugLog(`Error: Cannot find lyric at index ${this.focusedBoxIndex}`);
          return;
      }
       if (!lyric.toGuess) {
           debugLog("Attempted to type in a non-guessable word. Ignoring.");
           return; // Don't allow typing in non-guess words
       }
       // Check length against the *actual* content, not comparable
       if (this.activeInputElement.innerText.length < lyric.content.length) {
           this.activeInputElement.innerText += key;
           if (_callbacks.checkCorrectness) {
               _callbacks.checkCorrectness(this.activeInputElement, currentSong);
           }
       } else {
            debugLog("Max length reached for this input.");
       }
    }
  },

  // Prevent native keyboard on mobile if custom keyboard is active
  preventNativeKeyboard(event) {
    // Check if the focused element is one of our lyric inputs
    if (this.customKeyboardEnabled && isMobileDevice() && event.target.classList.contains('lyricle-lyrics-input')) {
      debugLog(`Preventing native keyboard for focus on: ${event.target.id}`);
      // We need to manage the active element ourselves
      this.setActiveInput(event.target);

      // Prevent the default focus action which would show the keyboard
      event.preventDefault();
      event.stopPropagation();

      // Blur immediately after focus to hide native keyboard,
      // but keep our internal reference (activeInputElement)
      setTimeout(() => event.target.blur(), 0);
      return false; // Indicate prevention occurred
    }
    // Allow focus/keyboard for other elements
    return true;
  },

  // Method to explicitly set the active input element from game.js
  setActiveInput(inputElement) {
      if (inputElement && inputElement.id.startsWith("lyricInput")) {
          this.activeInputElement = inputElement;
          this.focusedBoxIndex = parseInt(inputElement.id.replace("lyricInput", ""));
          debugLog(`KeyboardController active input set: ${inputElement.id}, index: ${this.focusedBoxIndex}`);
      } else if (inputElement === null) {
          this.activeInputElement = null;
          this.focusedBoxIndex = null;
          debugLog("KeyboardController active input cleared.");
      } else {
           debugLog(`KeyboardController setActiveInput called with non-lyric element or invalid element: ${inputElement?.id}`);
           // Optionally clear the active input if it's not a lyric box
           // this.activeInputElement = null;
           // this.focusedBoxIndex = null;
      }
  },

  // Method to update the lifeline button display (called by game.js)
  updateLifelineDisplay(lifelineCount) {
    const keyboardLifelineNumber = document.getElementById("keyboardLifelineNumber");
    const keyboardLifelineButton = document.getElementById("keyboardLifelineButton");

    if (keyboardLifelineButton && keyboardLifelineNumber) {
        keyboardLifelineNumber.innerText = lifelineCount;
        keyboardLifelineNumber.style.display = "inline"; // Ensure number is visible by default

        // Reset classes and styles
        keyboardLifelineButton.classList.remove("btn-danger"); // Assuming this class was used for warning
        keyboardLifelineButton.style.opacity = "1";
        keyboardLifelineButton.style.cursor = "pointer";
         keyboardLifelineButton.style.pointerEvents = "auto";
         keyboardLifelineButton.removeAttribute("aria-disabled");

        const lifelineIcon = keyboardLifelineButton.querySelector("i");
        if (lifelineIcon) {
            // Ensure icon is standard heart by default
            lifelineIcon.classList.remove("fa-heart-crack");
            lifelineIcon.classList.add("fa-heart");
        }

        // Apply specific styles based on count
        if (lifelineCount === 1) {
            // Maybe add a warning style if desired (e.g., btn-danger from Bootstrap)
            // keyboardLifelineButton.classList.add("btn-danger"); // Example
             debugLog("Lifeline count is 1 - applying warning style (if any defined).");
        } else if (lifelineCount <= 0) {
            debugLog("Lifeline count is 0 or less - applying disabled/cracked heart style.");
            if (lifelineIcon) {
                lifelineIcon.classList.remove("fa-heart");
                lifelineIcon.classList.add("fa-heart-crack");
            }
            // Hide number and visually disable
            keyboardLifelineNumber.style.display = "none";
            this.disableLifelineButton(true); // Visually disable
        }
    } else {
         debugLog("Warning: Keyboard lifeline button or number element not found for update.");
    }
  },

  // Method to disable the lifeline button (called by game.js on game end/concede)
  disableLifelineButton(isZeroLifelines = false) {
    const keyboardLifelineButton = document.getElementById("keyboardLifelineButton");
    if (keyboardLifelineButton) {
        debugLog(`Disabling keyboard lifeline button. Is zero lifelines: ${isZeroLifelines}`);
        keyboardLifelineButton.classList.add("disabled"); // Visual cue via CSS if defined
        keyboardLifelineButton.setAttribute("aria-disabled", "true");
        keyboardLifelineButton.style.opacity = "0.5";
        keyboardLifelineButton.style.cursor = "not-allowed";
        keyboardLifelineButton.style.pointerEvents = "none"; // Prevent clicks

        // If disabling because count is zero, ensure cracked heart is shown
        if (isZeroLifelines) {
             const lifelineIcon = keyboardLifelineButton.querySelector("i");
             const keyboardLifelineNumber = document.getElementById("keyboardLifelineNumber");
             if (lifelineIcon) {
                 lifelineIcon.classList.remove("fa-heart");
                 lifelineIcon.classList.add("fa-heart-crack");
             }
             if(keyboardLifelineNumber) {
                keyboardLifelineNumber.style.display = "none";
             }
        }

        // Attempt to remove the click listener cleanly (more robust than clone/replace)
         // This assumes the listener was added as described in _createLifelineButton
         // If listener was added differently, this might need adjustment.
         // Note: Direct removal requires keeping a reference to the exact listener function.
         // Since we used an arrow function bound in _createLifelineButton, direct removal is tricky.
         // The pointerEvents: none approach is generally sufficient.
    } else {
         debugLog("Warning: Keyboard lifeline button not found for disabling.");
    }
  },

   // Getter to check if the custom keyboard is considered enabled
  isEnabled() {
    return this.customKeyboardEnabled;
  },

  // Method to potentially toggle the keyboard on/off if needed later
  setEnabled(enabled) {
    this.customKeyboardEnabled = !!enabled; // Coerce to boolean
    debugLog(`Custom keyboard ${this.customKeyboardEnabled ? 'enabled' : 'disabled'}`);
    // Add any UI changes needed when toggling (e.g., show/hide keyboard)
    const oskbElement = document.getElementById('oskb');
     if (oskbElement) {
         oskbElement.style.display = this.customKeyboardEnabled ? 'block' : 'none';
         // May need to trigger adjustLyricContentPosition from game.js after this
     }
  },

};

// Export the controller for use in game.js
export { KeyboardController };
