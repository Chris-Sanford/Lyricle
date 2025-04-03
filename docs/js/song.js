// song.js

// Class Constructors
// Construct the Lyric class
class Lyric {
  constructor(boxIndex, lineIndex, content, contentComparable, toGuess, spaceLeft, spaceRight, isSpecial) {
    this.boxIndex = boxIndex; // index of the lyric box, either word or puntuation
    this.lineIndex = lineIndex; // index of the which line (or row) the lyric box is in
    this.content = content; // the original content of the lyric
    this.contentComparable = contentComparable; // the content of the lyric in a format that can be compared
    this.toGuess = toGuess; // boolean value indicating whether the word should be guessed or not
    this.spaceLeft = spaceLeft; // boolean value indicating whether there is a space to the left of the word (for displaying punctuation well)
    this.spaceRight = spaceRight; // boolean value indicating whether there is a space to the right of the word (for displaying punctuation well)
    this.isSpecial = isSpecial; // boolean value indicating whether the word is a special character (punctuation, etc.)
  }
}

// Construct the Song class
class Song {
  constructor(title, artist, preview, lyrics) {
    this.title = title;
    this.artist = artist;
    this.preview = preview;
    this.lyrics = lyrics;
  }
}

// Define the function that creates Lyric objects from the chorus
function constructLyricObjects(chorus) {
  // Define the maximum number of lines to display in the game
  var maxLines = 6; // This actually results in 5 lines due to how the logic is written with indices

  // Define the maximum number of characters to display in the game
  var maxChars = 120;

  var lineCount = 0;
  var charCount = 0;

  // Split the chorus into lines (split by newline)
  var lines = chorus.split("\n");

  // Initialize an empty array to store the lyric objects
  var lyrics = [];

  // Set boxIndex to 0
  var boxIndex = 0;

  // Loop through each line
  for (var i = 0; i < lines.length; i++) {
    lineCount++;

    // If we've reached the maximum number of lines, break out of the loop
    if (lineCount >= maxLines) {
      break;
    }

    // If we've reached the maximum number of characters, break out of the loop
    if (charCount >= maxChars) {
      break;
    }

    var lineCharacterCountNoSpaces = lines[i].replace(/\s/g, '');

    // If the current character count plus the total combined length of all the words in the current line is greater than the maximum number of allowed characters, break out of the loop
    if (charCount + lineCharacterCountNoSpaces.length >= maxChars) {
      break;
    }

    // Split the line by spaces
    var splitBySpaces = lines[i].split(" ");

    // Initialize an array to store "preformatWords"
    var preformatWords = [];

    // Loop through each string in splitBySpaces
    for (var j = 0; j < splitBySpaces.length; j++) {
      var word = splitBySpaces[j];
      var spaceLeft = false;
      var spaceRight = false;
      var isSpecial = false;

      // If the word starts with a special character, add ::SPACELEFT:: to the start of the string
      if (/^[^a-zA-Z0-9\s\u00C0-\u017F'*]/.test(word)) {
      spaceLeft = true;
      }

      // If the word ends with a special character, add ::SPACERIGHT:: to the end of the string
      if (/[^a-zA-Z0-9\s\u00C0-\u017F'*]$/.test(word)) {
      spaceRight = true;
      }

      // Split the word by special characters except ::SPACELEFT:: and ::SPACERIGHT::
      var splitWords = word.split(/([^a-zA-Z0-9\s\u00C0-\u017F'*])/).filter(Boolean);

      // Add the split words to the preformatWords array
      preformatWords = preformatWords.concat(splitWords.map((splitWord) => {
        // If the splitWord is a special character, set isSpecial to true
        if (/^[^a-zA-Z0-9\s\u00C0-\u017F'*]/.test(splitWord)) {
          isSpecial = true;
        }
      return {
        word: splitWord,
        spaceLeft: spaceLeft,
        spaceRight: spaceRight,
        isSpecial: isSpecial
      };
      }));
    }

    // Loop through each word
    for (var j = 0; j < preformatWords.length; j++) {

      // Increment the charCount by the length of the word
      charCount += preformatWords[j].word.length;

      // Run RegExes against the word to make it comparable (plus strip out spaces)
      var word = preformatWords[j].word
        .toLowerCase() // make all letters lowercase
        .normalize("NFD") // decompose letters and diatrics
        .replace(/\p{Diacritic}/gu, '') // replace them with non-accented characters
        .replace(/'/g, '') // replace apostrophes with nothing
        .replace(/\s/g, ''); // remove spaces

      // Set toGuess
      var toGuess = /^[a-zA-Z]+$/.test(word) ? true : false;

      // If the line index is 0, set toGuess to false always
      if (i === 0) {
        toGuess = false;
      }

      // Construct a Lyric object with the boxIndex, lineIndex, content, contentComparable, toGuess, spaceLeft, and spaceRight
      var lyric = new Lyric(boxIndex, i, preformatWords[j].word, word, toGuess, preformatWords[j].spaceLeft, preformatWords[j].spaceRight, preformatWords[j].isSpecial);

      // Add the Lyric object to the lyrics array
      lyrics.push(lyric);

      // Increment the boxIndex
      boxIndex++;
    }
  }

  // Outputs: An array of Lyric objects
  return lyrics;
}

// Define the function that creates a Song object from the title, artist, preview, and lyric objects
function constructSongObject(title, artist, preview, chorus) {
  // Construct the lyric objects
  var lyrics = constructLyricObjects(chorus);

  // Construct the Song object
  var song = new Song(title, artist, preview, lyrics);

  // Return the Song object
  return song;
}

// Export the classes and functions
export { Song, Lyric, constructSongObject, constructLyricObjects };
