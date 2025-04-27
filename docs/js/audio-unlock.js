// audio-unlock.js - iOS audio unlock functionality
import { debugLog } from './debug.js'; // Import debugLog
import { AudioController } from './audio.js'; // Import AudioController

// Add a document-wide touch/click handler to help unlock audio on iOS
function unlockAudio() {
  // Only run if audio exists and context isn't already unlocked
  if (!AudioController.audio || AudioController.audioContextUnlocked) {
    debugLog(`Audio unlock not needed/possible - Exists: ${!!AudioController.audio}, Unlocked: ${AudioController.audioContextUnlocked}`);
    return;
  }

  debugLog("unlockAudio called from document event - Attempting TRULY silent unlock");
  
  const audioInstance = AudioController.audio;
    
  try {
    // Store original state
    const originalMuted = audioInstance.muted;
    const originalVolume = audioInstance.volume;
    const originalTime = audioInstance.currentTime;
    const wasPlaying = !audioInstance.paused;
    
    // Attempt to play while completely silent
    audioInstance.muted = true; // KEEP MUTED
    audioInstance.volume = 0; // KEEP VOLUME 0
    
    const silentPlay = audioInstance.play();
    if (silentPlay !== undefined) {
      silentPlay.then(() => {
        // Immediately pause and restore state
        debugLog("Silent unlock play succeeded, pausing immediately");
        
        // Only pause if it wasn't playing before
        if (!wasPlaying) {
          audioInstance.pause();
        }
        
        // Restore original state (important: restore original muted state)
        audioInstance.muted = originalMuted;
        audioInstance.volume = originalVolume;
        // Restore time only if it was changed (it shouldn't be, but safe)
        if (audioInstance.currentTime !== originalTime) {
            audioInstance.currentTime = originalTime;
        }
        
        // Mark as successful
        AudioController.audioContextUnlocked = true;
        debugLog("Audio context successfully unlocked (kept silent)");
        
      }).catch(e => {
        // Failure is okay, just restore state
        debugLog("Audio unlock attempt failed (kept silent): " + e);
        if (!wasPlaying) {
          audioInstance.pause(); // Ensure it's paused only if it was originally paused
        }
        audioInstance.muted = originalMuted;
        audioInstance.volume = originalVolume;
        if (audioInstance.currentTime !== originalTime) {
            audioInstance.currentTime = originalTime;
        }
      });
    } else {
      // If promise is undefined, restore state
      if (!wasPlaying) {
        audioInstance.pause();
      }
      audioInstance.muted = originalMuted;
      audioInstance.volume = originalVolume;
      debugLog("Silent unlock play promise was undefined.");
    }
  } catch (e) {
    debugLog("Exception in unlockAudio: " + e);
    // Restore state on exception if possible
    if(audioInstance) {
      try {
        audioInstance.pause();
        audioInstance.muted = true; // Mute on error
        audioInstance.volume = 0; // Silence on error
      } catch (restoreError) {
        debugLog("Error restoring audio state after exception: " + restoreError);
      }
    }
  }
}

// Add listeners for both touch and click events - using more aggressive approach for iOS
// Using capture phase to intercept events as early as possible
document.addEventListener('touchstart', unlockAudio, { once: true, passive: true, capture: true });
document.addEventListener('click', unlockAudio, { once: true, passive: true, capture: true });

// For iOS Safari, we need to ensure any user gesture can potentially unlock audio
// These additional events can help in various scenarios
document.addEventListener('touchend', unlockAudio, { once: true, passive: true, capture: true });

// Add a more resilient approach that doesn't just unlock once
// This helps in cases where the browser might reset audio contexts
let audioUnlockAttempts = 0;
const MAX_UNLOCK_ATTEMPTS = 3;

function tryUnlockOnInteraction(e) {
  if (audioUnlockAttempts >= MAX_UNLOCK_ATTEMPTS || AudioController.audioContextUnlocked) {
    // Already unlocked or max attempts reached
    return;
  }
  
  audioUnlockAttempts++;
  debugLog(`Additional unlock attempt #${audioUnlockAttempts}`);
  unlockAudio();
  
  // If we've reached max attempts, remove the listeners
  if (audioUnlockAttempts >= MAX_UNLOCK_ATTEMPTS) {
    document.removeEventListener('click', tryUnlockOnInteraction);
    document.removeEventListener('touchstart', tryUnlockOnInteraction);
  }
}

// Add backup unlock listeners that will try multiple times
document.addEventListener('click', tryUnlockOnInteraction, { passive: true });
document.addEventListener('touchstart', tryUnlockOnInteraction, { passive: true });

// Export the unlockAudio function so it can be called directly if needed (though listeners are primary)
export { unlockAudio }; 