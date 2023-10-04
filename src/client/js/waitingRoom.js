document.addEventListener("DOMContentLoaded", () => {
  const playButton = document.getElementById("playButton");
  const waitingPopup = document.getElementById("waitingPopup");
  const playerCountSpan = document.getElementById("playerCount");
  const timerSpan = document.getElementById("timer");
  const voteSkipButton = document.getElementById("voteSkip");
  const voteStayButton = document.getElementById("voteStay");
  const skipCount = document.getElementById("skipCount");
  const stayCount = document.getElementById("stayCount");
  const socket = io();
  let hasClickedPlay = false; // Track whether the player has clicked "Play"
  let countdown = 5 * 60; // Initial countdown value in seconds (5 minutes)

  // Voting variables
  let voted = false;
  let skipVotes = 0;
  let stayVotes = 0;
  let lobby = {};

  // Function to show the waiting pop-up
  function showPopup() {
    waitingPopup.style.display = "block";
  }

  // Function to hide the waiting pop-up
  function hidePopup() {
    waitingPopup.style.display = "none";
  }

  // Function to update the timer display
  function updateTimerDisplay(countDownSeconds) {
    if (countDownSeconds >= 0) {
      const minutes = Math.floor(countDownSeconds / 60)
        .toString()
        .padStart(2, "0");
      const seconds = Math.round(countDownSeconds % 60)
        .toString()
        .padStart(2, "0");
      timerSpan.textContent = `${minutes}:${seconds} / 05:00`;
    } else {
      // Handle the case when the timer reaches 0 or goes negative
      timerSpan.textContent = "00:00 / 05:00"; // Display "00:00 / 05:00" or a suitable message
    }
  }

  // Event listener for the disconnect button
  disconnectButton.addEventListener("click", () => {
    // Send a request to the server to disconnect from the queue (you need to implement this on the server side)
    socket.emit("disconnectFromQueue");

    // Reset the voted variable and re-enable the vote buttons
    voted = false;
    voteSkipButton.disabled = false;
    voteStayButton.disabled = false;

    // Hide the waiting popup
    hidePopup();

    // Re-enable the "Play" button
    playButton.disabled = false;
    hasClickedPlay = false;

    let timerInterval;
    clearInterval(timerInterval); // Stop the timer on disconnect
    countdown = 5 * 60; // Reset the countdown to 5 minutes
  });

  // Event listener for the "Play" button
  playButton.addEventListener("click", () => {
    if (!hasClickedPlay) {
      const username = "Username"; // Make sure this is set correctly
      // console.log("Username:", username);
      socket.emit("joinWaitingRoom", { username });

      // Show the waiting pop-up
      showPopup();

      // Disable the "Play" button after clicking
      playButton.disabled = true;
      hasClickedPlay = true;
    }
  });

  // Event listener for "joinedWaitingRoom" from the server
  socket.on("joinedWaitingRoom", (data) => {
    console.log("Joined waiting room. Username:", data.username);
    lobby = data.lobby;
  });

  // Event listener for the "Vote Skip" button
  voteSkipButton.addEventListener("click", () => {
    console.log("Clicked Vote Skip");
    if (!voted) {
      voted = true;
      skipVotes++;
      socket.emit("voteSkip", lobby);
      // Disable both voting buttons after voting
      voteSkipButton.disabled = true;
      voteStayButton.disabled = true;
    }
  });

  // Event listener for the "Vote Stay" button
  voteStayButton.addEventListener("click", () => {
    console.log("Clicked Vote Stay");
    if (!voted) {
      voted = true;
      stayVotes++;
      socket.emit("voteStay", lobby);
      // Disable both voting buttons after voting
      voteSkipButton.disabled = true;
      voteStayButton.disabled = true;
    }
  });

  // Handle waiting room status updates from the server (e.g., player count and timer)
  socket.on("waitingRoomStatus", (data) => {
    // console.log('Received waitingRoomStatus event:', data);
    playerCountSpan.textContent = data.playerCount;

    // Use the server's countdown value
    countdown = Math.max(data.remainingTime, 0); // Ensure countdown doesn't go negative

    updateTimerDisplay(countdown / 1000); // Update the timer display

    if (data.usernames && Array.isArray(data.usernames)) {
      const userList = document.getElementById("userList");
      userList.innerHTML = "";
      data.usernames.forEach((username) => {
        const listItem = document.createElement("li");
        listItem.textContent = username;
        userList.appendChild(listItem);
      });
    } else {
      // Handle the case where data.usernames is undefined or not an array
      console.info("Received invalid usernames data:", data.usernames);
    }
  });

  // Handle the event to start the game (you can redirect users here)
  socket.on("startGame", () => {
    // Redirect users to the game session page or take appropriate action
    window.location.href = "/game";
  });

  // Event listener for "voteSkip" from the client
  socket.on("voteSkip", (data) => {
    socket.emit("voteSkip"); // Inform the server about the vote
    console.log(data);
  });

  // Event listener for "voteStay" from the client
  socket.on("voteStay", (data) => {
    socket.emit("voteStay"); // Inform the server about the vote
    console.log(data);
  });

  // Update the vote counts based on server data
  socket.on("updateVotes", (data) => {
    console.log("Received updateVotes event with data:", data);

    if (data.votingType === "skip") {
      // Calculate the total skip votes by summing up all votes
      const totalSkipVotes = Object.values(data.skipVotes).reduce(
        (total, count) => total + count,
        0
      );
      skipCount.textContent = totalSkipVotes;
    } else if (data.votingType === "stay") {
      // Calculate the total stay votes by summing up all votes
      const totalStayVotes = Object.values(data.stayVotes).reduce(
        (total, count) => total + count,
        0
      );
      stayCount.textContent = totalStayVotes;
    } else {
      // Handle cleared votes here by resetting the vote counts to zero
      skipVotes = 0;
      stayVotes = 0;
      skipCount.textContent = "0";
      stayCount.textContent = "0";
    }
  });
});