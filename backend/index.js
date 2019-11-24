var express = require('express')
var app = express();
var path = require('path')
var http = require('http').createServer(app);
var io = require('socket.io')(http);


app.use('/', express.static(path.join(__dirname + '/../')));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/../index.html'));
});

io.on('connection', function (socket) {
    console.log('a user connected');
     socket.on('disconnect', function () {
         console.log('user disconnected');
     });
     socket.on('chat message', function (msg) {
         console.log('message: ' + JSON.stringify(msg));
     });
});


http.listen(3000, function () {
    console.log('listening on *:3000');
});