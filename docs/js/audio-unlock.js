// audio-unlock.js - iOS audio unlock functionality
import { debugLog } from './debug.js'; // Import debugLog
import { AudioController } from './audio.js'; // Import AudioController

// Add a document-wide touch/click handler to help unlock audio on iOS
function unlockAudio() {
  debugLog("unlockAudio called from document event");
  
  // Use the imported AudioController instance
  const audioInstance = AudioController.audio; // Access the audio element via controller
  const audioLoaded = AudioController.isLoaded(); // Use the controller's state method

  if (audioInstance && audioLoaded) {
    debugLog("Audio exists and is loaded, attempting silent play via AudioController");
    
    try {
      // Make sure audio is silent and muted for the unlock attempt
      const originalMuted = audioInstance.muted;
      const originalVolume = audioInstance.volume;
      
      audioInstance.muted = false; // Must be unmuted to play
      audioInstance.volume = 0.001; // Very low volume
      
      // Create a short silent sound and play it
      const silentPlay = audioInstance.play();
      if (silentPlay !== undefined) {
        silentPlay.then(() => {
          // Immediately stop it and restore state
          debugLog("Silent play succeeded, pausing immediately");
          audioInstance.pause();
          // Restore original state
          audioInstance.muted = originalMuted;
          audioInstance.volume = originalVolume;
          // Reset time only if needed
          if (audioInstance.currentTime !== 0) audioInstance.currentTime = 0;
          
        }).catch(e => {
          // Silent failure is OK, restore state
          debugLog("Audio unlock attempt failed: " + e);
          audioInstance.muted = originalMuted;
          audioInstance.volume = originalVolume;
        });
      } else {
        // If promise is undefined, restore state
        audioInstance.muted = originalMuted;
        audioInstance.volume = originalVolume;
        debugLog("Silent play promise was undefined.");
      }
    } catch (e) {
      debugLog("Exception in unlockAudio: " + e);
      // Restore state on exception if possible
       if(audioInstance) {
         audioInstance.muted = originalMuted;
         audioInstance.volume = originalVolume;
       }
    }
  } else {
    debugLog("Audio not available for unlocking: exists=" + !!audioInstance + ", loaded=" + !!audioLoaded);
  }
  
  // Remove the event listener after first interaction
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('click', unlockAudio);
}

// Add listeners for both touch and click events
document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
document.addEventListener('click', unlockAudio, { once: true, passive: true }); 