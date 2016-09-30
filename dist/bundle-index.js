var app = angular.module("App", ["ngRoute"]);
app.config([
    "$routeProvider",
    function ($routeProvider) {
        $routeProvider.
            when("/game", {
            templateUrl: "view/game.html",
            controller: "TableController"
        }).
            when("/menu", {
            template: "view/menu.html",
            controller: ""
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
var ALL_COORDS = [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2]
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
var State = (function () {
    function State(board, turn) {
        this.board = board;
        this.turn = turn;
    }
    State.initial = function (turn) {
        return new State(EMPTY_BOARD, turn);
    };
    State.prototype.step = function (toCoordX, toCoordY) {
        if (this.getResult() !== "play") {
            throw new InvalidStepError("Game Over");
        }
        if (this.getCell(toCoordX, toCoordY) !== "") {
            throw new InvalidStepError("Occupied Cell");
        }
        return new State(setMatrix(this.board, toCoordY, toCoordX, this.turn), nextPlayer(this.turn));
    };
    State.prototype.isTie = function () {
        return all(this.board, function (row) { return all(row, function (cell) { return cell !== ""; }); });
    };
    State.prototype.getCell = function (x, y) {
        return this.board[y][x];
    };
    State.prototype.subboardResult = function (centerX, centerY, deltaX, deltaY) {
        var _this = this;
        var values = [0, 1, 2].map(function (i) { return _this.getCell(centerY + i * deltaY, centerX + i * deltaX); });
        return everySameOrDefault(values, "");
    };
    State.prototype.checkWinner = function () {
        for (var _i = 0, DIAGONALS_1 = DIAGONALS; _i < DIAGONALS_1.length; _i++) {
            var diagonal = DIAGONALS_1[_i];
            var temp = this.subboardResult.apply(this, diagonal);
            if (temp) {
                return temp;
            }
        }
        return "play";
    };
    State.prototype.getResult = function () {
        if (this.isTie()) {
            return "tie";
        }
        return this.checkWinner();
    };
    return State;
}());
var Serializer = {
    serialize: function (state) {
        // use only ordered structures to ensure uniqueness, as state objects may have properties in random order.
        return JSON.stringify([state.turn, state.board]);
    },
    unserialize: function (str) {
        var data = JSON.parse(str);
        return new State(data[1], data[0]);
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

var StateWithHistory = (function () {
    function StateWithHistory(game, prev) {
        if (prev === void 0) { prev = null; }
        this.game = game;
        this.prev = prev;
    }
    return StateWithHistory;
}());
var SignImgs = {
    "": "img/empty.svg",
    "o": "img/sign-o.svg",
    "x": "img/sign-x.svg"
};
// TODO: wire ng-annotate
app.controller("TableController", [
    "$scope", "$timeout", "AiService",
    function ($scope, $timeout, AiService) {
        $scope.allCoords = ALL_COORDS;
        $scope.signImgs = SignImgs;
        $scope.state = null;
        $scope.getCellValue = function (coord) { return $scope.state.game.board[coord[0]][coord[1]]; };
        $scope.isAiRound = function () {
            return $scope.state.game.turn == "o";
        };
        function setState(state) {
            $scope.state = state;
            if ($scope.isAiRound()) {
                scheduleAi();
            }
        }
        $scope.putSign = function (coord) {
            setState(new StateWithHistory($scope.state.game.step(coord[1], coord[0]), $scope.state));
        };
        function putAi(coord) {
            setState(new StateWithHistory($scope.state.game.step(coord[1], coord[0]), $scope.state.prev // skip ai steps in history
            ));
        }
        
        $scope.doUndo = function () {
            if ($scope.state.prev) {
                setState($scope.state.prev);
            }
        };
        $scope.doReset = function () {
            reset();
        };
        reset();
        function reset() {
            $scope.state = new StateWithHistory(State.initial("x"));
        }
        function stepAi(lastState) {
            AiService.getWinningCategory(lastState.game).then(function (cat) {
                if ($scope.state === lastState) {
                    putAi(cat.transition);
                }
            });
        }
        function scheduleAi() {
            var currentState = $scope.state;
            $timeout(function () {
                stepAi(currentState);
            }, 1000 + 3000 * Math.random());
        }
    }
]);
app.factory("AiService", [
    "$q", function ($q) {
        var service = new TicTacToeAI();
        return {
            getWinningCategory: function (state) {
                return $q.when(service.getWinningCategory(state));
            }
        };
    }
]);
