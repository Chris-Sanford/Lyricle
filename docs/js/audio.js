import { debugLog } from './debug.js';
import { updateMuteButtonUI } from './ui/control.js';

const AudioController = {
  audio: null,
  audioLoaded: false,
  audioContextUnlocked: false, // Track if the audio context has been successfully unlocked
  _isMuted: false, // Internal state to track desired mute status - START FALSE TO MATCH UI
  _autoplayAttempted: false, // Flag to track if we've already tried autoplay

  // Initialization method - Gets the audio element and sets initial state/listeners
  init() {
    this.audio = document.getElementById("hiddenAudio");
    if (this.audio) {
      debugLog("AudioController: Initializing audio element");
      // Keep element muted initially for browser policies, but _isMuted (intent) is false
      this.audio.muted = true;
      this.audio.volume = 0;
      this.audio.pause();
      this.audio.autoplay = false; // Explicitly disable autoplay
      
      // For iOS, set a few key attributes
      this.audio.setAttribute('playsinline', ''); // Ensure it has playsinline attribute
      this.audio.setAttribute('webkit-playsinline', ''); // For older iOS versions
      this.audio.setAttribute('controls', false); // No controls
      
      // Use auto preload
      this.audio.preload = "auto";
      
      this._addEventListeners();
    } else {
      debugLog("AudioController: Hidden audio element not found");
    }
  },

  // Adds necessary event listeners to the audio element
  _addEventListeners() {
    if (!this.audio) return;
    debugLog("AudioController: Adding event listeners");

    this.audio.addEventListener('play', () => debugLog("Audio PLAY event triggered"));
    this.audio.addEventListener('playing', () => debugLog("Audio PLAYING event triggered"));
    this.audio.addEventListener('pause', () => debugLog("Audio PAUSE event triggered"));
    this.audio.addEventListener('canplay', () => debugLog("Audio CANPLAY event triggered"));
    this.audio.addEventListener('loadstart', () => debugLog("Audio LOADSTART event triggered"));
    this.audio.addEventListener('error', (e) => debugLog("Audio ERROR event triggered: " + (e.message || e)));
    this.audio.addEventListener('canplaythrough', () => {
      this.audioLoaded = true;
      debugLog("Audio loaded and ready to play");
      // Ensure mute state reflects internal state if playback hasn't started
      if (this.audio.paused) {
         this.audio.muted = this._isMuted;
         // Start volume at 0, only set higher when playing
         this.audio.volume = 0;
         debugLog(`AudioController: Ensuring audio mute state after load: ${this._isMuted}`);
      }
    });
    // Add ended listener to potentially update UI or handle looping/replay logic if needed later
    this.audio.addEventListener('ended', () => debugLog("Audio ENDED event triggered"));
    
    // Ensure audio starts paused even if metadata loads quickly
    this.audio.addEventListener('loadedmetadata', () => {
      if (!this.audio.paused) {
        debugLog("Audio: Pausing after metadata loaded to prevent autoplay");
        this.audio.pause();
      }
    });
  },

  // Sets the audio source URL
  setSource(url) {
    if (!this.audio) return;
    debugLog("AudioController: Setting audio source: " + url);
    // Ensure audio is stopped and reset before changing source
    this.stop(true); // true to reset currentTime
    this.audio.src = url;
    this.audio.preload = "auto"; // Use auto preload
    this.audioLoaded = false; // Reset loaded flag
    // Force element to muted initially, but DO NOT override the internal _isMuted state here.
    // _isMuted should retain its value (e.g., the initial `false`).
    this.audio.muted = true;
    this.audio.volume = 0; // Start volume at 0
    this._autoplayAttempted = false; // Reset autoplay flag when source changes
    // this._isMuted = true; // REMOVED: This was incorrectly overriding the desired initial state.
    debugLog(`AudioController: Source set. Element muted: ${this.audio.muted}. Retained internal state (_isMuted): ${this._isMuted}`);
  },

  // Plays audio, intended to be called directly from a user interaction (click/touch)
  playWithUserInteraction() {
    const isGameComplete = this._isGameComplete();
    debugLog(`AudioController: playWithUserInteraction called - _isMuted: ${this._isMuted}, audioLoaded: ${this.audioLoaded}, gameComplete: ${isGameComplete}`);
    
    // Only play if unmuted AND the game is complete
    if (!this.audio || this._isMuted || !isGameComplete) {
       debugLog(`AudioController: Not playing - Muted: ${this._isMuted}, Exists: ${!!this.audio}, GameComplete: ${isGameComplete}`);
       return;
    }
    
    // Attempt to unlock if needed (might be redundant with global unlocker, but safe)
    if (!this.audioContextUnlocked) {
      this.unlockAudioContext(); 
    }

    // Load the audio if it wasn't loaded (e.g., if preload failed or wasn't auto)
    if (this.audio.readyState < 3) { // HAVE_CURRENT_DATA or less
      debugLog("AudioController: State is < 3, calling load()");
      this.audio.load();
    }

    // Ensure not muted and set volume
    this.audio.muted = false; 
    this.audio.volume = 0.2;  
    debugLog("AudioController: Set volume to 0.2");

    // Handle playback position
    if (this.audio.currentTime === 0 || this.audio.currentTime >= this.audio.duration - 0.5 || this.audio.ended) {
      this.audio.currentTime = 0;
      debugLog("AudioController: Reset currentTime to beginning for clean playback");
    } else if (this.audio.paused) {
      debugLog("AudioController: Resuming from position: " + this.audio.currentTime.toFixed(2) + "s");
    }

    // Attempt to play
    try {
      debugLog("AudioController: Attempting to play audio via user interaction");
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          debugLog("AudioController: Audio playback started successfully via user interaction");
          this.audioContextUnlocked = true; // Mark as unlocked since play succeeded
        }).catch(error => {
          debugLog("AudioController: Playback error (user interaction): " + error);
          this._handlePlaybackError();
        });
      }
    } catch (e) {
      debugLog("AudioController: Exception during playback (user interaction): " + e);
      this._handlePlaybackError();
    }
  },

  // Plays the preview, usually called automatically (e.g., on game completion)
  // Relies on the audio context being previously unlocked by user interaction.
  async playPreview() {
      const isGameComplete = this._isGameComplete();
      debugLog(`AudioController: playPreview called - _isMuted: ${this._isMuted}, audioLoaded: ${this.audioLoaded}, autoplayAttempted: ${this._autoplayAttempted}, gameComplete: ${isGameComplete}`);
      
      // Don't play if muted, already attempted, or game not complete
      if (!this.audio || this._isMuted || this._autoplayAttempted || !isGameComplete) {
          debugLog(`AudioController: Not playing preview - Muted: ${this._isMuted}, Exists: ${!!this.audio}, Already attempted: ${this._autoplayAttempted}, GameComplete: ${isGameComplete}`);
          return;
      }
      
      // Mark that we've attempted autoplay
      this._autoplayAttempted = true;
      
      // Attempt to unlock if needed
      if (!this.audioContextUnlocked) {
          debugLog("AudioController: Audio context not unlocked, attempting silent unlock first");
          this.unlockAudioContext();
      }

      // Ensure audio is loaded
      if (!this.audioLoaded && this.audio.readyState < 4) { // HAVE_ENOUGH_DATA
          debugLog("AudioController: Audio not loaded enough, waiting for canplaythrough");
          // If preload is auto, wait for event; otherwise, call load()
          if (this.audio.preload !== 'none') {
              await new Promise(resolve => {
                  const canPlayListener = () => {
                      this.audioLoaded = true;
                      this.audio.removeEventListener('canplaythrough', canPlayListener);
                      debugLog("AudioController: Audio loaded via canplaythrough event for playPreview");
                      resolve();
                  };
                  this.audio.addEventListener('canplaythrough', canPlayListener);
              });
          } else {
              debugLog("AudioController: Preload is none, calling load() for playPreview");
              this.audio.load();
              // We might need to wait again after calling load, handle this similarly
              await new Promise(resolve => {
                  if (this.audio.readyState >= 4) {
                      resolve();
                      return;
                  }
                  const canPlayListener = () => {
                      this.audioLoaded = true;
                      this.audio.removeEventListener('canplaythrough', canPlayListener);
                      debugLog("AudioController: Audio loaded via load() + canplaythrough event for playPreview");
                      resolve();
                  };
                  this.audio.addEventListener('canplaythrough', canPlayListener);
              });
          }
      }

      // Double-check internal mute state and game completion before playing
      if (this._isMuted || !this._isGameComplete()) {
          debugLog(`AudioController: Condition changed before playback - Muted: ${this._isMuted}, GameComplete: ${this._isGameComplete()}`);
          return;
      }

      debugLog("AudioController: Audio loaded, attempting to play preview.");
      this.audio.muted = false; // Ensure element is not muted
      this.audio.volume = 0.2; // Set volume

      // Attempt play
      try {
          // Reset to start if it ended previously
          if (this.audio.currentTime === 0 || this.audio.ended) {
              this.audio.currentTime = 0;
              debugLog("AudioController: Preview ended or at start, resetting time to 0 before replay.");
          }
          debugLog("AudioController: Attempting play from playPreview");
          const playPromise = this.audio.play();
          if (playPromise !== undefined) {
              playPromise.then(() => {
                  debugLog("AudioController: Preview playback successful");
                  this.audioContextUnlocked = true; // Mark as unlocked since play succeeded
              }).catch(error => {
                  debugLog("AudioController: Playback error from playPreview (autoplay likely failed): " + error);
                  // Don't change internal state, just log
              });
          }
      } catch (e) {
          debugLog("AudioController: Exception during playback from playPreview: " + e);
      }
  },

  // Toggles the mute state and calls back to update UI
  toggleMute(uiUpdateCallback) {
    if (!this.audio) return;
    debugLog(`AUDIO DEBUG: toggleMute START. Current internal state (_isMuted): ${this._isMuted}`);

    if (!this._isMuted) { // If currently unmuted
      // User wants to mute
      debugLog("AUDIO DEBUG: User wants to MUTE. Pausing audio.");
      this.audio.pause();
      this.audio.muted = true;
      this.audio.volume = 0; // Ensure volume is 0 when muted
      this._isMuted = true;
      debugLog(`AUDIO DEBUG: Set internal state (_isMuted) to: ${this._isMuted}`);
      if (uiUpdateCallback) {
        debugLog("AUDIO DEBUG: Calling UI update callback with true (muted).");
        uiUpdateCallback(true); // Notify UI: isMuted = true
      }
    } else { // If currently muted
      // User wants to unmute
      debugLog("AUDIO DEBUG: User wants to UNMUTE.");
      this._isMuted = false;
      this.audio.muted = false; // Unmute the element
      // Volume will be set by the play function if/when it plays
      debugLog(`AUDIO DEBUG: Set internal state (_isMuted) to: ${this._isMuted}`);
      if (uiUpdateCallback) {
        debugLog("AUDIO DEBUG: Calling UI update callback with false (unmuted).");
        uiUpdateCallback(false); // Notify UI: isMuted = false
      }
      
      // Attempt to unlock audio context when unmuting if not already unlocked
      if (!this.audioContextUnlocked) {
        this.unlockAudioContext();
      }
      // The calling context (game.js) should decide whether to call playWithUserInteraction now
    }
    debugLog(`AUDIO DEBUG: toggleMute END. Final internal state (_isMuted): ${this._isMuted}`);
  },

  // Stops playback and resets state
  stop(resetTime = true) {
    debugLog(`AudioController: stop called (resetTime: ${resetTime})`);
    if (this.audio) {
        if (!this.audio.paused) {
            debugLog("AudioController: Pausing audio");
            this.audio.pause();
        }
        if (resetTime) {
            try {
                // Only reset time if not already at 0 to avoid unnecessary operations
                if (this.audio.currentTime !== 0) {
                    debugLog("AudioController: Resetting currentTime to 0");
                    this.audio.currentTime = 0;
                }
            } catch (e) {
                // Catch potential errors (e.g., if called during invalid state)
                debugLog("AudioController: Error resetting audio time: " + e);
            }
        }
        // Reset volume to 0 when stopped
        this.audio.volume = 0;
    }
  },

  // Attempts to unlock the audio context silently
  unlockAudioContext() {
      // Only run if audio exists and context isn't already unlocked
      if (!this.audio || this.audioContextUnlocked) {
        debugLog(`AudioController: Unlock not needed/possible - Exists: ${!!this.audio}, Unlocked: ${this.audioContextUnlocked}`);
        return;
      }

      debugLog("AudioController: Attempting silent unlock");
      const audioInstance = this.audio;
      const originalMuted = audioInstance.muted;
      const originalVolume = audioInstance.volume;
      const originalTime = audioInstance.currentTime;

      audioInstance.muted = false; // Must be unmuted to play
      audioInstance.volume = 0.001; // Set very low volume

      try {
          const playPromise = audioInstance.play();
          if (playPromise !== undefined) {
              playPromise.then(() => {
                  // Immediately pause after playback starts
                  audioInstance.pause();
                  // Restore original state
                  audioInstance.muted = originalMuted;
                  audioInstance.volume = originalVolume;
                  if (audioInstance.currentTime !== originalTime) {
                      audioInstance.currentTime = originalTime;
                  }
                  debugLog("AudioController: Audio context likely unlocked.");
                  this.audioContextUnlocked = true;
              }).catch(error => {
                  debugLog("AudioController: Unlock play() failed: " + error);
                  // Restore original state on failure
                  audioInstance.pause();
                  audioInstance.muted = originalMuted;
                  audioInstance.volume = originalVolume;
                  if (audioInstance.currentTime !== originalTime) {
                      audioInstance.currentTime = originalTime;
                  }
              });
          } else {
             // If playPromise is undefined, restore state
             audioInstance.muted = originalMuted;
             audioInstance.volume = originalVolume;
             debugLog("AudioController: play() promise was undefined during unlock.");
          }
      } catch (e) {
          debugLog("AudioController: Exception during unlock attempt: " + e);
           // Restore original state on exception
           audioInstance.pause();
           audioInstance.muted = originalMuted;
           audioInstance.volume = originalVolume;
      }
  },
  
  // Centralized handler for playback errors
  _handlePlaybackError() {
    this._isMuted = true; // Assume mute failed if play fails
    this.audio.muted = true;
    this.audio.volume = 0;
    this.audio.pause();
    updateMuteButtonUI(true); // Update mute button to reflect state
  },

  // Helper function to check if the game is complete
  _isGameComplete() {
    // Check if Stopwatch.endTime exists to determine if game is complete
    return typeof window.Stopwatch !== 'undefined' && window.Stopwatch.endTime !== null;
  },

  // Reset the autoplay attempted flag
  resetAutoplayAttempted() {
    this._autoplayAttempted = false;
    debugLog("AudioController: Reset autoplay attempted flag");
  },

  // --- Getters ---
  isMuted() {
    // Use the internal state as the source of truth
    return this._isMuted;
  },

  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0;
  },

  isLoaded() {
    return this.audioLoaded;
  }
};

// Handle mute button click (intended to be called directly from a user interaction event)
function toggleMuteSongPreview() {
  debugLog("toggleMuteSongPreview called from user interaction");
  
  // Toggle mute state first
  AudioController.toggleMute(updateMuteButtonUI);
  
  // If now unmuted, attempt to play but ONLY if game is complete
  if (!AudioController.isMuted()) {
    if (AudioController._isGameComplete()) {
      debugLog("Game is complete and unmuted - playing audio via user interaction");
      AudioController.playWithUserInteraction();
    } else {
      debugLog("Game is not complete - not playing audio yet, just unmuted state");
    }
  }
}

// Export the controller
export { AudioController, toggleMuteSongPreview };
