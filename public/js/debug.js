// debug.js - Debugging utilities for Lyricle

// Debug mode flag - can be overridden
export let debugMode = true;

/**
 * Log a debug message if debug mode is enabled
 * @param {string} message - The message to log
 * @param {string} [category='AUDIO'] - The category of the debug message
 */
export function debugLog(message, category = 'AUDIO') {
    if (debugMode) {
        console.log(`DEBUG: ${message}`);
    }
}

// Remove global scope assignments as we now use exports
// window.debugMode = debugMode;
// window.debugLog = debugLog;
