var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Game = require('./game.js');
var routes = require('./routes/routes.js');
var players = { };
var io = require('socket.io').listen(server);
var socketCount = 0;
server.listen(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(app.router);
app.use('/public', express.static('public'));


var usernames = {};
var rooms = ['temproom'];

function returnGame(gameId, res) { res.json(gameViewModel(gameId)); }

function broadcastGame(gameId) {
  var vm = gameViewModel(gameId);
  for(var player in players[gameId]) {
    players[gameId][player].emit("updateGame", vm);
  }
}

function gameViewModel(gameId) {
  var game = Game.getGame(gameId);
  var viewModel = JSON.parse(JSON.stringify(game));
  delete viewModel.deck;
  return viewModel;
}

var lobbySocket = io
.of('/lobby')
.on('connection', function(socket) {
  console.info('lobby socket connect');
  var gameList = Game.list();
  socket.emit('lobbyJoin', gameList);
});

io.sockets.on('connection', function(socket) {
  socketCount+=1;
  console.info('*****SocketCount: ' + socketCount);


  socket.on('adduser', function(username){
    socket.username = username;
    socket.room = 'temproom';
    usernames[username] = username;
    socket.join('temproom');
    socket.emit('updaterooms', rooms, 'temproom');
  });

  socket.on('sendchat', function (data) {
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('switchRoom', function(newroom){
    rooms[rooms.length] = newroom;
    socket.leave(socket.room);
    socket.join(newroom);
    socket.room = newroom;
    socket.emit('updaterooms', rooms, newroom);
  });


  socket.on('connectToGame', function(data) {
    console.info('server: connectToGame');
    var game = Game.getGame(data.gameId);
    if(game){
      if(!players[data.gameId]) {
        players[data.gameId] = { };
      }
      socket.gameId = data.gameId;
      socket.playerId = data.playerId;
      players[data.gameId][data.playerId] = socket;
      broadcastGame(data.gameId);
    } else {
      socket.emit('gameError', 'Invalid Game ID');
    }
  });
  
  socket.on('disconnect', function() {
    socketCount-=1;
    if(socket.playerId && socket.gameId){
      console.info('socket disconnect ' + socket.playerId);
      delete players[socket.gameId][socket.playerId];
      Game.departGame(socket.gameId, socket.playerId);
      lobbySocket.emit('gameAdded', Game.list());
      // remove the username from global usernames list
      delete usernames[socket.username];
      // update list of users in chat, client-side
      io.sockets.emit('updateusers', usernames);
      // echo globally that this client has left
      //socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
      socket.leave(socket.room);
    }
  });

});

app.get('/', routes.index);
app.get('/views/*', routes.partials);
app.get('/list', function (req, res) { res.json(Game.list()); });
app.get('/listall', function (req, res) { res.json(Game.listAll()); });
app.post('/add', function (req, res) {
  console.log('***********************'+ req.body);
  var newGame = Game.addGame(req.body);
  res.json(newGame);
  lobbySocket.emit('gameAdded', Game.list());
});
app.get('/gamebyid', function (req, res) { res.json(Game.getGame(req.query.id)); });
app.post('/spectategame', function (req, res) {
  var game = Game.getGame(req.body.gameId);
  if(!game) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "invalid GameId" }));
    res.end();
    return null;
  }

  game = Game.spectateGame(game, { id: req.body.playerId });
  returnGame(req.body.gameId, res);
});

app.post('/startgame', function (req, res) {
  var game = Game.getGame(req.body.gameId);
  if(!game) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "GameId non valido" }));
    res.end();
    return null;
  }
  if(game.isStarted) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "La partita è già iniziata" }));
    res.end();
    return null;
  }
  game = Game.startGame(game);
  lobbySocket.emit('gameStarted', Game.list());
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});
app.post('/joingame', function (req, res) {
  var game = Game.getGame(req.body.gameId);
  if(!game) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "GameId non valido" }));
    res.end();
    return null;
  }
/*  var config = Game.getConfig();*/
  if(game.players.length >= game.maxPlayers) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "Troppi giocatori" }));
    res.end();
    return null;
  }

  game = Game.joinGame(game, { id: req.body.playerId, name: req.body.playerName, hostId:req.body.hostId });
  returnGame(req.body.gameId, res);
  lobbySocket.emit('gameAdded', Game.list());
});

app.post('/departgame', function(req, res) {
  Game.departGame(req.body.gameId, req.body.playerId);
  lobbySocket.emit('gameAdded', Game.list());
  broadcastGame(req.body.gameId);
});

app.post('/selectcard', function(req, res) {
  Game.selectCard(req.body.gameId, req.body.playerId, req.body.whiteCardId);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});

app.post('/selectWinner', function(req, res) {
  Game.selectWinner(req.body.gameId, req.body.cards);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});

app.post('/readyForNextRound', function(req, res){
  Game.readyForNextRound(req.body.gameId, req.body.playerId);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});
