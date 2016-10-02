import {BoardState, Serializer} from "../model/board-state";
import {WinningCategoryData} from "../algorithm/game-contract";

export class TicTacToeAI {
    worker: Worker = null;
    pending: Map = new Map();
    sequence: number = 0;

    getWorker() : Worker {
        return this.worker || (this.worker = this._createWorker());
    }

    _handleMessage(data) : void {
        const pending = this.pending.get(data.id);
        this.pending.delete(data.id);
        pending[data.kind](data.value);
    }

    _createWorker() : Worker {
        const worker = new Worker("bundle-worker.js");
        worker.onmessage = evt => { this._handleMessage(evt.data); };
        return worker;
    }

    _postCall(id: number, name: string, args : Array) : void {
        this.getWorker().postMessage({ id, kind: "call", name, args });
    }
    _call(name: string, ...args) : Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++this.sequence;
            this.pending.set(id, {resolve, reject});
            this._postCall(id, name, args);
        });
    }

    getWinningCategory(state: BoardState) : Promise<WinningCategoryData> {
        return this._call("getWinningCategory", Serializer.serialize(state));
    }
}
