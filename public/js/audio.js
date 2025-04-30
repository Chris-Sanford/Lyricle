import { debugLog } from './debug.js';
import { updateMuteButtonUI } from './ui/control.js';

const AudioController = {
  audio: null,
  audioLoaded: false,
  audioContextUnlocked: false,
  _isMuted: false, // Internal state to track desired mute status - START FALSE TO MATCH UI
  _autoplayAttempted: false,

  // Initialization method
  init() {
    this.audio = document.getElementById("hiddenAudio");
    if (this.audio) {
      debugLog("AudioController: Initializing audio element");
      // Keep element muted initially for browser policies
      this.audio.muted = true;
      this.audio.volume = 0;
      this.audio.pause();
      this.audio.autoplay = false;
      
      // For iOS, set key attributes
      this.audio.setAttribute('playsinline', '');
      this.audio.setAttribute('webkit-playsinline', '');
      this.audio.setAttribute('controls', false);
      
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
        this.audio.volume = 0;
        debugLog(`AudioController: Ensuring audio mute state after load: ${this._isMuted}`);
      }
    });
    
    this.audio.addEventListener('ended', () => {
      debugLog("Audio ENDED event triggered");
      if (this._isGameComplete() && !this._isMuted) {
        debugLog("Audio ended while unmuted and game complete - ready for replay");
      }
    });
    
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

  // Check if URL is accessible by doing a HEAD request
  async _verifyUrl(url) {
    if (!url) return false;
    
    try {
      debugLog(`AudioController: Verifying URL: ${url}`);
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return true; // With no-cors, we can't check response.ok, so assume it worked if no exception
    } catch (e) {
      debugLog(`AudioController: URL verification failed: ${e.message}`);
      return false;
    }
  },

  // Sets the audio source URL
  setSource(url) {
    if (!this.audio) return;
    
    // Check if URL is undefined or empty
    if (!url) {
      debugLog("AudioController: No URL provided to setSource. Using fallback.");
      // Use a fallback silent audio file as a valid source
      url = 'https://pub-9d70620f0c724e4595b80ff107d19f59.r2.dev/250-milliseconds-of-silence.mp3';
    }
    
    debugLog("AudioController: Setting audio source: " + url);
    
    // Ensure audio is stopped and reset before changing source
    this.stop(true);
    
    // Validate the URL
    if (!this._isValidURL(url)) {
      debugLog("AudioController: Invalid URL provided: " + url);
      return;
    }
    
    // Attempt to verify URL, but don't block setting source
    this._verifyUrl(url).then(isValid => {
      if (!isValid) {
        debugLog("AudioController: URL failed verification, but proceeding anyway");
      }
    });
    
    this.audio.src = url;
    this.audio.preload = "auto";
    this.audioLoaded = false;
    this.audio.muted = true;
    this.audio.volume = 0;
    this._autoplayAttempted = false;
    debugLog(`AudioController: Source set. Element muted: ${this.audio.muted}. Retained internal state (_isMuted): ${this._isMuted}`);
  },
  
  // Validate URL
  _isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Plays audio, intended to be called directly from a user interaction (click/touch)
  playWithUserInteraction() {
    const isGameComplete = this._isGameComplete();
    debugLog(`AudioController: playWithUserInteraction called - _isMuted: ${this._isMuted}, audioLoaded: ${this.audioLoaded}, gameComplete: ${isGameComplete}`);
    
    // Only play if unmuted AND the game is complete
    if (!this.audio || this._isMuted || !isGameComplete) {
      debugLog(`AudioController: Not playing - Muted: ${this._isMuted}, Exists: ${!!this.audio}, GameComplete: ${isGameComplete}`);
      
      // For iOS compatibility, still need to unlock audio context even if not playing
      if (!this.audioContextUnlocked && this.audio) {
        this.unlockAudioContext();
      }
      return;
    }
    
    // Attempt to unlock if needed
    if (!this.audioContextUnlocked) {
      this.unlockAudioContext(); 
    }

    // Load audio if it wasn't loaded
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
          this.audioContextUnlocked = true;
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

  // Plays the preview automatically
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

    // Set a maximum time to wait for loading - shorter timeout for better UX
    const maxWaitTime = 2000; // 2 seconds max wait
    let loadingPromise;

    // Check if we need to wait for loading
    if (!this.audioLoaded && this.audio.readyState < 2) { // At least HAVE_CURRENT_DATA (2)
      debugLog("AudioController: Audio not loaded enough, waiting for loading");
      
      // Create a promise that resolves when either:
      // 1. Audio is loaded enough (canplay event)
      // 2. Timeout occurs
      loadingPromise = Promise.race([
        // Promise for audio loading
        new Promise(resolve => {
          const canPlayListener = () => {
            this.audioLoaded = true;
            this.audio.removeEventListener('canplay', canPlayListener);
            debugLog("AudioController: Audio reached 'canplay' state");
            resolve(true);
          };
          this.audio.addEventListener('canplay', canPlayListener);
        }),
        
        // Promise for timeout
        new Promise(resolve => {
          setTimeout(() => {
            debugLog("AudioController: Loading wait timed out, proceeding anyway");
            resolve(false);
          }, maxWaitTime);
        })
      ]);
      
      // Force loading to start if needed
      if (this.audio.networkState === 0 || this.audio.networkState === 3) {
        this.audio.load();
      }
      
      // Wait for either loading or timeout
      await loadingPromise;
    }

    // Double-check internal mute state and game completion before playing
    if (this._isMuted || !this._isGameComplete()) {
      debugLog(`AudioController: Condition changed before playback - Muted: ${this._isMuted}, GameComplete: ${this._isGameComplete()}`);
      return;
    }

    debugLog("AudioController: Attempting to play preview regardless of load state");
    this.audio.muted = false;
    this.audio.volume = 0.2;

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
          this.audioContextUnlocked = true;
        }).catch(error => {
          debugLog("AudioController: Playback error from playPreview: " + error);
          
          // If playback failed, try forcing audioLoaded and try again once more
          if (!this.audioLoaded) {
            debugLog("AudioController: Forcing audio loaded state and retrying playback");
            this.audioLoaded = true;
            this.audio.load();
            
            // Short delay before retry
            setTimeout(() => {
              try {
                this.audio.play()
                  .then(() => debugLog("AudioController: Retry playback successful"))
                  .catch(e => debugLog("AudioController: Retry playback also failed: " + e));
              } catch (e) {
                debugLog("AudioController: Exception during retry playback: " + e);
              }
            }, 500);
          }
        });
      }
    } catch (e) {
      debugLog("AudioController: Exception during playback from playPreview: " + e);
    }
  },

  // Toggle mute/unmute - the primary way to control audio from UI
  toggleMute(uiUpdateCallback) {
    if (!this.audio) return;
    
    // Flip the internal state
    this._isMuted = !this._isMuted;
    debugLog(`AudioController: Toggled mute state to: ${this._isMuted ? 'muted' : 'unmuted'}`);
    
    if (this._isMuted) {
      // If now muted, pause and mute the audio element
      if (!this.audio.paused) {
        try {
          this.audio.pause();
          debugLog("AudioController: Paused audio due to mute toggle");
        } catch(e) {
          debugLog("AudioController: Error pausing audio on mute: " + e);
        }
      }
      this.audio.muted = true;
      this.audio.volume = 0; // For safety
    } else {
      // If now unmuted AND game complete, try to play
      if (this._isGameComplete()) {
        debugLog("AudioController: Unmuted while game complete, attempting to play");
        this.playWithUserInteraction(); // Try to play immediately on unmute if game complete
      }
    }
    
    // Update UI if callback provided
    if (typeof uiUpdateCallback === 'function') {
      uiUpdateCallback(this._isMuted);
    }
    
    return this._isMuted; // Return current state
  },

  // Completely stop audio playback
  stop(resetTime = true) {
    if (!this.audio) return;
    
    debugLog("AudioController: Stopping audio" + (resetTime ? " and resetting time" : ""));
    
    try {
      this.audio.pause();
      
      if (resetTime) {
        this.audio.currentTime = 0;
      }
      
      // Don't change mute state, just ensure playback is stopped
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
        await unlockPromise
          .then(() => {
            debugLog("AudioController: Successfully unlocked audio context");
            this.audioContextUnlocked = true;
            
            // For iOS, need to pause immediately after unlocking if it wasn't playing before
            if (originalPaused) {
              this.audio.pause();
            }
            
            // Restore original state
            this.audio.muted = originalMuted;
            this.audio.volume = originalVolume;
            if (this.audio.currentTime !== originalTime && originalPaused) {
              this.audio.currentTime = originalTime;
            }
            
            debugLog(`AudioController: Restored state after unlock: muted=${this.audio.muted}, volume=${this.audio.volume}`);
          })
          .catch(err => {
            // This is expected on first load, we'll try again later with user interaction
            debugLog("AudioController: Could not unlock audio context: " + err);
            // Restore state
            if (originalPaused) {
              this.audio.pause();
            }
            this.audio.muted = originalMuted;
            this.audio.volume = originalVolume;
            if (this.audio.currentTime !== originalTime && originalPaused) {
              this.audio.currentTime = originalTime;
            }
          });
      } else {
        // No promise returned, just restore state
        debugLog("AudioController: No promise returned from play attempt, restoring state");
        if (originalPaused) {
          this.audio.pause();
        }
        this.audio.muted = originalMuted;
        this.audio.volume = originalVolume;
        if (this.audio.currentTime !== originalTime && originalPaused) {
          this.audio.currentTime = originalTime;
        }
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
  
  // Check if the game is complete - this needs to be implemented by game logic
  // Placeholder implementation, will be overridden in game.js
  _isGameComplete() {
    // This is a placeholder. The game.js will provide the actual implementation
    return window.gameState && window.gameState.gameComplete === true;
  },
  
  // Reset the autoplay attempted flag
  resetAutoplayAttempted() {
    debugLog("AudioController: Reset autoplay attempted flag");
    this._autoplayAttempted = false;
  },
  
  // Public getter for mute state
  isMuted() {
    return this._isMuted;
  },
  
  // Public getter for current time
  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0;
  },
  
  // Public getter for loaded state
  isLoaded() {
    return this.audioLoaded;
  }
};

// Helper function for toggling mute state externally
function toggleMuteSongPreview() {
  AudioController.toggleMute(updateMuteButtonUI);
}

export { AudioController, toggleMuteSongPreview };
