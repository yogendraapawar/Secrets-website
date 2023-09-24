var deleteButtons = document.querySelectorAll('.delete-button');

  // Add a click event listener to each delete button
  deleteButtons.forEach(function(button) {
    button.addEventListener('click', function(event) {
      var clickedButtonId = event.target.id;
      console.log("Clicked button ID: " + clickedButtonId);
      
      // Now you can perform actions based on the button ID
      // For example, you can send an AJAX request to delete the item with this ID.
    });
  });