function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var app = angular.module("App", ["ngRoute"]);
app.config([
    "$routeProvider",
    function ($routeProvider) {
        $routeProvider.
            when("/game", {
            templateUrl: "view/game.html",
            controller: "GameController"
        }).
            when("/menu", {
            templateUrl: "view/menu.html",
            controller: "MenuController"
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

var InvalidStepError = (function () {
    function InvalidStepError(message) {
        this.message = message;
        this.name = "InvalidStepError";
    }
    return InvalidStepError;
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
    BoardState.prototype.step = function (toCoordX, toCoordY) {
        if (this.getResult() !== "play") {
            throw new InvalidStepError("Game Over");
        }
        if (this.getCell(toCoordX, toCoordY) !== "") {
            throw new InvalidStepError("Occupied Cell");
        }
        return new BoardState(setMatrix(this.board, toCoordY, toCoordX, this.turn), nextPlayer(this.turn));
    };
    BoardState.prototype.isTie = function () {
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
        if (this.isTie()) {
            return "tie";
        }
        return this.checkWinner();
    };
    return BoardState;
}());
var Serializer = {
    serialize: function (state) {
        // use only ordered structures to ensure uniqueness, as state objects may have properties in random order.
        return JSON.stringify([state.turn, state.board]);
    },
    unserialize: function (str) {
        var data = JSON.parse(str);
        return new BoardState(data[1], data[0]);
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
        pending[data.kind](data.value);
    };
    TicTacToeAI.prototype._createWorker = function () {
        var _this = this;
        var worker = new Worker("bundle-worker.js");
        worker.onmessage = function (evt) { _this._handleMessage(evt.data); };
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
        this._handleIfCpuRound();
    }
    GameController.prototype.isTurnOf = function (type) {
        if (this.boardState.turn === "o") {
            return this.playero === type;
        }
        else {
            return this.playerx === type;
        }
    };
    GameController.prototype.isPlayerTurn = function () {
        return this.isTurnOf("player");
    };
    GameController.prototype.isCpuTurn = function () {
        return this.isTurnOf("cpu");
    };
    GameController.prototype._setBoardState = function (boardState) {
        this.boardState = boardState;
        this._changestamp++;
        var result = boardState.getResult();
        if (result === "play") {
            LocalStorageGameStore.saveGame(this);
            this._handleIfCpuRound();
        }
        else {
            this.fireEvent("gameover", result);
        }
    };
    GameController.prototype._step = function (toCoordX, toCoordY) {
        this._setBoardState(this.boardState.step(toCoordX, toCoordY));
    };
    GameController.prototype._handleIfCpuRound = function () {
        if (this.isCpuTurn()) {
            this._handleCpuRound();
        }
    };
    GameController.prototype.undoPlayerStep = function () {
        if (this.history.length > 0) {
            var last = this.history.pop();
            this._setBoardState(last);
        }
    };
    GameController.prototype._calculateCpuMove = function () {
        var _this = this;
        return delay(1000 + Math.random() * 500).then(function () {
            return aiWorker.getWinningCategory(_this.boardState);
        });
    };
    GameController.prototype._handleCpuMove = function (winningCategory, savedChangestamp) {
        if (this._changestamp === savedChangestamp) {
            this._step(winningCategory.transition[0], winningCategory.transition[1]);
            this.fireEvent("afterCpuRound");
        }
    };
    GameController.prototype._handleCpuRound = function () {
        var _this = this;
        var savedChangestamp = this._changestamp;
        this._calculateCpuMove().then(function (winningCategory) {
            console.log(winningCategory);
            _this._handleCpuMove(winningCategory, savedChangestamp);
        }).then(null, function (e) {
            _this.fireEvent("error", e);
            console.error(e);
        });
    };
    GameController.prototype.putPlayerSign = function (toCoordX, toCoordY) {
        if (this.isPlayerTurn()) {
            this.history.push(this.boardState);
            this._step(toCoordX, toCoordY);
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

var SignImgs = {
    "": "img/empty.svg",
    "o": "img/sign-o.svg",
    "x": "img/sign-x.svg"
};
var ALL_COORDS$$1 = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1],
    [0, 2], [1, 2], [2, 2]
];
var FIRST_PLAYER = "x";
// TODO: wire ng-annotate
app.controller("GameController", function ($scope, $routeParams) {
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
    $scope.getCellValue = function (coord) { return model.boardState.board[coord[1]][coord[0]]; };
    $scope.isAiRound = function () {
        return $scope.model.isCpuTurn();
    };
    $scope.putSign = function (coord) {
        model.putPlayerSign(coord[0], coord[1]);
    };
    $scope.doUndo = function () {
        model.undoPlayerStep();
    };
    $scope.doReset = function () {
        model.reset("x");
    };
    $scope.isTurnOf = function (player) {
        return model.boardState.getResult() === "play" && model.boardState.turn == player;
    };
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

// TODO: wire ng-annotate
app.controller("MenuController", function ($scope) {
    $scope.canContinue = LocalStorageGameStore.hasSavedGame();
});

var x = 4;
x = null;
console.log(x);
