// functions.js

// this is the secret string that the user will have to guess using the input text boxes
var secretString = `One, two, three, four
Can I have a little more?`;

function getSong() {
  var container = document.getElementById("getSong"); // Get the container div

  var paragraph = document.createElement("p");
  paragraph.innerHTML = "Enter the song you'd like to play:"; // Create a paragraph stating "enter the song you'd like to play"
  container.appendChild(paragraph);

  var input = document.createElement("input");
  input.type = "text";
  input.id = "songInput"; // Provide a text input box
  container.appendChild(input);

  var button = document.createElement("button");
  button.innerHTML = "Select Song"; // Create a button titled "Select Song"
  button.addEventListener("click", generateSong); // Add event listener to the button
  container.appendChild(button);
}

function generateSong() {
  document.getElementById("songLyrics").innerHTML = ""; // Clear the songLyrics div
  document.getElementById("resultsMessage").innerHTML = ""; // Clear the resultsMessage div
  document.getElementById("score").innerHTML = ""; // Clear the score div
  var lines = secretString.split("\n"); // Split the secret string into lines
  var container = document.getElementById("songLyrics"); // Get the songLyrics div

  var wordIndex = 0; // Keep track of the word index
  var maxWidth = 100; // Define a maximum width for the input boxes
  lines.forEach(function (line) {
    // Loop through each line
    var lineWords = line.split(/\s+/); // Split the line into words
    lineWords.forEach(function (word) {
      var input = document.createElement("input");
      input.type = "text";
      input.id = "myInput" + wordIndex;
      var width = Math.min(10 * word.length, maxWidth); // Use the minimum of the word length and the maximum width
      input.style.width = width + "px";
      input.style.textAlign = "center";
      input.addEventListener("input", (function(input, wordIndex) {
        return function() {
          wordboxInputListener(input, wordIndex);
        }
      })(input, wordIndex));
      container.appendChild(input);
      wordIndex++;
    });
    container.appendChild(document.createElement("br"));
  });

  container.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      submit();
    }
  });
}

function wordboxInputListener(input, wordIndex) {
  updateColor();
  if (input.style.backgroundColor === "green") {
    var nextInput = document.getElementById("myInput" + (wordIndex + 1));
    if (nextInput) {
      nextInput.focus();
    }
  }
}

function updateColor() {
  var input = event.target;
  var inputIndex = parseInt(input.id.replace("myInput", ""));
  var formattedInput = input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase(); // remove all punctuation and make all lowercase
  var comparisonWord = secretString
    .split(/\s+/)
    [inputIndex].replace(/[^a-zA-Z ]/g, "")
    .toLowerCase();
  if (formattedInput === comparisonWord) {
    input.style.backgroundColor = "green"; // Set background color to green if input matches the corresponding word in the secret string
  } else {
    input.style.backgroundColor = "yellow"; // Set background color to red if input does not match the corresponding word in the secret string
  }
}

function submit() {
  var inputs = Array.from(
    document.getElementById("songLyrics").children
  ).filter(function (child) {
    return child.tagName === "INPUT"; // Filter out the 'br' elements
  });
  var formattedInputs = inputs.map(function (input) {
    return input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase();
  });

  var comparisonWords = secretString.split(/\s+/).map(function (word) {
    return word.replace(/[^a-zA-Z ]/g, "").toLowerCase();
  });

  var isCorrect = formattedInputs.every(function (input, index) {
    return input === comparisonWords[index];
  });

  var allFilled = formattedInputs.every(function (input) {
    return input !== ""; // Check if all text boxes are filled
  });
  scoreSong(formattedInputs, comparisonWords);
  if (allFilled) {
    if (isCorrect) {
      document.getElementById("resultsMessage").innerHTML =
        "<b style='color:green;'>SUCCESS!</b>";
    } else {
      document.getElementById("resultsMessage").innerHTML =
        "<b style='color:red;'>Better luck next time!</b>";
    }
  } else {
    inputs.forEach(function (input, index) {
      if (input.value === "") {
        input.style.backgroundColor = "red"; // Highlight the input field in red if it's blank
      } else {
        input.style.backgroundColor = ""; // Reset the background color if it's not blank
      }
    });
    document.getElementById("resultsMessage").innerHTML =
      "Please fill out the blank text boxes.";
  }
}

function scoreSong(formattedInputs, comparisonWords) {
  var currentscore = 0;
  formattedInputs.forEach(function (input, index) {
    if (input === comparisonWords[index]) {
      currentscore++;
    }
    var finalscore = currentscore;
    document.getElementById("score").innerHTML = finalscore + " Words Correct!";
  });
}

function init () {
  getSong();
  generateSong();
}

window.onload = init;
