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

function minBy(arr, mapping, def) {
    if (def === void 0) { def = null; }
    if (arr.length < 1) {
        return def;
    }
    var bestItem = arr[0];
    var bestValue = mapping(bestItem, 0, arr);
    for (var i = 1; i < arr.length; i++) {
        var currentItem = arr[i];
        var currentValue = mapping(currentItem, i, arr);
        if (currentValue < bestValue) {
            bestItem = currentItem;
            bestValue = currentValue;
        }
    }
    return bestItem;
}
function maxBy(arr, mapping, def) {
    if (def === void 0) { def = null; }
    if (arr.length < 1) {
        return def;
    }
    var bestItem = arr[0];
    var bestValue = mapping(bestItem, 0, arr);
    for (var i = 1; i < arr.length; i++) {
        var currentItem = arr[i];
        var currentValue = mapping(currentItem, i, arr);
        if (currentValue > bestValue) {
            bestItem = currentItem;
            bestValue = currentValue;
        }
    }
    return bestItem;
}
function getRandomItem(arr, def) {
    if (def === void 0) { def = null; }
    if (arr.length < 1) {
        return def;
    }
    var index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

var WinningCategory = (function () {
    function WinningCategory(kind, player, distance, transition) {
        if (player === void 0) { player = null; }
        if (distance === void 0) { distance = 0; }
        if (transition === void 0) { transition = null; }
        this.kind = kind;
        this.player = player;
        this.distance = distance;
        this.transition = transition;
    }
    WinningCategory.prototype.doesWin = function (player) {
        return this.kind === "winning" && this.player === player;
    };
    return WinningCategory;
}());

var ENDLESS = new WinningCategory("endless");
function extendCategory(category, transition) {
    return new WinningCategory(category.kind, category.player, category.distance + 1, transition);
}
var NodeData = (function () {
    function NodeData(state) {
        this.state = state;
        this.traversing = false;
    }
    return NodeData;
}());
var MinMax = (function () {
    function MinMax(graph, randomMode) {
        if (randomMode === void 0) { randomMode = true; }
        this.graph = graph;
        this.randomMode = randomMode;
        this.states = new Map();
    }
    MinMax.prototype.getNodeData = function (state) {
        var key = this.graph.serialize(state);
        var data = this.states.get(key);
        if (data) {
            return data;
        }
        var newData = new NodeData(state);
        this.states.set(key, newData);
        return newData;
    };
    MinMax.prototype._processFinishedState = function (inspection) {
        if (inspection.isTie) {
            return new WinningCategory("tie");
        }
        else {
            return new WinningCategory("winning", inspection.winnerPlayer);
        }
    };
    MinMax.prototype._processSoonestWin = function (steps, currentPlayer) {
        var possibilities = steps.filter(function (d) { return d.category.doesWin(currentPlayer); });
        if (this.randomMode) {
            return getRandomItem(possibilities);
        }
        else {
            return minBy(possibilities, function (d) { return d.category.distance; }, null);
        }
    };
    MinMax.prototype._processLatestTie = function (steps) {
        var possibilities = steps.filter(function (d) { return d.category.kind === "tie"; });
        if (this.randomMode) {
            return getRandomItem(possibilities);
        }
        else {
            return maxBy(possibilities, function (d) { return d.category.distance; }, null);
        }
    };
    MinMax.prototype._processLatestLosing = function (steps) {
        if (this.randomMode) {
            return getRandomItem(steps);
        }
        else {
            return maxBy(steps, function (d) { return d.category.distance; }, null);
        }
    };
    MinMax.prototype._calculateOutgoingSteps = function (state) {
        var _this = this;
        var transitions = this.graph.transitions(state);
        return transitions.map(function (transition) {
            var nextState = _this.graph.apply(state, transition);
            var category = _this.getWinningCategoryOf(nextState);
            return { transition: transition, nextState: nextState, category: category };
        });
    };
    MinMax.prototype._processNonFinishedState = function (state, inspection) {
        var steps = this._calculateOutgoingSteps(state);
        var step = this._processSoonestWin(steps, inspection.currentPlayer);
        // Otherwise try to postpone the tie -- other players might make a mistake
        step = step || this._processLatestTie(steps);
        // Don't check endless kind here, treat it as some other player wins.
        // Try to postpone the winning of the other players -- other players might make a mistake
        step = step || this._processLatestLosing(steps);
        return extendCategory(step.category, step.transition);
    };
    MinMax.prototype._processWinningCategoryOf = function (state, nodeData) {
        var inspection = this.graph.inspect(state);
        if (inspection.isGameOver) {
            return this._processFinishedState(inspection);
        }
        else {
            return this._processNonFinishedState(state, inspection);
        }
    };
    MinMax.prototype._processAndStoreWinningCategoryOf = function (state, nodeData) {
        nodeData.traversing = true;
        var result = this._processWinningCategoryOf(state, nodeData);
        nodeData.winningCategory = result;
        nodeData.traversing = false;
        return result;
    };
    MinMax.prototype.getWinningCategoryOf = function (state) {
        var nodeData = this.getNodeData(state);
        if (nodeData.traversing) {
            return ENDLESS;
        }
        if (nodeData.winningCategory) {
            return nodeData.winningCategory;
        }
        return this._processAndStoreWinningCategoryOf(state, nodeData);
    };
    return MinMax;
}());

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
var Transitions = {
    getTransitionsOf: function (state) {
        var result = [];
        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 3; x++) {
                if (state.getCell(x, y) === "") {
                    result.push([x, y]);
                }
            }
        }
        return result;
    }
};

var minmax = new MinMax({
    apply: function (state, transition) {
        return state.step(transition[0], transition[1]);
    },
    inspect: function (state) {
        var result = state.getResult();
        return {
            isGameOver: result !== "play",
            isTie: result === "tie",
            winnerPlayer: result === "winx" ? "x" : "o",
            currentPlayer: state.turn
        };
    },
    serialize: function (state) {
        return Serializer.serialize(state);
    },
    transitions: function (state) {
        return Transitions.getTransitionsOf(state);
    }
});
var activeObject = {
    getWinningCategory: function (stateStr) {
        return minmax.getWinningCategoryOf(Serializer.unserialize(stateStr));
    }
};
function postResponse(request, kind, value) {
    self.postMessage({ id: request.id, kind: kind, value: value });
}
self.onmessage = function (evt) {
    var request = evt.data;
    if (request.kind === "call") {
        try {
            var result = activeObject[request.name].apply(activeObject, request.args);
            postResponse(request, "resolve", result);
        }
        catch (e) {
            // Can't post error object but a pojo, as errors are not cloneable by the "structured clone" algorithm.
            postResponse(request, "reject", { name: "AiWorkerError", message: "" + e });
        }
    }
};
