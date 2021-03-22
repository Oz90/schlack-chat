const express = require("express");
const app = express();
const http = require("http");
const morgan = require("morgan");
const ejs = require("ejs");
const authController = require("./controllers/authController");
const userController = require("./controllers/userController");
const User = require("./models/userModel");
const Channel = require("./models/channelModel");
const Message = require("./models/messageModel");
const socketio = require("socket.io");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const path = require("path");
const fileUpload = require("express-fileupload");

const server = http.createServer(app);
const io = socketio(server);

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const bodyParser = require("body-parser");
const userRouter = require("./routes/userRoutes");

app.use(fileUpload({ createParentPath: true }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static(__dirname + "/public"));

const mongoose = require("mongoose");

const connection = mongoose.connect("mongodb://localhost:27017/slack_clone", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.set("view-engine", ejs);

//const loginRouter = require("./routes/loginRoutes");

// Middleware
app.use(morgan("dev")); // Logging middleware som ger info om våra HTTP requests.
//app.use(express.json()); // Gör så man kan använda body (samma som body-parser i äldre express versioner)
// app.use(express.urlencoded({ extended: false }));

const usersData = {};

io.use((socket, next) => {
  //Verifies the user and creates a userObject in the
  const JWT = cookie.parse(socket.handshake.headers.cookie).token;
  //console.log('JWT IS ' + JWT);
  jwt.verify(JWT, process.env.JWT_SECRET, async (err, userData) => {
    if (err) {
      socket.emit("redirect", "/login");
      return;
    }
    let channelURL = socket.handshake.headers.referer;
    const channelID = channelURL.split("/").slice(-1)[0];
    usersData[socket.id] = { ...userData, channelID };
    next();
  });
});

io.on("connection", socket => {
  io.emit("userStatusUpdate", usersData);

  socket.join(usersData[socket.id].channelID);

  socket.broadcast
    .to(usersData[socket.id].channelID)
    .emit("message", `${usersData[socket.id].username} has joined the chat.`);

  socket.on("chatMessage", async message => {
    const user = await User.findOne({ _id: usersData[socket.id].id });
    console.log("USER:   " + user);

    io.to(usersData[socket.id].channelID).emit("chatMessage", {
      username: usersData[socket.id].username,
      message,
      profilePic: user.profilePic
    });

    const newMessage = new Message({
      user: usersData[socket.id].username,
      message
    });

    const newmsg = await newMessage.save();
    await Channel.updateOne(
      { _id: usersData[socket.id].channelID },
      { $push: { messages: newmsg._id } }
    );
  });

  socket.on("disconnect", () => {
    io.to(usersData[socket.id].channelID).emit(
      "message",
      `${usersData[socket.id].username} has left the chat.`
    );

    delete usersData[socket.id];
    io.emit("userStatusUpdate", usersData);
  });
});

// Routes
//app.use("/", loginRouter);

app.get("/home", authController.protect, (req, res) => {
  // console.log("USER REQUEST FROM APP.JS : " + req.user);
  Channel.find({}).exec((error, channels) => {
    if (error) {
      return handleError(error);
    }
    //console.log(books);
    res.render("home.ejs", { channels: channels, user: req.user });
  });
});

app.get("/", (req, res) => {
  User.find({}).exec((error, users) => {
    if (error) {
      return handleError(error);
    }
    //console.log(books);
    res.render("index.ejs", { users: users });
  });
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/chat/:id", authController.verifyAccess, async (req, res) => {
  console.log(req.user);
  const channelId = req.params.id;

  Channel.find({ _id: channelId })
    .populate(["Message", "User"])
    .exec((error, channels) => {
      if (error) {
        return handleError(error);
      }
      res.render("chatroom.ejs", { channels: channels, user: req.user });
    });

  //console.log(channelId);
});

// app.post('/register', (req, res) => {
//   console.log(req.body);
//   const newUser = new User();
//   newUser.username = req.body.username;
//   newUser.email = req.body.email;
//   newUser.password = req.body.password;
//   newUser.passwordConfirm = req.body.passwordConfirm;

//   newUser.save(function(err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.redirect('/');
//     }
//   });
// });

//app.post('/register', authController.register);

app.post(
  "/upload-profile-pic",
  authController.protect,
  userController.updateMe
);

app.post("/update-name", authController.protect, userController.updateName);

app.use("/", userRouter);

const port = 3000;
const ip = "127.0.0.1";
server.listen(port, () => console.log(`listening on http://${ip}:${port}!`));

//module.exports = app;
