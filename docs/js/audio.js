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
    this.audio.addEventListener('ended', () => {
      debugLog("Audio ENDED event triggered");
      // Reset UI buttons if needed for iOS
      if (this._isGameComplete() && !this._isMuted) {
        // Add ability to replay after ending
        debugLog("Audio ended while unmuted and game complete - ready for replay");
      }
    });
    
    // Ensure audio starts paused even if metadata loads quickly
    this.audio.addEventListener('loadedmetadata', () => {
      if (!this.audio.paused) {
        debugLog("Audio: Pausing after metadata loaded to prevent autoplay");
        this.audio.pause();
      }
    });

    // iOS-specific handling for interruptions
    if (typeof this.audio.addEventListener === 'function') {
      this.audio.addEventListener('pause', () => {
        // Detect if this was system-initiated pause (phone call, etc.)
        if (!this._isMuted && this._isGameComplete() && !this.audio.ended) {
          debugLog("Audio: System-initiated pause detected, marking for resume if unmuted");
        }
      });
    }
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
       
       // For iOS compatibility, we still need to unlock the audio context even if we're not playing
       if (!this.audioContextUnlocked && this.audio) {
         this.unlockAudioContext();
       }
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
          await this.unlockAudioContext();
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
                  
                  // Add a timeout to resolve anyway if canplaythrough doesn't fire
                  setTimeout(() => {
                      this.audio.removeEventListener('canplaythrough', canPlayListener);
                      debugLog("AudioController: Timed out waiting for canplaythrough, proceeding anyway");
                      resolve();
                  }, 3000);
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
                  
                  // Add a timeout to resolve anyway if canplaythrough doesn't fire
                  setTimeout(() => {
                      this.audio.removeEventListener('canplaythrough', canPlayListener);
                      debugLog("AudioController: Timed out waiting for canplaythrough after load, proceeding anyway");
                      resolve();
                  }, 3000);
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
      debugLog(`AUDIO DEBUG: Set internal state (_isMuted) to: ${this._isMuted}`);
      
      // Update UI first
      if (uiUpdateCallback) {
        debugLog("AUDIO DEBUG: Calling UI update callback with false (unmuted).");
        uiUpdateCallback(false); // Notify UI: isMuted = false
      }
      
      // Handle audio state
      if (this._isGameComplete()) {
        debugLog("AUDIO DEBUG: Game is complete! Attempt to play/resume audio.");
        
        // First unlock audio context if needed (for iOS)
        if (!this.audioContextUnlocked) {
          this.unlockAudioContext();
        }
        
        // Ensure not muted
        this.audio.muted = false;
        this.audio.volume = 0.2;
        
        // If already ended or not started, reset to beginning
        if (this.audio.ended || this.audio.currentTime === 0 || this.audio.currentTime >= this.audio.duration - 0.5) {
          this.audio.currentTime = 0;
          debugLog("AUDIO DEBUG: Reset to beginning");
        }
        
        // Try to play
        try {
          const playPromise = this.audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              debugLog("AUDIO DEBUG: Successfully played/resumed on unmute!");
              this.audioContextUnlocked = true;
            }).catch(error => {
              debugLog("AUDIO DEBUG: Failed to play on unmute: " + error);
              this._handlePlaybackError();
            });
          }
        } catch (e) {
          debugLog("AUDIO DEBUG: Exception during playback on unmute: " + e);
          this._handlePlaybackError();
        }
      } else {
        debugLog("AUDIO DEBUG: Game not complete, just updated UI without audio change");
      }
    }
  },
  
  // Stops audio playback
  stop(resetTime = true) {
    if (!this.audio) return;
    
    debugLog("AudioController: Stopping audio" + (resetTime ? " and resetting time" : ""));
    try {
      // Pause the audio first
      this.audio.pause();
      
      // Reset the currentTime if requested
      if (resetTime) {
        this.audio.currentTime = 0;
      }
      
      // Apply mute state based on internal tracker
      this.audio.muted = this._isMuted;
      this.audio.volume = 0; // Always set volume to 0 when stopped
      
      debugLog(`AudioController: Audio stopped. State: paused=${this.audio.paused}, muted=${this.audio.muted}, time=${this.audio.currentTime}`);
    } catch (e) {
      debugLog("AudioController: Error stopping audio: " + e);
    }
  },
  
  // Unlock audio context - important for iOS
  async unlockAudioContext() {
    if (!this.audio || this.audioContextUnlocked) {
      debugLog("AudioController: No need to unlock - already unlocked or no audio element");
      return;
    }
    
    debugLog("AudioController: Attempting to unlock audio context");
    
    try {
      // Store original state
      const originalMuted = this.audio.muted;
      const originalVolume = this.audio.volume;
      const originalTime = this.audio.currentTime;
      const originalPaused = this.audio.paused;
      
      // Ensure silent before unlock attempt
      this.audio.muted = true;
      this.audio.volume = 0;
      
      // Try to play silently
      const unlockPromise = this.audio.play();
      if (unlockPromise !== undefined) {
        await unlockPromise.then(() => {
          // Success! Immediately pause and restore original state
          debugLog("AudioController: Successfully unlocked audio context");
          this.audioContextUnlocked = true;
          
          // Only pause if it was paused originally
          if (originalPaused) {
            this.audio.pause();
          }
          
          // Restore state but respect game rules
          this.audio.currentTime = originalTime;
          this.audio.muted = this._isMuted || !this._isGameComplete(); // Apply mute based on game state
          this.audio.volume = this._isMuted ? 0 : originalVolume;
          
          debugLog(`AudioController: Restored state after unlock: muted=${this.audio.muted}, volume=${this.audio.volume}`);
        }).catch(err => {
          // Couldn't unlock - this is expected in many cases
          debugLog("AudioController: Could not unlock audio context: " + err);
          
          // Still restore original state
          if (originalPaused) {
            this.audio.pause();
          }
          this.audio.currentTime = originalTime;
          this.audio.muted = originalMuted;
          this.audio.volume = originalVolume;
        });
      } else {
        // Promise wasn't returned, restore state
        debugLog("AudioController: No promise returned from play attempt, restoring state");
        if (originalPaused) {
          this.audio.pause();
        }
        this.audio.currentTime = originalTime;
        this.audio.muted = originalMuted;
        this.audio.volume = originalVolume;
      }
    } catch (e) {
      debugLog("AudioController: Error in unlockAudioContext: " + e);
    }
  },
  
  // Handle playback errors
  _handlePlaybackError() {
    debugLog("AudioController: Handling playback error");
    try {
      // Ensure audio is paused and muted to prevent further errors
      this.audio.pause();
      this.audio.muted = true;
      this.audio.volume = 0;
    } catch (e) {
      debugLog("AudioController: Error in _handlePlaybackError: " + e);
    }
  },
  
  // Helper to check if game is complete
  _isGameComplete() {
    // This function should check from your game state logic
    return window.GAME_STATE && window.GAME_STATE.isCompleted === true;
  },
  
  // Reset the autoplay attempted flag
  resetAutoplayAttempted() {
    this._autoplayAttempted = false;
    debugLog("AudioController: Reset autoplay attempted flag");
  },
  
  // Public getter for mute state
  isMuted() {
    return this._isMuted;
  },
  
  // Get current time
  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0;
  },
  
  // Check if audio is loaded
  isLoaded() {
    return this.audioLoaded && this.audio && this.audio.readyState >= 3;
  }
};

function toggleMuteSongPreview() {
  debugLog("toggleMuteSongPreview called");
  // Toggle mute and update UI
  AudioController.toggleMute(updateMuteButtonUI);
}

export { AudioController, toggleMuteSongPreview };
