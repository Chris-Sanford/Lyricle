var secretString = `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
Twinkle, twinkle, little star,
How I wonder what you are!`;

window.onload = function() {
    var lines = secretString.split('\n');
    var container = document.getElementById('inputContainer');
  
    lines.forEach(function(line, index) {
      var input = document.createElement('input');
      input.type = 'text';
      input.id = 'myInput' + index;
      input.style.width = '200px'; // Set the width of the input field
      container.appendChild(input);
      container.appendChild(document.createElement('br')); // Add a line break after each input field
    });
  
    container.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        myFunction();
      }
    });
}

function myFunction() {
    var inputs = Array.from(document.getElementById('inputContainer').children).filter(function(child) {
      return child.tagName === 'INPUT'; // Filter out the 'br' elements
    });
    var formattedInputs = inputs.map(function(input) {
      return input.value.replace(/[^a-zA-Z ]/g, "").toLowerCase();
    });
  
    var comparisonStrings = secretString.split('\n').map(function(line) {
      return line.replace(/[^a-zA-Z ]/g, "").toLowerCase();
    });
  
    var isCorrect = formattedInputs.every(function(input, index) {
      return input === comparisonStrings[index];
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
