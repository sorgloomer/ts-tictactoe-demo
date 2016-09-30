var app = angular.module("App", []);

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
    "$scope",
    function ($scope) {
        $scope.allCoords = ALL_COORDS;
        $scope.signImgs = SignImgs;
        $scope.state = null;
        $scope.getCellValue = function (coord) { return $scope.state.game.board[coord[0]][coord[1]]; };
        $scope.putSign = function (coord) {
            $scope.state = new StateWithHistory($scope.state.game.step(coord[1], coord[0]), $scope.state);
        };
        $scope.doUndo = function () {
            if ($scope.state.prev) {
                $scope.state = $scope.state.prev;
            }
        };
        $scope.doReset = function () {
            reset();
        };
        reset();
        function reset() {
            $scope.state = new StateWithHistory(State.initial("x"));
        }
    }
]);
