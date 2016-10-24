import { MinMax } from "../algorithm/minmax";
import { StateInspection } from "../algorithm/game-contract";

import {BoardState, Turn, Transition, Serializer, Transitions} from "../model/board-state";

const minmax = new MinMax<BoardState, Transition, Turn>({
    apply(state: BoardState, [coordx, coordy]: Transition) : BoardState {
        return state.moveTo(coordx, coordy);
    },

    inspect(state : BoardState) : StateInspection<Turn> {
        const result = state.getResult();
        return {
            isGameOver: result !== "play",
            isTie: result === "tie",
            winnerPlayer: result === "winx" ? "x" : "o",
            currentPlayer: state.turn
        };
    },
    serialize(state : BoardState) : string {
        return Serializer.serialize(state);
    },
    transitions(state : BoardState) : Transition[] {
        return Transitions.getTransitionsOf(state);
    }
});

const activeObject = {
    getWinningCategory(stateStr) {
        return minmax.getWinningCategoryOf(Serializer.unserialize(stateStr));
    }
};



declare global {
    // This is a little hack to allow typed postMessage and onmessage in workers without using the webworker typings
    interface Window {
        postMessage(data: any): void;
        addEventListener(type: "message", listener: (ev: any) => any): void;
    }
}


function postResponse(request, kind, value) {
    self.postMessage({ id: request.id, kind, value });
}

self.addEventListener("message", evt => {
    const request = evt.data;
    if (request.kind === "call") {
        try {
            const result = activeObject[request.name](...request.args);
            postResponse(request, "resolve", result);
        } catch (e) {
            // Can't post error object but a pojo, as errors are not cloneable by the "structured clone" algorithm.
            postResponse(request, "reject", {name: "AiWorkerError", message: "" + e});
        }
    }
});