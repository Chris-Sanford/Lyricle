import { gameState } from './state.js';
import { isMobileDevice, debugLog } from './utils.js';

const KEYBOARD_LAYOUT = {
  row1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  row2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  row3: ['z', 'x', 'c', 'v', 'b', 'n', 'm']
};

const ALLOWED_KEYS = [
  'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
  ...KEYBOARD_LAYOUT.row1,
  ...KEYBOARD_LAYOUT.row2,
  ...KEYBOARD_LAYOUT.row3
];

class KeyboardManager {
  constructor() {
    this.activeInputElement = null;
    this.customKeyboardEnabled = true;
  }

  init() {
    this.constructCustomKeyboard();
    this.preventNativeKeyboard();
    this.updateLifelineDisplay();
  }

  constructCustomKeyboard() {
    debugLog('Constructing custom keyboard');
    
    // First row
    this.constructKeyboardRow('oskbRow1Col1', KEYBOARD_LAYOUT.row1);
    
    // Second row
    this.constructKeyboardRow('oskbRow2Col1', KEYBOARD_LAYOUT.row2);
    
    // Third row (with special keys)
    const row3Container = document.getElementById('oskbRow3Col1');
    if (!row3Container) return;
    
    row3Container.innerHTML = '';
    
    // Add Lifeline button
    const lifelineKey = this.createLifelineKey();
    row3Container.appendChild(lifelineKey);
    
    // Add letter keys
    KEYBOARD_LAYOUT.row3.forEach(key => {
      const keyButton = this.createKeyButton(key);
      row3Container.appendChild(keyButton);
    });
    
    // Add Backspace key
    const backspaceKey = this.createBackspaceKey();
    row3Container.appendChild(backspaceKey);
    
    this.adjustKeyboardLayout();
  }

  constructKeyboardRow(containerId, keys) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    keys.forEach(key => {
      const keyButton = this.createKeyButton(key);
      container.appendChild(keyButton);
    });
  }

  createKeyButton(key) {
    const keyButton = document.createElement('div');
    keyButton.className = 'lyricle-key';
    keyButton.textContent = key;
    keyButton.dataset.key = key;
    keyButton.addEventListener('click', (e) => this.handleKeyPress(e));
    return keyButton;
  }

  createLifelineKey() {
    const lifelineKey = document.createElement('div');
    lifelineKey.className = 'lyricle-key special-key wide-key lyricle-keyboard-lifeline';
    lifelineKey.id = 'keyboardLifelineButton';
    
    const heartIcon = document.createElement('i');
    heartIcon.className = 'fas fa-heart';
    lifelineKey.appendChild(heartIcon);
    
    const lifelineNumber = document.createElement('span');
    lifelineNumber.id = 'keyboardLifelineNumber';
    lifelineNumber.className = 'lyricle-keyboard-lifeline-number';
    lifelineNumber.innerText = gameState.getState().lifelines;
    lifelineKey.appendChild(lifelineNumber);
    
    lifelineKey.addEventListener('click', () => this.handleLifelineClick());
    
    return lifelineKey;
  }

  createBackspaceKey() {
    const backspaceKey = document.createElement('div');
    backspaceKey.className = 'lyricle-key special-key backspace-key';
    backspaceKey.innerHTML = '<i class="fas fa-delete-left"></i>';
    backspaceKey.dataset.key = 'Backspace';
    backspaceKey.addEventListener('click', (e) => this.handleKeyPress(e));
    return backspaceKey;
  }

  handleKeyPress(event) {
    const key = event.currentTarget.dataset.key;
    
    if (!this.activeInputElement) {
      this.focusFirstUnfilledLyric();
      if (!this.activeInputElement) return;
    }
    
    gameState.setState({ inputCounter: gameState.getState().inputCounter + 1 });
    
    if (key === 'Backspace') {
      this.handleBackspace();
    } else if (key === 'Enter') {
      this.selectNextInput();
    } else {
      this.handleCharacterInput(key);
    }
  }

  handleBackspace() {
    const text = this.activeInputElement.innerText;
    if (text.length > 0) {
      this.activeInputElement.innerText = text.slice(0, -1);
      this.checkCorrectness();
    }
  }

  handleCharacterInput(key) {
    const state = gameState.getState();
    const lyric = state.currentSong.lyrics[state.focusedBoxIndex];
    
    if (this.activeInputElement.innerText.length < lyric.content.length) {
      this.activeInputElement.innerText += key;
      this.checkCorrectness();
    }
  }

  handleLifelineClick() {
    const state = gameState.getState();
    if (state.currentSong && !state.endTime) {
      debugLog('Lifeline button clicked');
      // Call your lifeline logic here
    } else {
      debugLog('Lifeline button clicked but no active game');
    }
  }

  preventNativeKeyboard() {
    if (isMobileDevice() && this.customKeyboardEnabled) {
      document.addEventListener('focusin', (event) => {
        if (event.target.classList.contains('lyricle-lyrics-input')) {
          event.preventDefault();
          event.stopPropagation();
          this.activeInputElement = event.target;
          gameState.setState({ 
            focusedBoxIndex: parseInt(event.target.id.replace('lyricInput', ''))
          });
          return false;
        }
      });
    }
  }

  updateLifelineDisplay() {
    const state = gameState.getState();
    const keyboardLifelineNumber = document.getElementById('keyboardLifelineNumber');
    const keyboardLifelineButton = document.getElementById('keyboardLifelineButton');
    
    if (keyboardLifelineNumber) {
      keyboardLifelineNumber.innerText = state.lifelines;
    }
    
    if (keyboardLifelineButton) {
      keyboardLifelineButton.classList.toggle('btn-danger', state.lifelines === 1);
      
      if (state.lifelines === 0) {
        const lifelineIcon = keyboardLifelineButton.querySelector('i');
        if (lifelineIcon) {
          lifelineIcon.classList.remove('fa-heart');
          lifelineIcon.classList.add('fa-heart-crack');
        }
        
        if (keyboardLifelineNumber) {
          keyboardLifelineNumber.style.display = 'none';
        }
      }
    }
  }

  adjustKeyboardLayout() {
    setTimeout(() => {
      const oskbElement = document.getElementById('oskb');
      if (oskbElement) {
        debugLog(`Keyboard height after construction: ${oskbElement.offsetHeight}px`);
        
        oskbElement.style.display = 'none';
        void oskbElement.offsetHeight;
        oskbElement.style.display = 'block';
        
        const rows = oskbElement.querySelectorAll('.lyricle-oskb-row');
        rows.forEach(row => {
          row.style.visibility = 'visible';
          row.style.display = 'flex';
        });
      }
    }, 100);
  }

  focusFirstUnfilledLyric() {
    const state = gameState.getState();
    if (!state.currentSong) return;

    for (let i = 0; i < state.currentSong.lyrics.length; i++) {
      if (state.currentSong.lyrics[i].toGuess) {
        const input = document.getElementById(`lyricInput${i}`);
        if (input && !input.parentElement.classList.contains('lyricle-lyrics-input-correct')) {
          this.activeInputElement = input;
          gameState.setState({ focusedBoxIndex: i });
          input.focus();
          break;
        }
      }
    }
  }
}

export const keyboardManager = new KeyboardManager(); 