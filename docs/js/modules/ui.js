import { gameState, CONFIG } from './state.js';
import { audioManager } from './audio.js';
import { calculateOptimizedLyricBoxWidth, setLyricBoxBorderBottomStyle } from './utils.js';
import { gameManager } from './game.js';

class UIManager {
  constructor() {
    this.bindEvents();
    this.setupDebugMode();
  }

  setupDebugMode() {
    if (CONFIG.debugMode) {
      const topBarLeftButtons = document.getElementById('topBarLeftButtons');
      if (topBarLeftButtons) {
        const randomButton = document.createElement('button');
        randomButton.className = 'btn lyricle-icon-button';
        randomButton.innerHTML = '<i class="fas fa-dice"></i>';
        randomButton.title = 'Load Random Song';
        randomButton.onclick = () => gameManager.getRandomSong();
        topBarLeftButtons.appendChild(randomButton);
      }
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.adjustLyricLineHeights();
      this.adjustLyricContentPosition();
    });
  }

  updateSongTitle(song) {
    const songTitleDiv = document.getElementById('songTitle');
    const songTitleNameDiv = document.getElementById('songTitleName');
    const artistDiv = document.getElementById('songTitleArtist');
    
    if (!songTitleDiv || !songTitleNameDiv || !artistDiv) return;

    const fontSize = 1.2 - (((song.title.length + song.artist.length) - 20) * 0.015);
    songTitleDiv.style.fontSize = `${fontSize}em`;
    songTitleNameDiv.innerHTML = `<b>${song.title}</b>`;
    artistDiv.innerHTML = song.artist;

    const howToPlayText = document.getElementById('objectiveText');
    if (howToPlayText) {
      howToPlayText.innerHTML = `Guess the lyrics to today's song, <b>${song.title}</b> by <b>${song.artist}</b>!`;
    }
  }

  constructLyricInputBoxes(song) {
    const lyricsGridContainer = document.getElementById('lyricsGrid');
    if (!lyricsGridContainer) return;

    lyricsGridContainer.innerHTML = '';
    lyricsGridContainer.style.width = '100%';
    lyricsGridContainer.style.maxWidth = '100%';
    lyricsGridContainer.style.margin = '0 auto';

    let lineIndex = 0;
    let lyricsToDisplay = song.lyrics.filter(lyric => lyric.lineIndex === lineIndex);

    while (lyricsToDisplay && lyricsToDisplay.length > 0) {
      const row = this.createLyricRow();
      const col = this.createLyricColumn();
      row.appendChild(col);

      lyricsToDisplay.forEach(lyric => {
        const div = this.createLyricBox(lyric);
        col.appendChild(div);
      });

      lyricsGridContainer.appendChild(row);
      lineIndex++;
      lyricsToDisplay = song.lyrics.filter(lyric => lyric.lineIndex === lineIndex);
    }

    setTimeout(() => {
      this.adjustLyricLineHeights();
      this.adjustLyricContentPosition();
    }, 100);
  }

  createLyricRow() {
    const row = document.createElement('div');
    row.classList.add('row', 'lyricle-lyrics-row');
    row.style.maxWidth = '100%';
    row.style.width = '100%';
    row.style.marginTop = '0.15em';
    row.style.marginBottom = '0.15em';
    return row;
  }

  createLyricColumn() {
    const col = document.createElement('div');
    col.classList.add('col', 'lyricle-lyrics-col', 'lyricle-lyrics-flex-wrap');
    col.style.maxWidth = '100%';
    col.style.margin = '0 auto';
    col.style.padding = '0 3px';
    return col;
  }

  createLyricBox(lyric) {
    const div = document.createElement('div');
    div.id = `lyricInputDiv${lyric.boxIndex}`;
    div.classList.add('lyricle-lyrics-div');

    if (lyric.isSpecial) {
      div.classList.add('lyricle-lyrics-div-special');
      if (lyric.spaceLeft) div.classList.add('lyricle-lyrics-div-space-left');
      if (lyric.spaceRight) div.classList.add('lyricle-lyrics-div-space-right');
    }

    const width = calculateOptimizedLyricBoxWidth(lyric.content);
    div.style.width = `${width}px`;
    div.style.maxWidth = 'calc(100vw - 25px)';
    div.style.marginLeft = '3px';
    div.style.marginRight = '3px';

    const input = document.createElement('span');
    input.classList.add('input', 'lyricle-lyrics-input');
    input.role = 'textbox';
    input.id = `lyricInput${lyric.boxIndex}`;

    if (!lyric.toGuess) {
      input.innerText = lyric.content;
      div.classList.add('lyricle-lyrics-input-noguess');
      div.style.borderBottom = '4px solid rgba(255, 255, 255, 0.001)';
      input.disabled = true;
      input.contentEditable = false;
    } else {
      div.style.borderBottom = '4px solid rgba(255, 255, 255, 0.99)';
    }

    div.appendChild(input);
    return div;
  }

  adjustLyricLineHeights() {
    const lyricsRows = document.querySelectorAll('.lyricle-lyrics-row');
    
    lyricsRows.forEach(row => {
      const col = row.querySelector('.lyricle-lyrics-col');
      if (!col) return;
      
      row.style.height = 'auto';
      row.style.minHeight = 'auto';
      
      const contentHeight = col.offsetHeight;
      const newHeight = `${contentHeight + 2}px`;
      
      row.style.height = newHeight;
      row.style.minHeight = newHeight;
    });
  }

  adjustLyricContentPosition() {
    const songTitle = document.getElementById('songTitle');
    const lyricsContainer = document.getElementById('lyrics');
    const lyricsGrid = document.getElementById('lyricsGrid');
    const oskbContainer = document.getElementById('oskb');
    
    if (!songTitle || !lyricsContainer || !lyricsGrid || !oskbContainer) return;
    
    const viewportHeight = window.innerHeight;
    const songTitleBottom = songTitle.getBoundingClientRect().bottom;
    const oskbHeight = oskbContainer.offsetHeight;
    const availableHeight = viewportHeight - songTitleBottom - oskbHeight - 15;
    
    lyricsContainer.style.height = `${availableHeight}px`;
    lyricsContainer.style.position = 'relative';
    lyricsContainer.style.left = '0';
    lyricsContainer.style.right = '0';
    lyricsContainer.style.width = '100%';
    
    const lyricsGridHeight = lyricsGrid.offsetHeight;
    
    if (lyricsGridHeight < availableHeight) {
      const verticalMargin = Math.max(5, Math.floor((availableHeight - lyricsGridHeight) / 2));
      lyricsGrid.style.marginTop = `${verticalMargin}px`;
      lyricsGrid.style.marginBottom = `${verticalMargin}px`;
    } else {
      lyricsGrid.style.marginTop = '5px';
      lyricsGrid.style.marginBottom = '5px';
    }
    
    lyricsGrid.style.position = 'relative';
    lyricsGrid.style.top = '0';
    lyricsGrid.style.transform = 'none';
    
    this.checkAndPreventHorizontalOverflow();
  }

  checkAndPreventHorizontalOverflow() {
    const lyricsRows = document.querySelectorAll('.lyricle-lyrics-row');
    const viewportWidth = window.innerWidth;
    
    lyricsRows.forEach(row => {
      const col = row.querySelector('.lyricle-lyrics-col');
      if (!col) return;
      
      const children = col.children;
      let totalRowWidth = 0;
      
      for (const child of children) {
        totalRowWidth += child.offsetWidth + 6;
      }
      
      if (totalRowWidth > viewportWidth) {
        col.style.flexWrap = 'wrap';
        col.style.maxWidth = '100%';
        col.style.justifyContent = 'center';
      }
    });
  }

  showAlert(message, type = 'warning') {
    const alertsDiv = document.getElementById('alerts');
    if (!alertsDiv) return;

    const alertHTML = `
      <div class="alert alert-${type}" role="alert">
        <span id="alertText">${message}</span>
      </div>
    `;
    alertsDiv.innerHTML = alertHTML;

    setTimeout(() => {
      alertsDiv.innerHTML = '';
    }, 3000);
  }

  showGameCompleteModal() {
    const state = gameState.getState();
    if (!state.currentSong) return;

    const modalContent = this.createGameCompleteModalContent(state);
    const modalElement = document.getElementById('gameCompleteModal');
    
    if (modalElement) {
      modalElement.remove();
    }

    document.body.appendChild(modalContent);
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  createGameCompleteModalContent(state) {
    // Create modal structure
    const modal = document.createElement('div');
    modal.classList.add('modal', 'fade');
    modal.id = 'gameCompleteModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'gameCompleteModalLabel');
    modal.setAttribute('aria-hidden', 'true');

    // Add modal content (header, body, footer)
    // ... (implement the detailed modal content creation)
    
    return modal;
  }
}

export const uiManager = new UIManager(); 