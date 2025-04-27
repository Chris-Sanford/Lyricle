// stats.js
import { debugLog } from './debug.js';

// Statistics tracking variables
let wordsCorrect = 0;
let wordsToGuess = 0;
let inputCounter = 0;

// Statistics functions
function getCompletionStats(lifelinesCount, elapsedTime) {
    // Ensure we have valid numbers to prevent NaN issues
    const safeWordsCorrect = wordsCorrect || 0;
    const safeWordsToGuess = wordsToGuess || 1; // Prevent division by zero
    
    const percentageComplete = safeWordsToGuess > 0 ? 
        Math.round((safeWordsCorrect / safeWordsToGuess) * 100) : 100;
      
    return {
        wordsCorrect: safeWordsCorrect,
        wordsToGuess: safeWordsToGuess,
        percentageComplete: percentageComplete,
        lifelinesRemaining: lifelinesCount || 0,
        elapsedTime: elapsedTime || 0,
        inputCounter: inputCounter || 0
    };
}

function incrementWordsCorrect() {
    wordsCorrect++;
    debugLog(`Stats: Incremented wordsCorrect to ${wordsCorrect} of ${wordsToGuess}`);
    return wordsCorrect === wordsToGuess; // Return true if game is complete
}

function setWordsToGuess(count) {
    wordsToGuess = count;
    debugLog(`Stats: Set wordsToGuess to ${count}`);
}

function incrementInputCounter() {
    inputCounter++;
}

function resetStats() {
    wordsCorrect = 0;
    wordsToGuess = 0;
    inputCounter = 0;
    debugLog("Stats: Reset all statistics");
}

// Export as an ES module
export const Stats = {
    getCompletionStats,
    incrementWordsCorrect,
    setWordsToGuess,
    incrementInputCounter,
    resetStats,
    // Export variables as getters
    get wordsCorrect() { return wordsCorrect; },
    get wordsToGuess() { return wordsToGuess; }
};

// Also set on window for backward compatibility
window.Stats = Stats;
