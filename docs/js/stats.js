// stats.js

// Statistics tracking variables
let wordsCorrect = 0;
let wordsToGuess = 0;
let inputCounter = 0;

// Statistics functions
function getCompletionStats() {
    return {
        wordsCorrect,
        wordsToGuess,
        percentageComplete: Math.floor((wordsCorrect / wordsToGuess) * 100),
        inputCounter,
        lifelines // This is still defined in game.js but accessed here
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
