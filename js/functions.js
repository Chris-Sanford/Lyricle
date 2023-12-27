// functions.js

// this is the secret string that the user will have to guess using the input text boxes
var secretString = `One, two, three, four
Can I have a little more?
Five, six, seven, eight, nine, ten, I love you`;

// this is a temp secret string to speed up debugging and testing
var secretString = `One, two, three, four`;

function getSong() { // Ask the user to choose a song of their choice
  // get the div element getSong from the HTML document and set it to the variable named container so we can manipulate it
  var container = document.getElementById("getSong");

  var paragraph = document.createElement("p"); // create a paragraph element within the document
  paragraph.innerHTML = "Enter the song you'd like to play:"; // populate the paragraph
  container.appendChild(paragraph); // append the paragraph to the div container (this is where it actually populates?)

  var input = document.createElement("input"); // Create an input element
  input.type = "text"; // set it as text input
  input.id = "songInput"; // give it an id name
  container.appendChild(input); // append the input text box element to the container div

  var button = document.createElement("button"); // Create a button element
  button.innerHTML = "Select Song"; // Define the text within the button to label it
  button.addEventListener("click", generateSong); // Add event listener to the button so it responds to clicks and calls the generateSong function (so the song can be selected and loaded in the future)
  container.appendChild(button); // append the button to the div
}

function generateSong() { // Loads main game with song lyrics to guess
  document.getElementById("songLyrics").innerHTML = ""; // Clear the songLyrics div
  document.getElementById("resultsMessage").innerHTML = ""; // Clear the resultsMessage div
  document.getElementById("score").innerHTML = ""; // Clear the score div
  var lines = secretString.split("\n"); // Split the secret string into lines
  var container = document.getElementById("songLyrics"); // Get the songLyrics div

  var wordIndex = 0; // Keep track of the word index, sets to 0 to start
  var maxWidth = 100; // Define a maximum width for the input boxes (should 100 be the value? will any realistic word require more pixels than this?)
  lines.forEach(function (line) { // executes a function against each line from lines array (can we port this to a legit named function?)
    var lineWords = line.split(/\s+/); // Split the line into words
    lineWords.forEach(function (word) { // executes a function against each word from lineWords array
      var input = document.createElement("input"); // creates an input element
      input.type = "text"; // makes the element a text input
      input.id = "myInput" + wordIndex; // defines the unique id of the input element based on the index of the word in the secret string
      var width = Math.min(10 * word.length, maxWidth); // defines variable width using the Math.min static method to set the value to either the length of the word * 10
      // or the maxWidth value, whichever is smaller. This means a word with more than 10 characters will be restricted to the maxWidth value.
      input.style.width = width + "px"; // width needs to be defined in px (pixels) so we add the px string to the end of the width value
      input.style.textAlign = "center"; // center the text within the input box
      input.addEventListener("input", (function(input, wordIndex) { // adds event listener so any time there is input into the input box, it executes the function
        return function() { // calls the function defined below and returns parent function from addEventListener
          wordboxInputListener(input, wordIndex); // executes the wordboxInputListener function with relevant parameters/arguments
        } // we must be able to simplify this nesting craziness
      })(input, wordIndex)); // ensures the correct input and wordIndex values are passed to the wordboxInputListener function
      container.appendChild(input); // appends the input element to the container div so it's populated in the HTML document
      wordIndex++; // increments the wordIndex value by 1
    });
    container.appendChild(document.createElement("br")); // adds a line break after each line of the song
  });

  container.addEventListener("keyup", function (event) { // adds event listener for key input on wordbox
    if (event.key === "Enter") { // if the key pressed is the Enter key
      submit(); // call the submit function
    }
  });
}

function wordboxInputListener(input, wordIndex) { // Event listener for lyric input boxes
  updateColor(); // call the updateColor function
  if (input.style.backgroundColor === "green") { // if the words matched, the input is correct, and the background color of the wordbox is green
    var nextInput = document.getElementById("myInput" + (wordIndex + 1)); // get next input box element by ID using current index + 1
    if (nextInput) { // if there is a next input box (i.e. we're not at the end of the song)
      nextInput.focus(); // focus on the next input box
    }
  }
}

function updateColor() { // Update the color of the lyric input boxes based on guess correctness
  var input = event.target; // this is working but deprecated but how do we replace this?
  var inputIndex = parseInt(input.id.replace("myInput", "")); // get the index of the input box (there must be a better way to do this)
  var formattedInput = input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase(); // from input, remove all punctuation and make all lowercase
  var comparisonWord = secretString // set the comparisonWord to a variable (there must be a better way to do this)
    .split(/\s+/) // Split the secret string into words (haven't we already done this?)
    [inputIndex].replace(/[^a-zA-Z ]/g, "") // get the proper word to compare by matching the index (couldn't we have done this before? didn't we?)
    .toLowerCase(); // convert it to lowercase for accurate comparison
  if (formattedInput === comparisonWord) {
    input.style.backgroundColor = "green"; // Set background color to green if input matches the corresponding word in the secret string
  } else {
    input.style.backgroundColor = "yellow"; // Set background color to red if input does not match the corresponding word in the secret string
  }
}

function submit() { // submit the guessed lyrics and calculate and return score
  var inputs = Array.from( // set inputs variable to an array of all the input elements to get the full answer
    document.getElementById("songLyrics").children // get the children of the songLyrics div
  ).filter(function (child) {
    return child.tagName === "INPUT"; // Filter out the 'br' elements to only get the input elements
  });
  var formattedInputs = inputs.map(function (input) { // map method creates a new array with the results of the nested function for every element in the input array
    return input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase(); // returns the resultant parsed input value to populate the formattedInputs array (no special characters, all lowercase)
  });

  var comparisonWords = secretString.split(/\s+/).map(function (word) { // we're once against splitting the entire secret string...
    return word.replace(/[^a-zA-Z ]/g, "").toLowerCase(); // once again format the secret string to remove special characters and make it all lowercase
  });

  var isCorrect = formattedInputs.every(function (input, index) { // every method checks if all elements in array pass a particular test
    return input === comparisonWords[index]; // tests if the formattedInput matches the comparisonWord at the same index
  }); // isCorrect will be true or false depending on whether all the words match

  var allFilled = formattedInputs.every(function (input) {
    return input !== ""; // Check if all text boxes are filled
  });
  scoreSong(formattedInputs, comparisonWords); // call the scoreSong function with the formattedInputs and comparisonWords arrays as parameters/arguments
  if (allFilled) {
    if (isCorrect) {
      document.getElementById("resultsMessage").innerHTML = // populate the resultsMessage div with the following text
        "<b style='color:green;'>SUCCESS!</b>";
    } else {
      document.getElementById("resultsMessage").innerHTML = // populate the resultsMessage div with the following text
        "<b style='color:red;'>Better luck next time!</b>";
    }
  } else {
    inputs.forEach(function (input, index) { // execute the following function against each input box
      if (input.value === "") {
        input.style.backgroundColor = "red"; // Highlight the input field in red if it's blank
      } else {
        input.style.backgroundColor = ""; // Reset the background color if it's not blank
      }
    });
    document.getElementById("resultsMessage").innerHTML = // populate resultsMessage to urge player to finish the rest of the game
      "Please fill out the blank text boxes.";
  }
}

function scoreSong(formattedInputs, comparisonWords) { // Calculate the number of words guessed correctly
  var currentscore = 0; // default to 0 for current score
  formattedInputs.forEach(function (input, index) { // for each formattedInput
    if (input === comparisonWords[index]) { // if the formattedInput matches the comparisonWord at the same index
      currentscore++; // add +1 to the current score. Didn't we do these correctness checks already?
    }
    var finalscore = currentscore; // set a finalScore variable. Is this necessary? Can we just make one var called score?
    document.getElementById("score").innerHTML = finalscore + " Words Correct!"; // populate the score div with the final score
  });
}

function init () { // Initialize the game
  getSong();
  generateSong();
}

window.onload = init; // upon loading the page, initialize the game
