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
    
    // Attempt to play while completely silent
    audioInstance.muted = true; // KEEP MUTED
    audioInstance.volume = 0; // KEEP VOLUME 0
    
    const silentPlay = audioInstance.play();
    if (silentPlay !== undefined) {
      silentPlay.then(() => {
        // Immediately pause and restore state
        debugLog("Silent unlock play succeeded, pausing immediately");
        audioInstance.pause();
        
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
        audioInstance.pause(); // Ensure it's paused
        audioInstance.muted = originalMuted;
        audioInstance.volume = originalVolume;
        if (audioInstance.currentTime !== originalTime) {
            audioInstance.currentTime = originalTime;
        }
      });
    } else {
      // If promise is undefined, restore state
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
// Use { once: true } to ensure unlock only happens on the very first interaction
document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
document.addEventListener('click', unlockAudio, { once: true, passive: true });

// Export the unlockAudio function so it can be called directly if needed (though listeners are primary)
export { unlockAudio }; 