// stopwatch.js - Handles game timing functionality

let startTime = null;
let endTime = null;
let interval = null;

// Start the stopwatch and update elapsed time every second
function start() {
  startTime = Date.now();
  interval = setInterval(function() {
    var elapsedTime = Date.now() - startTime;
  }, 1000);
}

// Stop the stopwatch and record end time
function stop() {
  clearInterval(interval);
  endTime = Date.now();
}

// Reset the stopwatch to initial state
function reset() {
  clearInterval(interval);
  startTime = null;
  endTime = null;
}

// Get the current elapsed time in milliseconds
function getElapsedTime() {
  if (!startTime) return 0;
  return endTime ? (endTime - startTime) : (Date.now() - startTime);
}

// Get formatted time as minutes and seconds
function getFormattedTime() {
  const totalTime = getElapsedTime();
  const totalSeconds = totalTime / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return { minutes, seconds };
}

// Export as an ES module
export const Stopwatch = {
  start,
  stop,
  reset,
  getElapsedTime,
  getFormattedTime,
  get startTime() { return startTime; },
  get endTime() { return endTime; }
};

// Also set on window for backward compatibility
window.Stopwatch = Stopwatch;
