import { debugLog } from './debug.js';
import { isMobileDevice } from './helpers.js';

// Store callbacks provided by game.js during initialization
let _callbacks = {};
let _songRef = null; // Reference to the current song object
let _statsRef = null; // Reference to the Stats object

export const KeyboardController = {
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
    
    // Add event listener with explicit binding
    const boundHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      debugLog(`Key pressed: ${key}`);
      this.handleKeyPress(event);
    };
    
    keyButton.addEventListener("click", boundHandler);
    
    // Add touchstart/touchend for mobile
    keyButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keyButton.classList.add("active");
    });
    
    keyButton.addEventListener("touchend", (e) => {
      e.preventDefault();
      keyButton.classList.remove("active");
      boundHandler(e);
    });
    
    return keyButton;
  },

   // Helper to create a special key button (like Backspace, Lifeline)
  _createSpecialKey(key, innerHTML, additionalClasses = []) {
    const keyButton = document.createElement("div");
    keyButton.className = "lyricle-key " + additionalClasses.join(" ");
    keyButton.innerHTML = innerHTML;
    keyButton.dataset.key = key;
    
    // Add event listener with explicit binding
    const boundHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      debugLog(`Special key pressed: ${key}`);
      this.handleKeyPress(event);
    };
    
    keyButton.addEventListener("click", boundHandler);
    
    // Add touchstart/touchend for mobile
    keyButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keyButton.classList.add("active");
    });
    
    keyButton.addEventListener("touchend", (e) => {
      e.preventDefault();
      keyButton.classList.remove("active");
      boundHandler(e);
    });
    
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
      if (_callbacks && song) {
        debugLog("Lifeline button requirements met");
        
        // Check if we have no lifelines left - directly show concede modal
        if (_callbacks.getLifelines && _callbacks.getLifelines() <= 0) {
          debugLog("No lifelines left, showing concede modal");
          if (_callbacks.displayConcedeModal) {
            _callbacks.displayConcedeModal(song);
          }
        } 
        // Otherwise use lifeline normally
        else if (_callbacks.useLifeline) {
          debugLog("Executing useLifeline callback");
          // Pass the song reference and button element for potential styling in the callback
          _callbacks.useLifeline(song, lifelineKey);
        }
      } else {
        // Log detailed diagnostic info
        debugLog(`Keyboard lifeline button clicked but not all requirements met:
          - _callbacks exists: ${!!_callbacks}
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
    debugLog("Key press detected");
    const key = event.currentTarget.dataset.key;
    debugLog(`Key pressed: ${key}`);

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

    const currentSong = _songRef || window.currentSong; // Try both sources
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
      
      // Check if word is guessable
      if (!lyric.toGuess) {
          debugLog("Attempted to type in a non-guessable word. Ignoring.");
          return;
      }
      
      // Check if we're at the character limit before adding the character
      if (this.activeInputElement.innerText.length >= lyric.content.length) {
          debugLog(`Max length reached for this input (${this.activeInputElement.innerText.length} >= ${lyric.content.length}). Ignoring input.`);
          return;
      }
      
      // Add the character to the active input only if within character limit
      this.activeInputElement.innerText += key;
      
      // Check correctness after input
      if (_callbacks.checkCorrectness) {
          _callbacks.checkCorrectness(this.activeInputElement, currentSong);
      }
    }
  },

  // Prevent native keyboard on mobile
  preventNativeKeyboard(event) {
      // Only apply this for mobile devices
      if (!isMobileDevice() || !this.isEnabled()) {
          return; // Do nothing on desktop or if custom keyboard is disabled
      }
      
      // Check if target is a lyric input
      const target = event.target;
      if (target && target.classList && 
          (target.classList.contains('lyricle-lyrics-input') || 
           target.classList.contains('lyricle-lyrics-input-first'))) {
          
          // Disable the contentEditable for mobile, but still allow focus
          setTimeout(() => {
              target.contentEditable = false;
              debugLog("Prevented native keyboard on mobile for " + target.id);
          }, 0);
      }
  },

  // Method to set the active input element
  setActiveInput(inputElement) {
    debugLog(`Setting active input: ${inputElement ? inputElement.id : 'null'}`);
    this.activeInputElement = inputElement;
    
    // If an input is set, determine its box index and update controller state
    if (inputElement) {
      const idMatch = inputElement.id.match(/lyricInput(\d+)/);
      this.focusedBoxIndex = idMatch ? parseInt(idMatch[1]) : null;
      debugLog(`Set focusedBoxIndex to: ${this.focusedBoxIndex}`);
    } else {
      this.focusedBoxIndex = null;
    }
  },

  // Method to update the lifeline display
  updateLifelineDisplay(lifelineCount) {
    try {
      // Target the lifeline button within the keyboard
      const lifelineButton = document.getElementById('keyboardLifelineButton');
      const lifelineCountElement = document.getElementById('keyboardLifelineNumber');
      
      if (lifelineButton && lifelineCountElement) {
        // Update the heart icon based on remaining lifelines
        const heartIcon = lifelineButton.querySelector('i');
        
        if (lifelineCount <= 0) {
          // Change to cracked heart when no lifelines remain
          heartIcon.className = 'fas fa-heart-crack';
        } else {
          // Ensure it's a normal heart if we have lifelines
          heartIcon.className = 'fas fa-heart';
        }
        
        // Update the number display
        lifelineCountElement.innerText = lifelineCount;
        
        debugLog(`Keyboard lifeline display updated to: ${lifelineCount}`);
      } else {
        debugLog("WARNING: Keyboard lifeline button or count element not found!");
      }
    } catch (e) {
      debugLog("ERROR in updateLifelineDisplay: " + e.message);
    }
  },

  // Method to disable the lifeline button
  disableLifelineButton(isZeroLifelines = false) {
    try {
      // Target the lifeline button within the keyboard
      const lifelineButton = document.getElementById('keyboardLifelineButton');
      
      if (lifelineButton) {
        // Update the heart icon to cracked if necessary
        if (isZeroLifelines) {
          const heartIcon = lifelineButton.querySelector('i');
          if (heartIcon) {
            heartIcon.className = 'fas fa-heart-crack';
          }
        }
        
        // Style the button as disabled - using opacity/graying out
        lifelineButton.style.opacity = '0.5';
        lifelineButton.style.pointerEvents = 'none'; // Remove pointer events to disable interaction
        
        debugLog("Keyboard lifeline button disabled");
      } else {
        debugLog("WARNING: Keyboard lifeline button not found for disabling!");
      }
    } catch (e) {
      debugLog("ERROR in disableLifelineButton: " + e.message);
    }
  },

  // Check if the custom keyboard is enabled
  isEnabled() {
    return this.customKeyboardEnabled;
  },

  // Set keyboard enabled/disabled state
  setEnabled(enabled) {
    this.customKeyboardEnabled = enabled;
    return this.customKeyboardEnabled;
  },

  // Make song reference available
  get _songRef() {
    return _songRef;
  },
  
  set _songRef(songRef) {
    _songRef = songRef;
  }
};

// Add it to window for diagnostic access and fallback
window.KeyboardController = KeyboardController;
