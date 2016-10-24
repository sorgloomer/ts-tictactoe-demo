import {BoardState, Serializer, Transition, Turn} from "../model/board-state";
import {WinningCategoryData} from "../algorithm/game-contract";

interface Pending {
    resolve(value : any);
    reject(value : any);
}

interface AiWorkerMessage {
    id: number;
    kind: "resolve"|"reject";
    value: any;
}

export class TicTacToeAI {
    worker: Worker | null = null;
    pending: Map<number, Pending> = new Map<number, Pending>();
    sequence: number = 0;

    getWorker() : Worker {
        return this.worker || (this.worker = this._createWorker());
    }

    _handleMessage(data: AiWorkerMessage) : void {
        const pending = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (pending) {
            pending[data.kind](data.value);
        }
    }

    _createWorker() : Worker {
        const worker = new Worker("bundle-worker.js");
        worker.addEventListener("message", evt => {
            this._handleMessage(evt.data);
        });
        return worker;
    }

    _postCall(id: number, name: string, args : any[]) : void {
        this.getWorker().postMessage({ id, kind: "call", name, args });
    }
    _call(name: string, ...args) : Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++this.sequence;
            this.pending.set(id, {resolve, reject});
            this._postCall(id, name, args);
        });
    }

    getWinningCategory(state: BoardState) : Promise<WinningCategoryData<Turn, Transition>> {
        return this._call("getWinningCategory", Serializer.serialize(state));
    }
}
