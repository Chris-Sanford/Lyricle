// stats.js

// Statistics tracking variables
let wordsCorrect = 0;
let wordsToGuess = 0;
let inputCounter = 0;

// Statistics functions
function getCompletionStats(lifelinesCount, elapsedTime) {
    const percentageComplete = wordsToGuess > 0 ? 
        Math.round((wordsCorrect / wordsToGuess) * 100) : 100;
      
    return {
        wordsCorrect,
        wordsToGuess,
        percentageComplete: percentageComplete,
        lifelinesRemaining: lifelinesCount,
        elapsedTime: elapsedTime,
        inputCounter
    };
}

function incrementWordsCorrect() {
    wordsCorrect++;
    return wordsCorrect === wordsToGuess; // Return true if game is complete
}

function setWordsToGuess(count) {
    wordsToGuess = count;
}

function incrementInputCounter() {
    inputCounter++;
}

function resetStats() {
    wordsCorrect = 0;
    wordsToGuess = 0;
    inputCounter = 0;
}

// Export functions for use in game.js
window.Stats = {
    getCompletionStats,
    incrementWordsCorrect,
    setWordsToGuess,
    incrementInputCounter,
    resetStats
};
