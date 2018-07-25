// var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var http = require('http');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
const passport = require('passport');
var mongoose = require('mongoose');
const routers = require('./routes');
require('dotenv').config();
var exphbs = require('express-handlebars');
var app = express();
var auth = require('./auth');
const session = require('express-session');
const sessionStore = new session.MemoryStore();
const server = http.createServer(app);
const io = require('socket.io')(server);
const passportSocketIo = require('passport.socketio');

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');


mongoose.connect(process.env.DATABASE, { useNewUrlParser: true });
// console.log(process.env.DATABASE , mongoose);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));
app.use(passport.initialize());
app.use(passport.session());


function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  // The accept-callback still allows us to decide whether to
  // accept the connection or not.
  accept(null, true);

  // OR

  // If you use socket.io@1.X the callback looks different
  // accept();
}





auth(app, mongoose);
var User = mongoose.model('User');
var Message = mongoose.model('Message');

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'express.sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  success: onAuthorizeSuccess,  // *optional* callback on success - read more below

}));



// var port = normalizePort(process.env.PORT || '3000');
// app.set('port', port);

/**
 * Create HTTP server.
 */

routers(app, mongoose);

// console.log('hello')
io.on('connection', (socket) => {

  // console.log('new user')
  
  socket.on('userconnect', () => {
    User.findOne({ _id: socket.request.user._id }, { password: 0 }, (err, user) => {
      user.logedIn = true;
      user.socketId = socket.id;
      user.save((err, data) => {
        // console.log(data);
        socket.broadcast.emit('userconnect', { user: data });

      });
    });
  })
  socket.on('chat', (obj) => {
    var message = new Message({ message: obj.message, senderId: socket.request.user._id, receiverId: obj.user.id });
    message.save((err, doc) => {

        // socket.broadcast.to(obj.user.socketId).emit('chat', {doc:doc,users:docs});
        socket.broadcast.emit('chat'+doc.receiverId, doc);

    });
  });
  socket.on('typing', (data) => {
    data.senderId = socket.request.user._id;

    // console.log(data.user.socketId);
    socket.broadcast.emit('typing'+data.user.id, data);
  })
  socket.on('disconnect', () => {

    User.findOne({ _id: socket.request.user._id }, (err, user) => {
      user.logedIn = false;
      user.lastSeen = new Date();
      user.socketId = null;
      user.save((err, data) => {
        // console.log(done);
        socket.broadcast.emit('userdisconnect', data);
        console.log('disconnected');

      });
    });
  });
})

module.exports = server;
