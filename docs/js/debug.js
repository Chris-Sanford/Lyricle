// debug.js - Debugging utilities for Lyricle

// Debug mode flag - can be overridden
let debugMode = true;

/**
 * Log a debug message if debug mode is enabled
 * @param {string} message - The message to log
 * @param {string} [category='AUDIO'] - The category of the debug message
 */
function debugLog(message, category = 'AUDIO') {
    if (debugMode) {
        console.log(`${category} DEBUG: ${message}`);
    }
}

// Export debug utilities to global scope for use in game.js
window.debugMode = debugMode;
window.debugLog = debugLog;
