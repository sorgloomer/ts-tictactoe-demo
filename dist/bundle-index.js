var app = angular.module("App", ["ngRoute"]);
app.config([
    "$routeProvider",
    function ($routeProvider) {
        $routeProvider.
            when("/game", {
            templateUrl: "view/game.html",
            controller: "GameController",
            reloadOnSearch: false
        }).
            when("/menu", {
            templateUrl: "view/menu.html",
            controller: "MenuController",
            reloadOnSearch: false
        }).
            otherwise("/menu");
    }
]);

function any(arr, pred) {
    for (var i = 0; i < arr.length; i++) {
        if (pred(arr[i], i, arr)) {
            return true;
        }
    }
    return false;
}
function all(arr, pred) {
    return !any(arr, function (v, i, a) { return !pred(v, i, a); });
}
function repeat(value, length) {
    var result = Array(length);
    for (var i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}
function everySameOrDefault(arr, def) {
    var first = arr[0];
    for (var i = 1; i < arr.length; i++) {
        if (arr[i] !== first) {
            return def;
        }
    }
    return first;
}

function _selectBy(arr, mapping, def, better) {
    if (arr.length < 1) {
        return def;
    }
    var bestItem = arr[0];
    var bestValue = mapping(bestItem, 0, arr);
    for (var i = 1; i < arr.length; i++) {
        var currentItem = arr[i];
        var currentValue = mapping(currentItem, i, arr);
        if (better(bestValue, currentValue)) {
            bestItem = currentItem;
            bestValue = currentValue;
        }
    }
    return bestItem;
}

function cloneArray(arr) {
    return Array.prototype.slice.call(arr, 0);
}
function setArrayNew(array, index, value) {
    var result = cloneArray(array);
    result[index] = value;
    return result;
}
function set(array, index, value) {
    if (array[index] === value) {
        return array;
    }
    return setArrayNew(array, index, value);
}
function update(array, index, updater) {
    return set(array, index, updater(array[index], index, array));
}

var DIAGONALS = [
    [0, 0, 0, 1],
    [1, 0, 0, 1],
    [2, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 1, 1, 0],
    [0, 2, 1, 0],
    [0, 0, 1, 1],
    [2, 0, -1, 1]
];
var ALL_COORDS$1 = [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2]
];
var InvalidMoveError = (function () {
    function InvalidMoveError(message) {
        this.message = message;
        this.name = "InvalidMoveError";
    }
    return InvalidMoveError;
}());
function nextPlayer(currentPlayer) {
    return currentPlayer === "o" ? "x" : "o";
}
var EMPTY_BOARD = repeat(repeat("", 3), 3);
function setMatrix(mx, i, j, value) {
    return update(mx, i, function (row) { return set(row, j, value); });
}
var BoardState = (function () {
    function BoardState(board, turn) {
        this.board = board;
        this.turn = turn;
    }
    BoardState.initial = function (turn) {
        return new BoardState(EMPTY_BOARD, turn);
    };
    BoardState.prototype.moveTo = function (toCoordX, toCoordY) {
        if (this.getResult() !== "play") {
            throw new InvalidMoveError("Game Over");
        }
        if (this.getCell(toCoordX, toCoordY) !== "") {
            throw new InvalidMoveError("Occupied Cell");
        }
        return new BoardState(setMatrix(this.board, toCoordY, toCoordX, this.turn), nextPlayer(this.turn));
    };
    BoardState.prototype.hasNoMoreMoves = function () {
        return all(this.board, function (row) { return all(row, function (cell) { return cell !== ""; }); });
    };
    BoardState.prototype.getCell = function (x, y) {
        return this.board[y][x];
    };
    BoardState.prototype.subboardResult = function (centerX, centerY, deltaX, deltaY) {
        var _this = this;
        var values = [0, 1, 2].map(function (i) { return _this.getCell(centerY + i * deltaY, centerX + i * deltaX); });
        return everySameOrDefault(values, "");
    };
    BoardState.prototype.checkWinner = function () {
        for (var _i = 0, DIAGONALS_1 = DIAGONALS; _i < DIAGONALS_1.length; _i++) {
            var diagonal = DIAGONALS_1[_i];
            var temp = this.subboardResult.apply(this, diagonal);
            if (temp) {
                return temp === "x" ? "winx" : "wino";
            }
        }
        return "play";
    };
    BoardState.prototype.getResult = function () {
        var winner = this.checkWinner();
        if (winner === "play" && this.hasNoMoreMoves()) {
            return "tie";
        }
        return winner;
    };
    return BoardState;
}());
var Serializer = {
    serialize: function (state) {
        // use only ordered structures to ensure uniqueness, as state objects may have properties in random order.
        return JSON.stringify([state.turn, state.board]);
    },
    unserialize: function (str) {
        var _a = JSON.parse(str), turn = _a[0], board = _a[1];
        return new BoardState(board, turn);
    }
};

var TicTacToeAI = (function () {
    function TicTacToeAI() {
        this.worker = null;
        this.pending = new Map();
        this.sequence = 0;
    }
    TicTacToeAI.prototype.getWorker = function () {
        return this.worker || (this.worker = this._createWorker());
    };
    TicTacToeAI.prototype._handleMessage = function (data) {
        var pending = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (pending) {
            pending[data.kind](data.value);
        }
    };
    TicTacToeAI.prototype._createWorker = function () {
        var _this = this;
        var worker = new Worker("bundle-worker.js");
        worker.addEventListener("message", function (evt) {
            _this._handleMessage(evt.data);
        });
        return worker;
    };
    TicTacToeAI.prototype._postCall = function (id, name, args) {
        this.getWorker().postMessage({ id: id, kind: "call", name: name, args: args });
    };
    TicTacToeAI.prototype._call = function (name) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            var id = ++_this.sequence;
            _this.pending.set(id, { resolve: resolve, reject: reject });
            _this._postCall(id, name, args);
        });
    };
    TicTacToeAI.prototype.getWinningCategory = function (state) {
        return this._call("getWinningCategory", Serializer.serialize(state));
    };
    return TicTacToeAI;
}());

var EventSource = (function () {
    function EventSource(eventNames) {
        this._eventListeners = new Map();
        for (var _i = 0, eventNames_1 = eventNames; _i < eventNames_1.length; _i++) {
            var eventName = eventNames_1[_i];
            this._eventListeners.set(eventName, new Set());
        }
    }
    EventSource.prototype.addEventListener = function (eventName, listener) {
        this._getListenerSet(eventName).add(listener);
    };
    EventSource.prototype.removeEventListener = function (eventName, listener) {
        this._getListenerSet(eventName).delete(listener);
    };
    EventSource.prototype.fireEvent = function (eventName, eventParam) {
        this._getListenerSet(eventName).forEach(function (listener) {
            listener(eventParam);
        });
    };
    EventSource.prototype._getListenerSet = function (eventName) {
        var listenerSet = this._eventListeners.get(eventName);
        if (!listenerSet) {
            throw new Error("EventSource does not support event: " + eventName);
        }
        return listenerSet;
    };
    return EventSource;
}());

var GameStore = (function () {
    function GameStore(storage) {
        this.storage = storage;
    }
    GameStore.prototype.saveGame = function (controller) {
        this.storage.setItem("saved", GameControllerSerializer.serialize(controller));
    };
    GameStore.prototype.hasSavedGame = function () {
        return !!this.storage.getItem("saved");
    };
    GameStore.prototype.loadGame = function () {
        var stored = this.storage.getItem("saved");
        if (!stored) {
            throw new Error("Can't load game: no stored game");
        }
        return GameControllerSerializer.unserialize(stored);
    };
    return GameStore;
}());
var LocalStorageGameStore = new GameStore(localStorage);

var __extends = (undefined && undefined.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function delay(timeoutMs) {
    return new Promise(function (resolve) {
        setTimeout(function () { return resolve(); }, timeoutMs);
    });
}
var aiWorker = new TicTacToeAI();
var GameController = (function (_super) {
    __extends(GameController, _super);
    function GameController(playero, playerx, boardState, history) {
        _super.call(this, ["afterCpuRound", "error", "gameover"]);
        this.playero = playero;
        this.playerx = playerx;
        this.boardState = boardState;
        this.history = history;
        this._changestamp = 0;
        this._actualizeNewState();
    }
    GameController.prototype.getPlayerType = function (player) {
        return player === "o" ? this.playero : this.playerx;
    };
    GameController.prototype.isTurnOf = function (type) {
        return this.getPlayerType(this.boardState.turn) === type;
    };
    GameController.prototype.isPlayerTurn = function () {
        return this.isTurnOf("player");
    };
    GameController.prototype.isCpuTurn = function () {
        return this.isTurnOf("cpu");
    };
    GameController.prototype._actualizeNewState = function () {
        var result = this.boardState.getResult();
        if (result === "play") {
            this._handleIfCpuRound();
        }
        else {
            this.fireEvent("gameover", result);
        }
        LocalStorageGameStore.saveGame(this);
    };
    GameController.prototype._setBoardState = function (boardState) {
        this.boardState = boardState;
        this._changestamp++;
        this._actualizeNewState();
    };
    GameController.prototype._move = function (toCoordX, toCoordY) {
        this._setBoardState(this.boardState.moveTo(toCoordX, toCoordY));
    };
    GameController.prototype._handleIfCpuRound = function () {
        if (this.isCpuTurn()) {
            this._handleCpuRound();
        }
    };
    GameController.prototype.undoPlayerMove = function () {
        var last = this.history.pop();
        if (last !== undefined) {
            this._setBoardState(last);
        }
    };
    GameController.prototype._calculateCpuMove = function () {
        var _this = this;
        return delay(500).then(function () {
            return aiWorker.getWinningCategory(_this.boardState);
        });
    };
    GameController.prototype._handleCpuMove = function (winningCategory, savedChangestamp) {
        if (this._changestamp === savedChangestamp) {
            if (winningCategory.transition === null) {
                throw new Error("Internal error: transition not present in _handleCpuMove");
            }
            var _a = winningCategory.transition, movex = _a[0], movey = _a[1];
            this._move(movex, movey);
            this.fireEvent("afterCpuRound");
        }
    };
    GameController.prototype._handleCpuRound = function () {
        var _this = this;
        var savedChangestamp = this._changestamp;
        this._calculateCpuMove().then(function (winningCategory) {
            _this._handleCpuMove(winningCategory, savedChangestamp);
        }).then(null, function (e) {
            _this.fireEvent("error", e);
            console.error(e);
        });
    };
    GameController.prototype.putPlayerSign = function (toCoordX, toCoordY) {
        if (this.isPlayerTurn()) {
            this.history.push(this.boardState);
            this._move(toCoordX, toCoordY);
        }
        else {
            throw new Error("It's CPU turn");
        }
    };
    GameController.prototype.reset = function (initialPlayer) {
        this.history.length = 0;
        this._setBoardState(BoardState.initial(initialPlayer));
    };
    return GameController;
}(EventSource));
var GameControllerSerializer = {
    serialize: function (model) {
        return JSON.stringify({
            "playero": model.playero,
            "playerx": model.playerx,
            "boardState": Serializer.serialize(model.boardState),
            "history": model.history.map(Serializer.serialize)
        });
    },
    unserialize: function (str) {
        var data = JSON.parse(str);
        return new GameController(data.playero, data.playerx, Serializer.unserialize(data.boardState), data.history.map(Serializer.unserialize));
    }
};

var ALL_COORDS$$1 = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1],
    [0, 2], [1, 2], [2, 2]
];
var FIRST_PLAYER = "x";
// TODO: use ng-annotate
app.controller("GameController", function ($scope, $routeParams, $location) {
    var model = determineModel();
    model.addEventListener("afterCpuRound", function () {
        $scope.$apply();
    });
    model.addEventListener("error", function (e) {
        console.error(e);
        alert("Sorry, the game ran into an error.");
    });
    $scope.allCoords = ALL_COORDS$$1;
    $scope.signImgs = SignImgs;
    $scope.state = null;
    $scope.getCellValue = function (_a) {
        var coordx = _a[0], coordy = _a[1];
        return model.boardState.board[coordy][coordx];
    };
    $scope.isAiRound = false;
    $scope.$watch(function () { return model.isCpuTurn(); }, function (newValue) { $scope.isAiRound = newValue; });
    $scope.gameResult = "play";
    $scope.$watch(function () { return model.boardState.getResult(); }, function (newValue) { $scope.gameResult = newValue; });
    $scope.putSign = function (_a) {
        var coordx = _a[0], coordy = _a[1];
        model.putPlayerSign(coordx, coordy);
    };
    $scope.doUndo = function () {
        model.undoPlayerMove();
    };
    $scope.doReset = function () {
        model.reset("x");
    };
    $scope.isTurnOf = function (player) {
        return model.boardState.getResult() === "play" && model.boardState.turn == player;
    };
    $scope.getPlayerType = function (player) {
        return model.getPlayerType(player);
    };
    // Don't start new game on refresh
    $location.search("mode", undefined);
    function determineModel() {
        switch ($routeParams.mode) {
            case "pvp":
                return createModel("player", "player");
            case "pvc":
                return createModel("player", "cpu");
            case "cvp":
                return createModel("cpu", "player");
            case "cvc":
                return createModel("cpu", "cpu");
            case "continue":
            default:
                return LocalStorageGameStore.loadGame();
        }
        function createModel(playerx, playero) {
            return new GameController(playero, playerx, BoardState.initial(FIRST_PLAYER), []);
        }
    }
});
var SignImgs = {
    "o": "img/sign-o.svg",
    "x": "img/sign-x.svg"
};
app.directive("ttSign", function () {
    return {
        restrict: "A",
        link: function (scope, elem, attrs) {
            scope.$watch(attrs.ttSign, function (newValue) {
                if (newValue) {
                    elem.attr("src", SignImgs[newValue]);
                }
                elem.toggleClass("filled", !!newValue);
            });
        }
    };
});

// TODO: use ng-annotate
app.controller("MenuController", function ($scope) {
    $scope.canContinue = LocalStorageGameStore.hasSavedGame();
});
