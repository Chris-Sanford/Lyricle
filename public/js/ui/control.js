import { debugLog } from '../debug.js';

// Add a new helper function to update mute button UI
function updateMuteButtonUI(isMuted) {
    const mainIcon = document.getElementById("muteButtonIcon");
    const modalIcon = document.getElementById("muteButtonIcon2");
    const className = isMuted ? "fa-solid fa-volume-xmark" : "fas fa-volume-up";
  
    if (mainIcon) {
      mainIcon.className = className;
    }
    if (modalIcon) {
      modalIcon.className = className;
    }
    debugLog(`UI Update: Mute buttons set to ${isMuted ? 'muted' : 'unmuted'} icon`);
}

export { updateMuteButtonUI };