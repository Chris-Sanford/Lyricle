// Default game configuration
export const CONFIG = {
  startingLifelines: 3,
  maxLines: 6,
  maxChars: 120,
  debugMode: true
};

// Initial game state
const initialState = {
  wordsCorrect: 0,
  wordsToGuess: 0,
  lastLine: 0,
  lifelines: CONFIG.startingLifelines,
  focusedBoxIndex: 0,
  inputCounter: 0,
  startTime: null,
  endTime: null,
  currentSong: null,
  isAudioLoaded: false,
  isAudioMuted: false
};

// State management using pub/sub pattern
class GameStateManager {
  constructor() {
    this.state = { ...initialState };
    this.listeners = [];
    this.CONFIG = CONFIG;  // Also keep it as an instance property
  }

  getState() {
    return { ...this.state };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  setState(updates) {
    this.state = {
      ...this.state,
      ...updates
    };
    this.notify();
  }

  resetState() {
    this.state = { ...initialState };
    this.notify();
  }

  startGame(song) {
    const wordsToGuess = song.lyrics.filter(lyric => lyric.toGuess).length;
    
    this.setState({
      wordsCorrect: 0,
      wordsToGuess,
      lastLine: 0,
      lifelines: CONFIG.startingLifelines,
      focusedBoxIndex: 0,
      inputCounter: 0,
      startTime: null,
      endTime: null,
      currentSong: song,
      isAudioMuted: true
    });
  }

  incrementWordsCorrect() {
    this.setState({ wordsCorrect: this.state.wordsCorrect + 1 });
    return this.state.wordsCorrect === this.state.wordsToGuess;
  }

  useLifeline() {
    if (this.state.lifelines > 0) {
      this.setState({ lifelines: this.state.lifelines - 1 });
      return true;
    }
    return false;
  }

  startTimer() {
    if (!this.state.startTime) {
      this.setState({ startTime: Date.now() });
    }
  }

  endTimer() {
    this.setState({ endTime: Date.now() });
  }

  toggleAudioMute() {
    this.setState({ isAudioMuted: !this.state.isAudioMuted });
    return !this.state.isAudioMuted;
  }

  setAudioLoaded(loaded) {
    this.setState({ isAudioLoaded: loaded });
  }
}

export const gameState = new GameStateManager(); 