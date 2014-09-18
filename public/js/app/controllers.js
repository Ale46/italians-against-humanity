'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
    .controller('HomeCtrl', function($scope, $location, GameService) {
        console.info('HomeCtrl loaded');

        var handleError = function(err) {
            console.error(err);
        };

        $scope.gameSvc = GameService;
        $scope.inLobby = true;

        $scope.createGame = function(ext, minPlayers, maxPlayers, pointsToWin) {
            console.info('createGame called');
            GameService.initName();
            GameService.createGame(ext, minPlayers, maxPlayers, pointsToWin)
                .then(function(success) {
                    //navigate to the new game
                    console.info(success);
                    $scope.joinGame(success.data.id, true);
                }, handleError);
        };

        $scope.joinGame = function(gameId) {
            console.info('joinGame called for gameId ' + gameId);
            GameService.initName();
            $location.url("/game/"+ gameId + "/pId/" + GameService.playerId + "/name/" + GameService.playerName);
        };

        $scope.spectateGame = function(gameId) {
            console.info('spectateGame called for gameId ' + gameId);
            $location.url("/game/"+ gameId + "/pId/" + GameService.playerId + "/spectate");
        };

        $scope.$on('enterLobby', function() {
            $scope.inLobby = true;
        });

        $scope.$on('enterGame', function() {
            $scope.inLobby = false;
        });

    })
    .controller('GameCtrl', function($scope, $routeParams, GameService){
        console.info('GameCtrl loaded');

        var socket;

        $scope.game = {};
        $scope.currentPlayer = {};
        $scope.progStyle = {width: '0%'};
        $scope.gameId = $routeParams.gameId;
        $scope.playerId = $routeParams.playerId;
        $scope.gameError;
        GameService.playerName = $routeParams.playerName;

        //ng-show helper functions
        $scope.showNotificationSelectCard = function() {
            return !$scope.currentPlayer.isCzar &&
                !$scope.currentPlayer.selectedWhiteCards &&
                $scope.game.isStarted &&
                !$scope.game.isReadyForScoring
        };

        $scope.showNotificationWaitingOnCzar = function() {
            return !$scope.currentPlayer.isCzar &&
                $scope.game.isReadyForScoring &&
                !$scope.game.isReadyForReview
        };

        $scope.showNotificationWaitingOnCards = function() {
            return ($scope.currentPlayer.isCzar || $scope.currentPlayer.selectedWhiteCards) &&
                !$scope.game.isReadyForScoring
        };

        $scope.showNotificationSelectWinner = function() {
            return $scope.currentPlayer.isCzar &&
                $scope.game.isReadyForScoring &&
                !$scope.game.isReadyForReview
        };

        $scope.showWhiteCardList = function() {
            //return !$scope.currentPlayer.isCzar && $scope.game.isStarted && !$scope.game.isReadyForScoring
            return !$scope.currentPlayer.isCzar && $scope.game.isStarted && !$scope.game.isReadyForScoring && !$scope.currentPlayer.isReady
        };

        $scope.showSelectedWhiteCardList = function() {
            //return (($scope.currentPlayer.isCzar || $scope.currentPlayer.isSpectator) && $scope.game.isStarted && $scope.game.isReadyForScoring) ||
             //   $scope.game.isReadyForReview
             return ($scope.currentPlayer.isCzar && $scope.game.isStarted && $scope.game.isReadyForScoring) ||
                 $scope.game.isReadyForReview
        };
        //end ng-show helper functions

        $scope.buildWinningText = function(history) {
            var text = history.black;
            var count = 0;
            if(text.indexOf("__________") != -1) {
                while(text.indexOf("__________") != -1) {
                    text = text.replace("__________", "<b>" + history.white[count] + "</b>");
                    count++;
                }
            } else {
                text = text + " <b>" + history.white[0] + "</b>";
            }
            return text;
        };

        $scope.whiteCardNonNull = function(item) {
            return item.selectedWhiteCards.length > 0;
        }

        $scope.getPlayerStatus = function(player) {
            var status ='';
            if(!$scope.game.isStarted) {
                status = "In attesa";
            }
            else if(!$scope.game.isReadyForReview && !$scope.game.isReadyForScoring) {
                if(player.isCzar) {
                    status = "Card czar";
                } else if(player.selectedWhiteCards.length < $scope.game.currentBlackCardPick) {
                    status = "Selezionando carta";
                } else if(player.selectedWhiteCards.length === $scope.game.currentBlackCardPick) {
                    status = "Carta selezionata";
                }
            }
            else if($scope.game.isReadyForReview) {
                if(player.isReady) {
                    status = "Pronto per il prossimo turno";
                } else {
                    status = "Vedendo i risultati";
                }
            }
            else if($scope.game.isReadyForScoring) {
                if(player.isCzar) {
                    status = "Selezionando il vincitore";
                } else {
                    status = "Carta selezionata";
                }
            }
            if($scope.game.isOver) {
                status = player.awesomePoints == $scope.game.pointsToWin ? "IL VINCITORE!" : "PERDENTE :(";
            }

            return status;
        }

        $scope.selectCard = function(card) {
            if($scope.currentPlayer.selectedWhiteCards.indexOf(card) == -1){
                GameService.selectCard($scope.gameId, $scope.playerId, card);
            }
        };

        $scope.getButtonClass = function(card) {
            if($scope.currentPlayer.selectedWhiteCards.indexOf(card) == -1) {
                return 'btn btn-primary'
            } else {
                return 'btn btn-default'
            }
        };
        $scope.getButtonText = function(card) {
            if(  $scope.currentPlayer.selectedWhiteCards.indexOf(card) >= 0) {
                if($scope.game.currentBlackCardPick === 1){
                    return 'Selezionata'
                }   else {
                    var selectionTxt = ["Prima", "Seconda", "Terza"];
                    return selectionTxt[$scope.currentPlayer.selectedWhiteCards.indexOf(card)]
                }
            } else {
                return 'Seleziona'
            }
        };

        $scope.selectWinner = function(cards) {
            GameService.selectWinner($scope.gameId, cards);
        };

        $scope.getWinningCardClass = function(card) {        
            if(JSON.stringify(card) == JSON.stringify($scope.game.winningCards)){
                return 'alert alert-success'
            } else {
                return ''
            }
        };

        $scope.readyForNextRound = function() {
            GameService.readyForNextRound($scope.gameId, $scope.playerId);
        };
        $scope.startGame = function() {
            console.info($scope);
            GameService.startGame($scope.gameId);
        };
        function setProgStyle() {
            if($scope.game){
                var playersWaiting = _.reduce($scope.game.players, function(total, player) {
                    if(player.selectedWhiteCards){return total + 1}
                    else{ return total}
                }, 0);
                //this extra addition brings the progress bar to 100% when the game is ready for review
                if($scope.game.isReadyForReview){
                    playersWaiting += 1;
                }
                $scope.progStyle = {width: ((playersWaiting / $scope.game.players.length) * 100)  + '%'};
            }
        }

        function renderGame(game) {
            $scope.game = game;
            $scope.currentPlayer = _.find(game.players, function(p) {
                return p.id === $scope.playerId;
            });
            if(!$scope.currentPlayer){
                $scope.currentPlayer = _.find(game.spectators, function(p) {
                    return p.id === $scope.playerId;
                });
            }
            setProgStyle();
        }

        function initSocket() {
            socket = io.connect('/', {query: 'playerId=' + $routeParams.playerId});
            if(socket.socket.connected){
                socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
            }
            socket.on('connect', function() {
                console.info('game socket connect');
                socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
            });

            socket.on('updateGame', function(game) {
                console.info('updateGame');
                renderGame(game);
                $scope.$apply();
            });

            socket.on('gameError', function(errorMsg) {
                $scope.gameError = errorMsg;
                $scope.$apply();
            });
        }
        function spectateGame() {
            GameService.spectateGame($routeParams.gameId, $routeParams.playerId)
                .then(function(success) {
                    renderGame(success.data);
                    initSocket();
                },
              function(error) {
                $scope.gameError = error.data.error;
              });
        }
        function joinGame() {
            GameService.joinGame($routeParams.gameId, $routeParams.playerId, $routeParams.playerName)
                .then(function(success) {
                    renderGame(success.data);
                    initSocket();
                },
              function(error) {
                $scope.gameError = error.data.error;
              });
        }
        if($routeParams.playerName === undefined){
            spectateGame();
        }   else {
            joinGame();
        }
        //initSocket();
        $scope.$emit('enterGame');

        $scope.$on('$destroy', function(event) {
            console.info('leaving GameCtrl');
            if($scope.game){
                GameService.departGame($scope.game.id, $scope.playerId);
            }
        });
    })
    .controller('LobbyCtrl', function($scope, $location, GameService) {
        console.info('LobbyCtrl loaded');
        var socket;

        $scope.availableGames = [];
        $scope.creatingGame = false;
        $scope.gameSvc = GameService;

        $scope.getGames = function() {
            GameService.getGames()
                .then(function(success) {
                    var games = success.data;
                    console.info('getGames returned ' + games.length + ' items');
                    $scope.availableGames = games;
            });
        };

        function initSocket() {
            socket = io.connect('/lobby');
            if(socket.socket.connected){
                $scope.getGames();
            }
            socket.on('connect', function() {
                console.info('lobby socket connect');
            });

            socket.on('lobbyJoin', function(gameList) {
                console.info('lobbySocket: lobbyJoin');
                $scope.availableGames = gameList;
                $scope.$apply();
            });

            socket.on('gameAdded', function(gameList) {
                console.info('gameAdded');
                $scope.availableGames = gameList;
                $scope.$apply();
            });
        }
        initSocket();
        $scope.$emit('enterLobby');
    });