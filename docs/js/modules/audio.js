import { gameState } from './state.js';
import { debugLog } from './utils.js';

class AudioManager {
  constructor() {
    this.audio = document.getElementById('hiddenAudio');
    this.setupAudioElement();
    this.bindEvents();
  }

  setupAudioElement() {
    if (!this.audio) return;
    
    this.audio.volume = 0;
    this.audio.muted = true;
    this.audio.pause();
    this.audio.autoplay = false;
  }

  bindEvents() {
    if (!this.audio) return;

    this.audio.addEventListener('play', () => debugLog('Audio PLAY event triggered'));
    this.audio.addEventListener('playing', () => debugLog('Audio PLAYING event triggered'));
    this.audio.addEventListener('pause', () => debugLog('Audio PAUSE event triggered'));
    this.audio.addEventListener('canplay', () => debugLog('Audio CANPLAY event triggered'));
    this.audio.addEventListener('loadstart', () => debugLog('Audio LOADSTART event triggered'));
    this.audio.addEventListener('error', (e) => debugLog(`Audio ERROR event triggered: ${e}`));
    
    this.audio.addEventListener('canplaythrough', () => {
      gameState.setAudioLoaded(true);
      debugLog('Audio loaded and ready to play');
      
      if (!gameState.getState().endTime) {
        this.audio.muted = true;
        this.audio.volume = 0;
        debugLog('Ensuring audio remains muted after loading (game not completed)');
      }
    });
  }

  async unlockAudio() {
    debugLog('unlockAudio called');
    
    if (!this.audio || !gameState.getState().isAudioLoaded) {
      debugLog('Audio not available for unlocking');
      return;
    }

    try {
      this.audio.volume = 0;
      this.audio.muted = true;
      
      const silentPlay = this.audio.play();
      if (silentPlay !== undefined) {
        await silentPlay;
        debugLog('Silent play succeeded, pausing immediately');
        this.audio.pause();
        this.audio.currentTime = 0;
      }
    } catch (e) {
      debugLog(`Audio unlock attempt failed: ${e}`);
    }
  }

  async play() {
    debugLog('play called');
    
    if (!this.audio || gameState.getState().isAudioMuted) {
      debugLog('Audio is muted or not available, not playing');
      return;
    }

    try {
      this.audio.volume = 0.2;
      this.audio.muted = false;
      debugLog('Setting volume to 0.2');
      
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        debugLog('Audio playback started successfully');
      }
    } catch (e) {
      debugLog(`Playback error: ${e}`);
      this.updateMuteButton(true);
    }
  }

  stop() {
    debugLog('stop called');
    if (this.audio) {
      this.audio.pause();
      try {
        this.audio.currentTime = 0;
      } catch (e) {
        debugLog(`Error resetting audio: ${e}`);
      }
    }
  }

  setSource(url) {
    if (!this.audio) return;
    
    this.audio.volume = 0;
    this.audio.muted = true;
    this.audio.pause();
    
    debugLog(`Setting audio source: ${url}`);
    this.audio.src = url;
    this.audio.preload = 'auto';
  }

  updateMuteButton(isMuted) {
    const muteButton = document.getElementById('muteButtonIcon');
    if (muteButton) {
      muteButton.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fas fa-volume-up';
    }
    
    const muteButton2 = document.getElementById('muteButtonIcon2');
    if (muteButton2) {
      muteButton2.className = muteButton.className;
    }
  }

  toggle() {
    const isMuted = gameState.toggleAudioMute();
    this.updateMuteButton(isMuted);
    
    if (!isMuted && gameState.getState().endTime) {
      this.play();
    } else {
      this.stop();
    }
  }
}

export const audioManager = new AudioManager(); 