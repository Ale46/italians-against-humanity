'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.2')
    .factory('GameService', function($http) {

        var s4 = function() {
            return Math.floor(Math.random() * 0x10000).toString();
        }
        var guid = function(){
            return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
        };
        var pId = guid();

        return {
            playerName: '',
            playerId : pId,
            newGameId : guid(),
            minPlayer : 3,
            maxPlayer : 10,
            pointsToWin: 7,
            currentGameId: undefined,
            initName: function() {
                if(this.playerName.length === 0) {
                    this.playerName = 'anonymous ' + s4();
                }
            },
            getGames: function() {
                return $http.get('/listall');
            },
            startGame: function(gameId) {
                return $http.post('/startgame', { gameId: gameId });
            },
            createGame: function(ext, minPlayers, maxPlayers, pointsToWin) {
                return $http.post('/add', { id: guid(), name: 'Stanza di ' + this.playerName , hostId: this.playerId, minPlayers: minPlayers, maxPlayers: maxPlayers, extensions: ext, pointsToWin: pointsToWin  });
            },
            spectateGame: function(gameId, playerId) {
                return $http.post("/spectategame", { gameId: gameId, playerId: playerId});
            },
            joinGame: function(gameId, playerId, name) {
                return $http.post("/joingame", { gameId: gameId, playerId: playerId, playerName: name });
            },
            departGame: function(gameId, playerId) {
                $http.post('/departgame', { gameId: gameId, playerId: playerId});
            },
            selectCard: function(gameId, playerId, selectedCard){
                $http.post("/selectCard", { gameId: gameId, playerId: playerId, whiteCardId: selectedCard });
            },
            selectWinner: function(gameId, selectedCards) {
                $http.post("/selectWinner", { gameId: gameId, cards: selectedCards });
            },
            readyForNextRound: function(gameId, playerId) {
                $http.post("readyForNextRound",  { playerId: playerId, gameId: gameId });
            }
        }
    });
