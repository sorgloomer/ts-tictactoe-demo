
import * as utils from "../utils/arrays";
import * as immutable from "../utils/immutable";
import { int, mapRange } from "../utils/arrays";


export type Turn = "o" | "x";
export type Transition = [int, int];
export type Result = "play" | "wino" | "winx" | "tie";

type CellValue = "" | "o" | "x";
type Board = CellValue[][];

const DIAGONALS = [
    [0, 0, 0, 1],
    [1, 0, 0, 1],
    [2, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 1, 1, 0],
    [0, 2, 1, 0],
    [0, 0, 1, 1],
    [2, 0, -1, 1]
];

export const ALL_COORDS = [
    [0,0], [0,1], [0,2],
    [1,0], [1,1], [1,2],
    [2,0], [2,1], [2,2]
];

export class InvalidMoveError {
    name : string = "InvalidMoveError";
    constructor(public message: string) {}
}

export function nextPlayer(currentPlayer : Turn) : Turn {
    return currentPlayer === "o" ? "x" : "o";
}

const EMPTY_BOARD : Board = utils.repeat(utils.repeat("", 3), 3);


function setMatrix<T>(mx:T[][], i: int, j: int, value: T) : T[][] {
    return immutable.update(mx, i, row => immutable.set(row, j, value));
}

export class BoardState {
    constructor(public board : Board, public turn : Turn) {
    }

    static initial(turn : Turn) {
        return new BoardState(EMPTY_BOARD, turn);
    }

    moveTo(toCoordX : number, toCoordY : number) : BoardState {
        if (this.getResult() !== "play") {
            throw new InvalidMoveError("Game Over");
        }
        if (this.getCell(toCoordX, toCoordY) !== "") {
            throw new InvalidMoveError("Occupied Cell");
        }

        return new BoardState(
            setMatrix(this.board, toCoordY, toCoordX, this.turn),
            nextPlayer(this.turn)
        );
    }

    hasNoMoreMoves() : boolean {
        return utils.all(this.board, row => utils.all(row, cell => cell !== ""))
    }

    getCell(x : number, y : number) : CellValue {
        return this.board[y][x];
    }

    subboardResult(centerX : number, centerY : number, deltaX : number, deltaY : number) : CellValue {
        const values = [0,1,2].map(
            i => this.getCell(centerY + i * deltaY, centerX + i * deltaX)
        );
        return utils.everySameOrDefault<CellValue>(values, "");
    }

    checkWinner() : Result {
        for (let diagonal of DIAGONALS) {
            const temp : CellValue = this.subboardResult(...diagonal);
            if (temp) {
                return temp === "x" ? "winx" : "wino";
            }
        }
        return "play";
    }

    getResult() : Result {
        const winner : Result = this.checkWinner();
        if (winner === "play" && this.hasNoMoreMoves()) {
            return "tie";
        }
        return winner;
    }
}


export const Serializer = {
    serialize(state : BoardState) : string {
        // use only ordered structures to ensure uniqueness, as state objects may have properties in random order.
        return JSON.stringify([state.turn, state.board]);
    },
    unserialize(str: string) : BoardState {
        const data = JSON.parse(str);
        return new BoardState(data[1], data[0]);
    }
};

export const Transitions = {
    getTransitionsOf(state : BoardState) : Transition[] {
        const result : Transition[] = [];
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                if (state.getCell(x, y) === "") {
                    result.push([x, y]);
                }
            }
        }
        return result;
    }
};