window.onload = function() {
    document.getElementById("myInput").addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        myFunction();
      }
    });
  }
  
  function myFunction() {
    var x = document.getElementById("myInput").value;
    var formattedInput = x.replace(/[^a-zA-Z ]/g, "").toLowerCase();
    var comparisonString = "twinkle twinkle little star";
  
    if (formattedInput === comparisonString) {
      document.getElementById("demo").innerHTML = "<b style='color:green;'>CORRECT!</b>";
    } else {
      document.getElementById("demo").innerHTML = "Better luck next time!";
    }
  }
  