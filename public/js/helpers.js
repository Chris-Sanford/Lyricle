// helpers.js
import { debugLog } from './debug.js'; // Import debugLog

// Detect mobile devices
export function isMobileDevice() {
  // Check user agent for common mobile identifiers
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
  
  // Primarily rely on the user agent string which is more indicative of mobile OS/browsers
  const isMobileUA = mobileRegex.test(userAgent);

  debugLog(`Device Check: UA = ${userAgent}, isMobileUA = ${isMobileUA}`);
  
  return isMobileUA;
}

// Split a line for display based on max length
export function splitLineForDisplay(line, maxLineLength) {
  // if the line is less than or equal to the maxLineLength, return the line as is
  if (line.length <= maxLineLength) {
    return [line];
  }

  // Calculate total number of lines to create
  // This is determined by dividing the length of the line by the maxLineLength and rounding up
  var totalLines = Math.ceil(line.length / maxLineLength);

  // Calculate the max number of characters per line for this specific provided line
  // This is based on the length of the line divided by the total number of lines
  var maxCharsPerLine = Math.ceil(line.length / totalLines);

  // Initialize newLines array
  var newLines = [];

  // For each word in the original line
  var words = line.split(" ");
  var i = 0;
  while (i < words.length) {
    // Initialize a new line
    var newLine = "";

    // While the new line is less than the maxCharsPerLine and there are still words left
    while (newLine.length < maxCharsPerLine && i < words.length) {
      // Add the next word to the new line
      newLine += words[i] + " ";
      i++;
    }

    // Push the new line to the newLines array
    newLines.push(newLine.trim());
  }

  // Return the newLines array
  return newLines;
}

// Get the integer value (1-365/366) of the day of the year
export function getDayInt() { 
  var now = new Date(); // create a new Date object
  var start = new Date(now.getFullYear(), 0, 0); // create a new Date object for the start of the year
  var diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000; // calculate the difference between the two dates
  var oneDay = 1000 * 60 * 60 * 24; // calculate the number of milliseconds in a day
  var day = Math.floor(diff / oneDay); // calculate the day of the year
  return day
}

// Sanitize input by removing special characters and diacritics
export function sanitizeInput(input) {
  // Sanitize the input to remove any special characters and diacritics for comparison
  var sanitizedInput = input
  .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, "") // disallow any input that isn't a standard English letter or number
  .toLowerCase() // make all letters lowercase
  .normalize("NFD") // decompose letters and diatrics
  .replace(/\p{Diacritic}/gu, ''); // replace them with non-accented characters

  return sanitizedInput;
}
