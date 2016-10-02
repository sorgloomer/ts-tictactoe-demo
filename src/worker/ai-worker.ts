import { MinMax } from "../algorithm/minmax";
import { StateInspection } from "../algorithm/game-contract";

import {BoardState, Turn, Transition, Serializer, Transitions} from "../model/board-state";

const minmax = new MinMax<BoardState, Transition, Turn>({
  apply(state: BoardState, [coordx, coordy]: Transition) : BoardState {
    return state.moveTo(coordx, coordy);
  },
  inspect(state : BoardState) : StateInspection {
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

function postResponse(request, kind, value) {
  self.postMessage({ id: request.id, kind, value });
}

self.onmessage = evt => {
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
};