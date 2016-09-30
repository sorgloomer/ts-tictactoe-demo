
import * as utils from "../utils/arrays";
import * as immutable from "../utils/immutable";
import { int, mapRange } from "../utils/arrays";


export type Turn = "o" | "x";
export type Transition = [int, int];

type CellValue = "" | "o" | "x";
type Result = "play" | "wino" | "winx" | "tie";
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

export class InvalidStepError {
    name : string = "InvalidStepError";
    constructor(public message: string) {}
}

export function nextPlayer(currentPlayer : Turn) : Turn {
    return currentPlayer === "o" ? "x" : "o";
}

const EMPTY_BOARD : Board = utils.repeat(utils.repeat("", 3), 3);


function setMatrix<T>(mx:T[][], i: int, j: int, value: T) : T[][] {
    return immutable.update(mx, i, row => immutable.set(row, j, value));
}

export class State {
    constructor(public board : Board, public turn : Turn) {
    }

    static initial(turn : Turn) {
        return new State(EMPTY_BOARD, turn);
    }

    step(toCoordX : number, toCoordY : number) : State {
        if (this.getResult() !== "play") {
            throw new InvalidStepError("Game Over");
        }
        if (this.getCell(toCoordX, toCoordY) !== "") {
            throw new InvalidStepError("Occupied Cell");
        }

        return new State(
            setMatrix(this.board, toCoordY, toCoordX, this.turn),
            nextPlayer(this.turn)
        );
    }

    isTie() : boolean {
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
            const temp : Result = this.subboardResult(...diagonal);
            if (temp) {
                return temp;
            }
        }
        return "play";
    }

    getResult() : Result {
        if (this.isTie()) {
            return "tie";
        }
        return this.checkWinner();
    }
}


export const Serializer = {
    serialize(state : State) : string {
        // use only ordered structures to ensure uniqueness, as state objects may have properties in random order.
        return JSON.stringify([state.turn, state.board]);
    },
    unserialize(str: string) : State {
        const data = JSON.parse(str);
        return new State(data[1], data[0]);
    }
};

export const Transitions = {
    getTransitionsOf(state : State) : Transition[] {
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