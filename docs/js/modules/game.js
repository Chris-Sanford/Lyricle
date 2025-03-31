import { gameState } from './state.js';
import { audioManager } from './audio.js';
import { keyboardManager } from './keyboard.js';
import { uiManager } from './ui.js';
import { getDayInt, sanitizeInput, getPercentageCorrect } from './utils.js';

class GameManager {
  constructor() {
    this.allSongData = [];
    this.init();
  }

  async init() {
    await this.loadSongData();
    this.setupGame();
    this.displayHowToPlay();
  }

  async loadSongData() {
    try {
      const response = await fetch('https://pub-9d70620f0c724e4595b80ff107d19f59.r2.dev/gameData.json');
      this.allSongData = await response.json();
    } catch (error) {
      console.error('Failed to load song data:', error);
      this.allSongData = [];
    }
  }

  setupGame() {
    const day = getDayInt();
    let songData = this.allSongData[day];
    
    if (!songData) {
      songData = this.allSongData[Math.floor(Math.random() * this.allSongData.length)];
    }

    const song = this.constructSongObject(songData);
    this.startGame(song);
  }

  constructSongObject(songData) {
    const lyrics = this.constructLyricObjects(songData.chorus);
    return {
      title: songData.title,
      artist: songData.artist,
      preview: songData.preview_url,
      lyrics
    };
  }

  constructLyricObjects(chorus) {
    const lines = chorus.split('\n');
    const lyrics = [];
    let boxIndex = 0;
    let charCount = 0;
    let lineCount = 0;

    for (const line of lines) {
      if (lineCount >= gameState.CONFIG.maxLines || 
          charCount >= gameState.CONFIG.maxChars) break;

      const lineCharCount = line.replace(/\s/g, '').length;
      if (charCount + lineCharCount >= gameState.CONFIG.maxChars) break;

      const words = this.processLine(line, boxIndex, lineCount);
      lyrics.push(...words);
      boxIndex += words.length;
      charCount += lineCharCount;
      lineCount++;
    }

    return lyrics;
  }

  processLine(line, startBoxIndex, lineIndex) {
    const splitBySpaces = line.split(' ');
    const processedWords = [];

    for (const word of splitBySpaces) {
      const spaceLeft = /^[^a-zA-Z0-9\s\u00C0-\u017F'*]/.test(word);
      const spaceRight = /[^a-zA-Z0-9\s\u00C0-\u017F'*]$/.test(word);
      
      const splitWords = word.split(/([^a-zA-Z0-9\s\u00C0-\u017F'*])/).filter(Boolean);
      
      splitWords.forEach((splitWord, index) => {
        const isSpecial = /^[^a-zA-Z0-9\s\u00C0-\u017F'*]/.test(splitWord);
        const contentComparable = sanitizeInput(splitWord);
        const toGuess = lineIndex !== 0 && /^[a-zA-Z]+$/.test(contentComparable);

        processedWords.push({
          boxIndex: startBoxIndex + processedWords.length,
          lineIndex,
          content: splitWord,
          contentComparable,
          toGuess,
          spaceLeft: index === 0 && spaceLeft,
          spaceRight: index === splitWords.length - 1 && spaceRight,
          isSpecial
        });
      });
    }

    return processedWords;
  }

  startGame(song) {
    // Reset UI
    document.getElementById('lyricsGrid').innerHTML = '';
    document.getElementById('songTitleName').innerHTML = '';
    document.getElementById('songTitleArtist').innerHTML = '';
    document.getElementById('oskbRow1Col1').innerHTML = '';

    const statsButton = document.getElementById('statsButton');
    if (statsButton) statsButton.remove();

    // Initialize game state
    gameState.startGame(song);

    // Update UI
    uiManager.updateSongTitle(song);
    uiManager.constructLyricInputBoxes(song);
    keyboardManager.init();

    // Setup audio
    audioManager.setSource(song.preview);
  }

  checkCorrectness(input, lyric) {
    const comparableInput = sanitizeInput(input.innerText);
    const percentageCorrect = getPercentageCorrect(comparableInput, lyric.contentComparable);
    
    uiManager.updateLyricBoxStyle(input, percentageCorrect);

    if (comparableInput === lyric.contentComparable) {
      this.handleCorrectGuess(input, lyric);
      return true;
    }
    return false;
  }

  handleCorrectGuess(input, lyric) {
    input.innerText = lyric.content;
    input.classList.add('lyricle-lyrics-input-correct');
    input.parentElement.classList.add('lyricle-lyrics-input-correct');
    input.disabled = true;
    input.contentEditable = false;

    const isGameComplete = gameState.incrementWordsCorrect();
    if (isGameComplete) {
      this.completeGame();
    } else {
      keyboardManager.selectNextInput(input);
    }
  }

  completeGame() {
    gameState.endTimer();
    audioManager.play();
    uiManager.showGameCompleteModal();
  }

  displayHowToPlay() {
    const modalElement = document.getElementById('howToPlay');
    if (!modalElement) return;

    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    modalElement.addEventListener('hidden.bs.modal', () => {
      keyboardManager.focusFirstUnfilledLyric();
    });
  }

  getRandomSong() {
    const randomSong = this.allSongData[Math.floor(Math.random() * this.allSongData.length)];
    audioManager.stop();
    this.startGame(this.constructSongObject(randomSong));
  }
}

export const gameManager = new GameManager(); 