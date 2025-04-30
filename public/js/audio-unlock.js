// audio-unlock.js - iOS audio unlock functionality
import { debugLog } from './debug.js';
import { AudioController } from './audio.js';

// Silent MP3 URL - Cloudflare-hosted silent audio file
const SILENT_AUDIO_URL = 'https://pub-80d8bcad9fb844fbbea8be958b02b606.r2.dev/250-milliseconds-of-silence.mp3';
let iOSAudio = null;

// Add a document-wide touch/click handler to help unlock audio on iOS
function unlockAudio() {
  // Only run if audio exists and context isn't already unlocked
  if (!AudioController.audio || AudioController.audioContextUnlocked) {
    debugLog(`Audio unlock not needed/possible - Exists: ${!!AudioController.audio}, Unlocked: ${AudioController.audioContextUnlocked}`);
    return;
  }

  debugLog("unlockAudio called from document event - Attempting global unlock");
  
  // Try both methods for maximum compatibility
  unlockWithSilentFile();
  unlockWithExistingAudio();
}

// Unlock audio using a silent MP3 file - more reliable for iOS
function unlockWithSilentFile() {
  try {
    if (!iOSAudio) {
      // Create a new audio element with silent audio
      iOSAudio = new Audio(SILENT_AUDIO_URL);
      iOSAudio.loop = false;
      iOSAudio.muted = true;
      iOSAudio.volume = 0;
      iOSAudio.setAttribute('playsinline', '');
      iOSAudio.setAttribute('webkit-playsinline', '');
      
      iOSAudio.addEventListener('ended', function() {
        // Once the silent audio has played, the audio context is unlocked
        debugLog("Silent iOS audio playback completed successfully");
        AudioController.audioContextUnlocked = true;
        // Clean up the reference
        iOSAudio = null;
      });
      
      iOSAudio.addEventListener('error', function(e) {
        debugLog("Silent iOS audio error: " + (e.message || e));
        // Don't hold the reference if it fails
        iOSAudio = null;
      });
    }
    
    // Play the silent audio to unlock the audio context
    const playPromise = iOSAudio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        debugLog("Silent iOS audio playback started");
      }).catch(function(error) {
        debugLog("iOS silent audio playback failed: " + error);
        // Clean up if failed
        iOSAudio = null;
      });
    }
  } catch (e) {
    debugLog("Exception in unlockWithSilentFile: " + e);
    iOSAudio = null;
  }
}

// Try to unlock using the existing audio element
function unlockWithExistingAudio() {
  const audioInstance = AudioController.audio;
  if (!audioInstance) return;
    
  try {
    // Store original state
    const originalMuted = audioInstance.muted;
    const originalVolume = audioInstance.volume;
    const originalTime = audioInstance.currentTime;
    const wasPlaying = !audioInstance.paused;
    
    // Attempt to play while completely silent
    audioInstance.muted = true;
    audioInstance.volume = 0;
    
    const silentPlay = audioInstance.play();
    if (silentPlay !== undefined) {
      silentPlay.then(() => {
        // Immediately pause and restore state
        debugLog("Silent unlock play succeeded, pausing immediately");
        
        // Only pause if it wasn't playing before
        if (!wasPlaying) {
          audioInstance.pause();
        }
        
        // Restore original state
        audioInstance.muted = originalMuted;
        audioInstance.volume = originalVolume;
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
          audioInstance.pause();
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
    debugLog("Exception in unlockWithExistingAudio: " + e);
  }
}

// Detect iOS device
const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Add listeners for both touch and click events - using more aggressive approach for iOS
// Using capture phase to intercept events as early as possible
document.addEventListener('touchstart', unlockAudio, { once: true, passive: true, capture: true });
document.addEventListener('click', unlockAudio, { once: true, passive: true, capture: true });

// For iOS Safari, ensure any user gesture can potentially unlock audio
document.addEventListener('touchend', unlockAudio, { once: true, passive: true, capture: true });

// Add additional listeners for iOS
if (isiOS) {
  debugLog("iOS device detected, adding extra unlock handlers");
  // Add keyboard events for iOS
  document.addEventListener('keydown', unlockAudio, { once: true, passive: true, capture: true });
}

// Add more resilient approach with multiple attempts
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

// Export the unlockAudio function
export { unlockAudio }; 