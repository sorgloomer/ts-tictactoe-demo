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
function minBy(arr, mapping, def) {
    return _selectBy(arr, mapping, def, function (prev, current) { return current < prev; });
}
function maxBy(arr, mapping, def) {
    return _selectBy(arr, mapping, def, function (prev, current) { return current > prev; });
}
function getRandomItem(arr, def) {
    if (arr.length < 1) {
        return def;
    }
    var index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

var __extends = (undefined && undefined.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var MoveSelectorBase = (function () {
    function MoveSelectorBase() {
    }
    MoveSelectorBase.prototype.getWinningMoves = function (edges, currentPlayer) {
        return edges.filter(function (d) { return d.category.doesWin(currentPlayer); });
    };
    MoveSelectorBase.prototype.getTieMoves = function (edges) {
        return edges.filter(function (d) { return d.category.kind === "tie"; });
    };
    MoveSelectorBase.prototype.selectMove = function (edges, currentPlayer) {
        var edge = this.selectWinningMove(edges, currentPlayer);
        edge = edge || this.selectTieMove(edges);
        edge = edge || this.selectLosingMove(edges);
        if (edge !== null) {
            return edge;
        }
        else {
            throw new Error("Strategy didn't find a move");
        }
    };
    return MoveSelectorBase;
}());
var RandomMoveSelector = (function (_super) {
    __extends(RandomMoveSelector, _super);
    function RandomMoveSelector() {
        _super.apply(this, arguments);
    }
    RandomMoveSelector.prototype.selectWinningMove = function (edges, currentPlayer) {
        var possibilities = this.getWinningMoves(edges, currentPlayer);
        return getRandomItem(possibilities, null);
    };
    RandomMoveSelector.prototype.selectTieMove = function (edges) {
        var possibilities = this.getTieMoves(edges);
        return getRandomItem(possibilities, null);
    };
    RandomMoveSelector.prototype.selectLosingMove = function (edges) {
        return getRandomItem(edges, null);
    };
    return RandomMoveSelector;
}(MoveSelectorBase));
var SpeculatingMoveSelector = (function (_super) {
    __extends(SpeculatingMoveSelector, _super);
    function SpeculatingMoveSelector() {
        _super.apply(this, arguments);
    }
    SpeculatingMoveSelector.prototype.selectWinningMove = function (edges, currentPlayer) {
        var possibilities = this.getWinningMoves(edges, currentPlayer);
        return minBy(possibilities, categoryDistanceOf, null);
    };
    SpeculatingMoveSelector.prototype.selectTieMove = function (edges) {
        var possibilities = this.getTieMoves(edges);
        return maxBy(possibilities, categoryDistanceOf, null);
    };
    SpeculatingMoveSelector.prototype.selectLosingMove = function (edges) {
        return maxBy(edges, categoryDistanceOf, null);
    };
    return SpeculatingMoveSelector;
}(MoveSelectorBase));
function categoryDistanceOf(edge) {
    return edge.category.distance;
}

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
    function MinMax(graph, _stepSelector) {
        if (_stepSelector === void 0) { _stepSelector = new RandomMoveSelector(); }
        this.graph = graph;
        this._stepSelector = _stepSelector;
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
    MinMax.prototype._calculateNextEdges = function (state) {
        var _this = this;
        var transitions = this.graph.transitions(state);
        return transitions.map(function (transition) {
            var nextState = _this.graph.apply(state, transition);
            var category = _this.getWinningCategoryOf(nextState);
            return { transition: transition, nextState: nextState, category: category };
        });
    };
    MinMax.prototype._processNonFinishedState = function (state, inspection) {
        var edges = this._calculateNextEdges(state);
        if (inspection.currentPlayer === undefined) {
            throw new Error("Internal error: current player is not present in _processNonFinishedState");
        }
        var edge = this._stepSelector.selectMove(edges, inspection.currentPlayer);
        return extendCategory(edge.category, edge.transition);
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
var ALL_COORDS = [
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
var Transitions = {
    getTransitionsOf: function (state) {
        return ALL_COORDS.filter(function (_a) {
            var x = _a[0], y = _a[1];
            return state.getCell(x, y) === "";
        });
    }
};

var minmax = new MinMax({
    apply: function (state, _a) {
        var coordx = _a[0], coordy = _a[1];
        return state.moveTo(coordx, coordy);
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
self.addEventListener("message", function (evt) {
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
});
