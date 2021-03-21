const usersContainer = document.getElementById("users");
const messageContainer = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");

const socket = io();

socket.on("message", message => {
  console.log(message);
  const element = document.createElement("p");
  newContent = document.createTextNode("BOT: " + message);
  element.append(newContent);
  messageContainer.append(element);
});

socket.on("chatMessage", message => {
  const div = document.createElement("div");
  div.className = "d-flex justify-content-between";
  const editButton = document.createElement("button");
  editButton.className = `btn btn-sm btn-outline-dark`;
  editButton.innerHTML = "Edit";
  const element = document.createElement("p");
  newContent = document.createTextNode(
    message.username + ": " + message.message
  );
  element.append(newContent);
  div.append(element);
  div.append(editButton);
  messageContainer.append(div);
});

socket.on("userStatusUpdate", usersData => {
  //Remove duplicates
  let arrayOfUsers = Object.entries(usersData).map(
    element => element[1].username
  );
  console.log(arrayOfUsers);
  let filteredArray = arrayOfUsers.filter(
    (val, index) => arrayOfUsers.indexOf(val) === index
  );

  while (usersContainer.firstChild) {
    usersContainer.removeChild(usersContainer.firstChild);
  }
  for (user of filteredArray) {
    const element = document.createElement("p");
    const PM = document.createElement("span");
    PM.append(document.createTextNode(user));
    element.append(PM);
    usersContainer.append(element);
  }

  //Lägg till eventlistener på alla som emittar
  document.querySelectorAll("p span").forEach(element => {
    element.addEventListener("click", e => {
      socket.emit("startPM", e.target.textContent);
    });
  });
});

chatForm.addEventListener("submit", e => {
  e.preventDefault();
  const msg = e.target.elements.msg.value;
  socket.emit("chatMessage", msg);
  e.target.elements.msg.value = "";
});
