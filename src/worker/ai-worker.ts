import { MinMax } from "../algorithm/minmax";
import { StateInspection } from "../algorithm/game-contract";

import {State, Turn, Transition, Serializer, Transitions} from "../model/state";

const minmax = new MinMax<State, Transition, Turn>({
  apply(state: State, transition: Transition) : State {
    return state.step(transition[0], transition[1]);
  },
  inspect(state : State) : StateInspection {
    const result = state.getResult();
    return {
      isGameOver: result !== "play",
      isTie: result === "tie",
      winnerPlayer: result === "winx" ? "x" : "o",
      currentPlayer: state.turn
    };
  },
  serialize(state : State) : string {
    return Serializer.serialize(state);
  },
  transitions(state : State) : Transition[] {
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