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
function setArray(array, index, value) {
    if (array[index] === value) {
        return array;
    }
    return setArrayNew(array, index, value);
}
function updateArray(array, index, updater) {
    return setArray(array, index, updater(array[index], index, array));
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
    function InvalidStepError() {
        this.name = "InvalidStepError";
    }
    return InvalidStepError;
}());
function nextPlayer(currentPlayer) {
    return currentPlayer === "o" ? "x" : "o";
}
var EMPTY_BOARD = repeat(repeat("", 3), 3);
var State = (function () {
    function State(board, turn) {
        this.board = board;
        this.turn = turn;
    }
    State.initial = function (turn) {
        return new State(EMPTY_BOARD, turn);
    };
    State.prototype.step = function (toCoordX, toCoordY) {
        var _this = this;
        if (this.getCell(toCoordX, toCoordY) !== "") {
            throw new InvalidStepError();
        }
        return new State(updateArray(this.board, toCoordY, function (row) { return setArray(row, toCoordX, _this.turn); }), nextPlayer(this.turn));
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

function formatState(state) {
    return "Turn: $(state.turn)\n" + state.board.map(function (r) { return r.map(function (c) { return c || "."; }).join(" "); }).join("\n");
}
window.addEventListener("load", function () {
    var state = State.initial("x");
    var ai = new TicTacToeAI();
    schedule();
    function schedule() {
        setTimeout(stepByAi, 10);
    }
    function stepByAi() {
        console.log(formatState(state));
        ai.getWinningCategory(state).then(function (res) {
            console.log(res);
            if (res.transition) {
                state = state.step.apply(state, res.transition);
                schedule();
            }
        }, function (reas) {
            console.error(reas);
        });
    }
});
