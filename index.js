const express = require('express');
const app = express();
const http = require('http');
const { platform } = require('os');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var currentPlayer = false;
var lastMsg = null;
var player0 = null;
var player1 = null;
var squaresUsed = [0, 0];
var board = [0, 0, 0, 0, 0, 0, 0, 0, 0]
var score0 = 0;
var score1 = 0;
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id);
    if (player0 == null) {
        currentPlayer = player0 = socket.id;
        io.to(player0).emit('joined', "BLUE");
        console.log("Blue player joined");
        if (player1 == null) {
            console.log("HEYO");
            io.to(player0).emit('waiting for player', "Waiting for other player");
        }
        else {
            console.log("HEYO1111");
            console.log(player1);
            io.to(player1).emit('your turn', false);
            io.to(player0).emit('your turn', true);
        }
    }
    else if (player0 != null && player1 == null) {
        player1 = socket.id;
        io.to(player0).emit('your turn', true);
        io.to(player1).emit('your turn', false);
        io.to(player1).emit('joined', "RED");
        console.log("Red player joined")
    }
    else {
        io.to(socket.id).emit('waiting for player', "ROOM FILLED");
    }
    if (lastMsg != null){
        io.emit('chat message', lastMsg);
    }
    socket.on('disconnect', () => {
        if (socket.id == player0) {
            player0 = null;
            io.to(player1).emit('game over', 1, 0, 0);
            
            io.to(player1).emit('waiting for player', "Waiting for other player");
            
            currentPlayer = player1;
            console.log("Blue player left\n")
        }
        else {
            player1 = null;
            io.to(player0).emit('game over', 1, 0, 0);
            
            io.to(player0).emit('waiting for player', "Waiting for other player");
            
            currentPlayer = player0;
            console.log("Red player left \n");
        }

        squaresUsed = [0, 0];
        board = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        score0 = 0;
        score1 = 0;
    });
  });
  io.on('connection', (socket) => {
    socket.on('move', (msg) => {
        console.log('message: ' + msg);
        checkValidDraw(msg, socket);
        
    });
  });
  io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
      lastMsg = msg;
    });
  });
server.listen(3000, () => {
  console.log('listening on *:3000');
});

function updateStatus(oldPlayer, newPlayer) {
    io.to(oldPlayer).emit('your turn', false);
    io.to(newPlayer).emit('your turn', true);
}

function checkValidDraw(msg, socket) {
    if (socket.id == currentPlayer) {
        if (currentPlayer == player0) {
            if (squaresUsed[0] == 3 && board[msg] == 1) {
                board[msg] = 0;
                squaresUsed[0] -= 1;
                io.emit('valid', "field-checked1", msg)
            }
            else if (squaresUsed[0] < 3 && board[msg] == 0) {
                io.emit('valid', "field-checked1", msg)
                squaresUsed[0] += 1;
                currentPlayer = player1;
                updateStatus(player0, player1);
                updateStatus();
                board[msg] = 1;
            }
        }
        else if (squaresUsed[1] == 3 && board[msg] == 2) {
            board[msg] = 0;
            squaresUsed[1] -= 1;
            io.emit('valid', "field-checked0", msg)
        }
        else if (squaresUsed[1] < 3 && board[msg] == 0) {
            io.emit('valid', "field-checked0", msg)
            squaresUsed[1] += 1;
            currentPlayer = player0;
            updateStatus(player1, player0);
            updateStatus();
            board[msg] = 2;
        }
        if (squaresUsed[0] + squaresUsed[1] > 4) {
            threeOnRow();
        }
    }
    else {
        console.log(socket.id);
        console.log(currentPlayer);
    }
    console.log(board);
}
function threeOnRow() {
    if (board[0] == board[1] && board[1] == board[2] && board[0] != 0) {
        determineWinner(board[0]);
    }
    else if (board[3] == board[4] && board[4] == board[5] && board[3] != 0) {
        determineWinner(board[4]);
    }
    else if (board[6] == board[7] && board[7] == board[8] && board[6] != 0) {
        determineWinner(board[6]);
    }
    else if (board[0] == board[3] && board[3] == board[6] && board[3] != 0) {
        determineWinner(board[0]);
    }
    else if (board[1] == board[4] && board[4] == board[7] && board[4] != 0) {
        determineWinner(board[4]);
    }
    else if (board[2] == board[5] && board[5] == board[8] && board[5] != 0) {
        determineWinner(board[2]);
    }
    else if (board[0] == board[4] && board[4] == board[8] && board[0] != 0) {
        determineWinner(board[4]);
    }
    else if (board[2] == board[4] && board[4] == board[6] && board[4] != 0) {
        determineWinner(board[4]);
    }
}
function determineWinner(player) {
    if (player == 2) {
        console.log("Red wins");
        score1 += 1;
        io.to(player1).emit('game over', 1, score0, score1);
        io.to(player0).emit('game over', 0, score0, score1);
        setTimeout(function () {
            io.to(player1).emit('your turn', false);
            io.to(player0).emit('your turn', true);
        }, 2000);
        //setTimeout(resetBoard, 2000);
    }
    else {
        console.log("Blue wins");
        score0 += 1;
        io.to(player1).emit('game over', 0, score0, score1);
        setTimeout(function () {
            io.to(player0).emit('your turn', false);
            io.to(player1).emit('your turn', true);
        }, 2000);
        io.to(player0).emit('game over', 1, score0, score1);
        //setTimeout(resetBoard, 2000);
    }
    squaresUsed = [0, 0];
    board = [0, 0, 0, 0, 0, 0, 0, 0, 0]
}