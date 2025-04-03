// audio-unlock.js - iOS audio unlock functionality

// Add a document-wide touch/click handler to help unlock audio on iOS
function unlockAudio() {
  debugLog("unlockAudio called from document event");
  
  if (window.audio && window.audioLoaded) {
    debugLog("Audio exists and is loaded, attempting silent play");
    
    try {
      // Make sure audio is silent and muted
      window.audio.volume = 0;
      window.audio.muted = true;
      
      // Create a short silent sound and play it
      const silentPlay = window.audio.play();
      if (silentPlay !== undefined) {
        silentPlay.then(() => {
          // Immediately stop it
          debugLog("Silent play succeeded, pausing immediately");
          window.audio.pause();
          window.audio.currentTime = 0;
        }).catch(e => {
          // Silent failure is OK
          debugLog("Audio unlock attempt failed: " + e);
        });
      }
    } catch (e) {
      debugLog("Exception in unlockAudio: " + e);
    }
  } else {
    debugLog("Audio not available for unlocking: exists=" + !!window.audio + ", loaded=" + !!window.audioLoaded);
  }
  
  // Remove the event listener after first interaction
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('click', unlockAudio);
}

// Add listeners for both touch and click events
document.addEventListener('touchstart', unlockAudio, false);
document.addEventListener('click', unlockAudio, false); 