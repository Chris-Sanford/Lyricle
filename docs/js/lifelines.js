import { debugLog } from './debug.js';

// Modified useLifeline function to properly apply lifelines
function useLifeline(song, button, callbacks) { // Receive callbacks instead of using globals directly
    // Get the lifelines from the callbacks
    const lifelines = callbacks.getLifelines();
    const startingLifelines = callbacks.getStartingLifelines();
    
    // If lifelines is 0, show concede modal
    if (lifelines <= 0) { // Check <= 0 just in case
      debugLog("Lifelines are zero, showing concede modal");
      callbacks.displayConcedeModal(song);
      return;
    }
  
    // If the stopwatch hasn't been started, start it
    if (callbacks.isStopwatchStarted && !callbacks.isStopwatchStarted()) {
      callbacks.startStopwatch();
    }
  
    // Increment the input counter via Stats
    callbacks.incrementInputCounter();
  
    // Decrement the lifelines remaining
    callbacks.decrementLifelines();
  
    // Update all lifeline displays (Keyboard and potentially old button)
    callbacks.updateLifelineDisplay();
  
    // Actually apply the lifeline to reveal characters in all lyric boxes
    // Calculate how many characters to reveal based on lifelines used
    const charsToReveal = startingLifelines - callbacks.getLifelines();
  
    // Loop through each lyric input to apply the hint
    for (var i = 0; i < song.lyrics.length; i++) {
      // Get the lyricInput element
      var lyricInput = document.getElementById("lyricInput" + i);
  
      // Skip lyrics that don't need to be guessed or are already correct
      if (!lyricInput ||
          !song.lyrics[i].toGuess ||
          lyricInput.parentElement.classList.contains("lyricle-lyrics-input-correct")) {
        continue;
      }
  
      // Get the actual content without special characters
      const correctWord = song.lyrics[i].content;
      const correctLetters = correctWord.replace(/[^a-zA-Z]/g, '');
  
      // Skip single letter words
      if (correctLetters.length <= 1) {
        continue;
      }
  
      // Calculate how many letters we can reveal without completing the word
      const maxRevealable = correctLetters.length - 1;
      const lettersToReveal = Math.min(charsToReveal, maxRevealable);
  
      // Build revealed string by taking letters from the original word
      let revealedString = '';
      let letterCount = 0;
      for (let j = 0; j < correctWord.length && letterCount < lettersToReveal; j++) {
        // Only reveal letters
        if (/[a-zA-Z]/.test(correctWord[j])) {
            revealedString += correctWord[j];
            letterCount++;
        } else {
            // Include non-letters if they appear before the revealed letter count is met
             if (j < lettersToReveal) { // A bit simplified, might need refinement
                 revealedString += correctWord[j];
             }
        }
      }
  
      // Set the revealed characters in the input
      lyricInput.innerText = revealedString;
  
      // Update border based on new (incomplete) input
       const comparableInput = revealedString
          .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, '');
      const percentageCorrect = callbacks.getPercentageCorrect(comparableInput, song.lyrics[i].contentComparable);
      const opacity = 1.00 - percentageCorrect;
  
      // Check if the *active* input is the one we just changed
      const isActive = callbacks.isActiveInput && callbacks.isActiveInput(lyricInput);
  
      callbacks.setLyricBoxBorderBottomStyle(lyricInput, {
          width: 4,
          color1: isActive ? 0 : 255,    // Blue if active, white otherwise
          color2: isActive ? 115 : 255,
          color3: isActive ? 255 : 255,
          opacity: opacity
      });
  
      // Check if this *happened* to complete the word
      callbacks.checkCorrectness(lyricInput, song);
    }
  
    // Styling based on remaining lifelines is handled within updateLifelineDisplay
    debugLog("Lifeline applied successfully");
}

export { useLifeline };