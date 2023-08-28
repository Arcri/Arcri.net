const button = document.getElementById("moving-button");

function moveButton() {
  // Move button to the right
  button.style.left = "calc(100% + 100px)";
  
  // Hide the button after moving
  setTimeout(() => {
    button.style.display = "none";
    
    // Show the button again after 2 minutes
    setTimeout(() => {
      button.style.display = "block";
      button.style.left = "-100px"; // Reset position
    }, 120000); // 2 minutes in milliseconds
  }, 1000); // 1 second to move off the screen
}

// Start the process after 2 minutes
setTimeout(moveButton, 100); // 2 minutes in milliseconds