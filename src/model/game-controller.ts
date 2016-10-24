

import {BoardState, Turn, Transition, Serializer, Result} from "./board-state";
import {TicTacToeAI} from "../worker/ai";
import {WinningCategory} from "../algorithm/game-contract";
import {EventSource} from "../utils/events";
import {LocalStorageGameStore} from "./game-store";
export type PlayerType = "player" | "cpu";

function delay(timeoutMs: number) : Promise<undefined> {
    return new Promise(resolve => {
        setTimeout(() => resolve(), timeoutMs);
    });
}


const aiWorker = new TicTacToeAI();

export class GameController extends EventSource {
    _changestamp: number = 0;

    constructor(public playero: PlayerType,
                public playerx: PlayerType,
                public boardState: BoardState,
                public history: BoardState[]) {
        super(["afterCpuRound", "error", "gameover"]);
        this._actualizeNewState();
    }

    getPlayerType(player : Turn) {
        return player === "o" ? this.playero : this.playerx;
    }

    isTurnOf(type: PlayerType): boolean {
        return this.getPlayerType(this.boardState.turn) === type;
    }

    isPlayerTurn(): boolean {
        return this.isTurnOf("player");
    }
    isCpuTurn(): boolean {
        return this.isTurnOf("cpu");
    }

    _actualizeNewState() : void {
        const result : Result = this.boardState.getResult();
        if (result === "play") {
            this._handleIfCpuRound();
        } else {
            this.fireEvent("gameover", result);
        }
        LocalStorageGameStore.saveGame(this);
    }

    _setBoardState(boardState: BoardState): void {
        this.boardState = boardState;
        this._changestamp++;
        this._actualizeNewState();
    }

    _move(toCoordX: number, toCoordY: number): void {
        this._setBoardState(this.boardState.moveTo(toCoordX, toCoordY));
    }

    _handleIfCpuRound(): void {
        if (this.isCpuTurn()) {
            this._handleCpuRound();
        }
    }

    undoPlayerMove(): void {
        const last = this.history.pop();
        if (last !== undefined) {
            this._setBoardState(last);
        }
    }

    _calculateCpuMove() : Promise<WinningCategory<Turn, Transition>> {
        return delay(500).then(() => {
            return aiWorker.getWinningCategory(this.boardState);
        });
    }

    _handleCpuMove(winningCategory : WinningCategory<Turn, Transition>, savedChangestamp : number) : void {
        if (this._changestamp === savedChangestamp) {
            if (winningCategory.transition === null) {
                throw new Error("Internal error: transition not present in _handleCpuMove");
            }
            const [movex, movey] = winningCategory.transition;
            this._move(movex, movey);
            this.fireEvent("afterCpuRound");
        }
    }

    _handleCpuRound() : void {
        const savedChangestamp = this._changestamp;
        this._calculateCpuMove().then(winningCategory => {
            this._handleCpuMove(winningCategory, savedChangestamp);
        }).then(<any>null, e => {
            this.fireEvent("error", e);
            console.error(e);
        });
    }

    putPlayerSign(toCoordX : number, toCoordY : number) : void {
        if (this.isPlayerTurn()) {
            this.history.push(this.boardState);
            this._move(toCoordX, toCoordY);
        } else {
            throw new Error("It's CPU turn");
        }
    }

    reset(initialPlayer : Turn) {
        this.history.length = 0;
        this._setBoardState(BoardState.initial(initialPlayer));
    }
}


export const GameControllerSerializer = {
    serialize(model) {
        return JSON.stringify({
            "playero": model.playero,
            "playerx": model.playerx,
            "boardState": Serializer.serialize(model.boardState),
            "history": model.history.map(Serializer.serialize)
        });
    },

    unserialize(str) {
        const data = JSON.parse(str);
        return new GameController(
            data.playero,
            data.playerx,
            Serializer.unserialize(data.boardState),
            data.history.map(Serializer.unserialize)
        );
    }
};