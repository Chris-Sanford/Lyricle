// this is the secret string that the user will have to guess using the input text boxes
var secretString = `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
Twinkle, twinkle, little star,
How I wonder what you are!`;

var secretString = `one, one
one, four`;

window.onload = function() {
  var lines = secretString.split('\n');
  var container = document.getElementById('inputContainer');
  var words = secretString.split(/\s+/);

  var wordIndex = 0;
  var maxWidth = 100; // Define a maximum width for the input boxes
  lines.forEach(function(line) {
    var lineWords = line.split(/\s+/);
    lineWords.forEach(function(word) {
      var input = document.createElement('input');
      input.type = 'text';
      input.id = 'myInput' + wordIndex;
      var width = Math.min(10 * word.length, maxWidth); // Use the minimum of the word length and the maximum width
      input.style.width = width + 'px';
      input.style.textAlign = 'center';
      input.addEventListener("input", updateColor);
      container.appendChild(input);
      wordIndex++;
    });
    container.appendChild(document.createElement('br'));
  });

  container.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      submit();
    }
  });
}

function updateColor() {
  var input = event.target;
  var inputIndex = parseInt(input.id.replace('myInput', ''));
  var formattedInput = input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase(); // remove all punctuation and make all lowercase
  var comparisonWord = secretString.split(/\s+/)[inputIndex].replace(/[^a-zA-Z ]/g, "").toLowerCase();

  if (formattedInput === comparisonWord) {
    input.style.backgroundColor = 'green'; // Set background color to green if input matches the corresponding word in the secret string
  } else {
    input.style.backgroundColor = 'red'; // Set background color to red if input does not match the corresponding word in the secret string
  }
}

function submit() {
    var inputs = Array.from(document.getElementById('inputContainer').children).filter(function(child) {
      return child.tagName === 'INPUT'; // Filter out the 'br' elements
    });
    var formattedInputs = inputs.map(function(input) {
      return input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase();
    });
  
    var comparisonWords = secretString.split(/\s+/).map(function(word) {
      return word.replace(/[^a-zA-Z ]/g, "").toLowerCase();
    });
  
    var isCorrect = formattedInputs.every(function(input, index) {
      return input === comparisonWords[index];
    });
  
    var allFilled = formattedInputs.every(function(input) {
      return input !== ''; // Check if all text boxes are filled
    });

    if (allFilled) {
        if (isCorrect) {
          document.getElementById("demo").innerHTML = "<b style='color:green;'>SUCCESS!</b>";
        } else {
          document.getElementById("demo").innerHTML = "<b style='color:red;'>Better luck next time!</b>";
        }
      } else {
        inputs.forEach(function(input, index) {
          if (input.value === '') {
            input.style.backgroundColor = 'red'; // Highlight the input field in red if it's blank
          } else {
            input.style.backgroundColor = ''; // Reset the background color if it's not blank
          }
        });
        document.getElementById("demo").innerHTML = "Please fill out the blank text boxes.";
      }
}
