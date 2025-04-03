import { debugLog } from './debug.js';

const AudioController = {
  audio: null,
  audioLoaded: false,
  _isMuted: true, // Internal state to track desired mute status

  // Initialization method - Gets the audio element and sets initial state/listeners
  init() {
    this.audio = document.getElementById("hiddenAudio");
    if (this.audio) {
      debugLog("AudioController: Initializing audio element");
      this.audio.muted = true;
      this.audio.volume = 0;
      this.audio.pause();
      this.audio.autoplay = false; // Explicitly disable autoplay
      this._isMuted = true; // Reflect initial state
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
         this.audio.volume = this._isMuted ? 0 : 0.2;
         debugLog(`AudioController: Ensuring audio mute state after load: ${this._isMuted}`);
      }
    });
    // Add ended listener to potentially update UI or handle looping/replay logic if needed later
    this.audio.addEventListener('ended', () => debugLog("Audio ENDED event triggered"));
  },

  // Sets the audio source URL
  setSource(url) {
    if (!this.audio) return;
    debugLog("AudioController: Setting audio source: " + url);
    // Ensure audio is stopped and reset before changing source
    this.stop(true); // true to reset currentTime
    this.audio.src = url;
    this.audio.preload = "auto"; // Preload the new source
    this.audioLoaded = false; // Reset loaded flag
    // Re-apply initial muted state forcefully
    this.audio.muted = true;
    this.audio.volume = 0;
    this._isMuted = true;
    debugLog(`AudioController: Source set, muted: ${this.audio.muted}, internal mute state: ${this._isMuted}`);
  },

  // Plays audio, intended to be called directly from a user interaction (click/touch)
  playWithUserInteraction() {
    debugLog(`AudioController: playWithUserInteraction called - _isMuted: ${this._isMuted}, audioLoaded: ${this.audioLoaded}`);
    if (!this.audio || this._isMuted || !this.audioLoaded) {
       debugLog(`AudioController: Not playing - Muted: ${this._isMuted}, Loaded: ${this.audioLoaded}, Exists: ${!!this.audio}`);
       return;
    }

    this.audio.muted = false; // Ensure not muted programmatically
    this.audio.volume = 0.2;  // Set desired volume
    debugLog("AudioController: Set volume to 0.2");

    // Handle playback position
    if (this.audio.currentTime === 0 || this.audio.currentTime >= this.audio.duration - 0.5) {
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
        }).catch(error => {
          debugLog("AudioController: Playback error (user interaction): " + error);
          // If playback fails even with interaction, update state and UI
          this._isMuted = true; // Assume mute failed if play fails
          this.audio.muted = true;
          // Ideally, trigger UI update callback here if it exists/is passed
        });
      }
    } catch (e) {
      debugLog("AudioController: Exception during playback (user interaction): " + e);
       this._isMuted = true; // Assume mute failed on exception
       this.audio.muted = true;
    }
  },

  // Plays the preview, usually called automatically (e.g., on game completion)
  // Relies on the audio context being previously unlocked by user interaction.
  async playPreview() {
      debugLog(`AudioController: playPreview called - _isMuted: ${this._isMuted}, audioLoaded: ${this.audioLoaded}`);
      if (!this.audio) return;

      // Wait for audio to be ready if needed
      if (!this.audioLoaded) {
          debugLog("AudioController: Audio not loaded yet, waiting for canplaythrough");
          await new Promise(resolve => {
              if (this.audio.readyState >= 4) { // HAVE_ENOUGH_DATA
                  this.audioLoaded = true;
                  debugLog("AudioController: Audio already loaded enough");
                  resolve();
              } else {
                  const canPlayListener = () => {
                      this.audioLoaded = true;
                      this.audio.removeEventListener('canplaythrough', canPlayListener);
                      debugLog("AudioController: Audio loaded via canplaythrough event for playPreview");
                      resolve();
                  };
                  this.audio.addEventListener('canplaythrough', canPlayListener);
              }
          });
      }

      // Check internal mute state before playing
      if (this._isMuted) {
          debugLog("AudioController: Internal state is muted, not playing preview");
          return;
      }

      debugLog("AudioController: Audio loaded, attempting to play preview.");
      this.audio.muted = false; // Ensure element is not muted
      this.audio.volume = 0.2; // Ensure volume is set

      // Attempt play
      try {
          // Reset to start if it ended previously
          if (this.audio.ended) {
              this.audio.currentTime = 0;
              debugLog("AudioController: Preview ended, resetting time to 0 before replay.");
          }
          debugLog("AudioController: Attempting play from playPreview");
          const playPromise = this.audio.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => {
                  debugLog("AudioController: Playback error from playPreview (autoplay likely failed): " + error);
                  // If autoplay fails, set internal state back to muted as playback isn't happening
                  this._isMuted = true;
              });
          }
      } catch (e) {
          debugLog("AudioController: Exception during playback from playPreview: " + e);
          this._isMuted = true; // Assume failed on exception
      }
  },

  // Toggles the mute state and calls back to update UI
  toggleMute(uiUpdateCallback) {
    if (!this.audio) return;
    debugLog(`AudioController: toggleMute called. Current internal state: ${this._isMuted}`);

    if (!this._isMuted) { // If currently unmuted
      // User wants to mute
      debugLog("AudioController: Muting audio, current position: " + this.audio.currentTime.toFixed(2) + "s");
      this.audio.pause();
      this.audio.muted = true;
      this._isMuted = true;
      if (uiUpdateCallback) uiUpdateCallback(true); // Notify UI: isMuted = true
    } else { // If currently muted
      // User wants to unmute
      debugLog("AudioController: Unmuting audio");
      this.audio.muted = false; // Unmute the element first
      this._isMuted = false;
      if (uiUpdateCallback) uiUpdateCallback(false); // Notify UI: isMuted = false
      // The calling context (game.js) should decide whether to call playWithUserInteraction now
    }
    debugLog(`AudioController: toggleMute finished. New internal state: ${this._isMuted}`);
  },

  // Stops playback
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
    }
  },

  // Attempts to unlock the audio context, usually on first user interaction
  unlockAudioContext() {
      // Only run if audio exists and is currently paused & effectively silent
      if (!this.audio || !this.audio.paused || this.audio.volume > 0.01) {
        debugLog(`AudioController: Unlock not needed/possible - Paused: ${this.audio?.paused}, Volume: ${this.audio?.volume}`);
        return;
      }

      debugLog("AudioController: Attempting to unlock audio context");
      // Strategy: Play a tiny bit of silence or the actual audio very quietly
      const originalMuted = this.audio.muted;
      const originalVolume = this.audio.volume;

      this.audio.muted = false; // Must be unmuted to play
      this.audio.volume = 0.001; // Set very low volume

      try {
          const playPromise = this.audio.play();
          if (playPromise !== undefined) {
              playPromise.then(() => {
                  // Immediately pause after playback starts
                  this.audio.pause();
                  // Restore original state
                  this.audio.muted = originalMuted;
                  this.audio.volume = originalVolume;
                  debugLog("AudioController: Audio context likely unlocked.");
              }).catch(error => {
                  debugLog("AudioController: Unlock play() failed: " + error);
                  // Restore original state on failure
                  this.audio.muted = originalMuted;
                  this.audio.volume = originalVolume;
              });
          } else {
             // If playPromise is undefined (shouldn't happen with modern browsers but good practice)
             this.audio.muted = originalMuted;
             this.audio.volume = originalVolume;
             debugLog("AudioController: play() promise was undefined during unlock.");
          }
      } catch (e) {
          debugLog("AudioController: Exception during unlock attempt: " + e);
           // Restore original state on exception
           this.audio.muted = originalMuted;
           this.audio.volume = originalVolume;
      }
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

// Export the controller
export { AudioController };
