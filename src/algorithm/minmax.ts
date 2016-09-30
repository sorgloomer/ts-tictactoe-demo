
import * as utils from "../utils/arrays";
import { WinningCategory, GameGraph, StateInspection } from "./game-contract";

type StepToState<TState, TTransition, TPlayer> = {
    transition: TTransition,
    nextState: TState,
    category: WinningCategory<TState, TPlayer>
};

const ENDLESS : WinningCategory = new WinningCategory("endless");

function extendCategory<TPlayer, TTransition>(
    category: WinningCategory<TPlayer, TTransition>,
    transition: TTransition
) : WinningCategory<TPlayer, TTransition> {
    return new WinningCategory(
        category.kind,
        category.player,
        category.distance + 1,
        transition
    );
}

class NodeData<TState, TPlayer, TTransition> {
    traversing: boolean = false;
    winningCategory: WinningCategory<TPlayer, TTransition> | null;
    constructor(public state: TState) {
    }
}

export class MinMax<TState, TTransition, TPlayer> {

    states : Map<string, NodeData<TState, TPlayer, TTransition>> = new Map();

    constructor(
        public graph : GameGraph<TState, TTransition, TPlayer>
    ) {
    }

    getNodeData(state : TState) : NodeData<TState> {
        const key = this.graph.serialize(state);
        const data = this.states.get(key);
        if (data) {
            return data;
        }
        const newData = new NodeData(state);
        this.states.set(key, newData);
        return newData;
    }

    _processFinishedState(inspection: StateInspection) : WinningCategory<TPlayer, TTransition> {
        if (inspection.isTie) {
            return new WinningCategory("tie");
        } else {
            return new WinningCategory("winning", inspection.winnerPlayer);
        }
    }

    _processSoonestWin(steps: StepToState[], currentPlayer: TPlayer) : StepToState | null {
        return utils.minBy(
            steps.filter(d => d.category.doesWin(currentPlayer)),
            d => d.category.distance,
            null
        );
    }

    _processLatestTie(steps: StepToState[]) : StepToState | null {
        return utils.maxBy(
            steps.filter(d => d.category.kind === "tie"),
            d => d.category.distance,
            null
        );
    }

    _calculateOutgoingSteps(state: TState) : StepToState[] {
        const transitions : TTransition[] = this.graph.transitions(state);
        return transitions.map(transition => {
            const nextState = this.graph.apply(state, transition);
            const category = this.getWinningCategoryOf(nextState);
            return { transition, nextState, category };
        });
    }

    _processNonFinishedState(state: TState, inspection: StateInspection) : WinningCategory<TPlayer, TTransition> {
        const steps: StepToState[] = this._calculateOutgoingSteps(state);
        let step: StepToState = this._processSoonestWin(steps, inspection.currentPlayer);
        // Otherwise try to postpone the tie -- other players might make a mistake
        step = step || this._processLatestTie(steps);
        // Don't check endless kind here, treat it as some other player wins.
        // Try to postpone the winning of the other players -- other players might make a mistake
        step = step || utils.maxBy(steps, d => d.category.distance);
        return extendCategory(step.category, step.transition);
    }

    _processWinningCategoryOf(state: TState, nodeData: NodeData<TState>) : WinningCategory<TPlayer, TTransition> {
        const inspection = this.graph.inspect(state);
        if (inspection.isGameOver) {
            return this._processFinishedState(inspection);
        } else {
            return this._processNonFinishedState(state, inspection);
        }
    }

    _processAndStoreWinningCategoryOf(state: TState, nodeData: NodeData<TState>) {
        nodeData.traversing = true;
        const result = this._processWinningCategoryOf(state, nodeData);
        nodeData.winningCategory = result;
        nodeData.traversing = false;
        return result;
    }

    getWinningCategoryOf(state : TState) : WinningCategory<TPlayer, TTransition> {
        const nodeData = this.getNodeData(state);
        if (nodeData.traversing) {
            return ENDLESS;
        }
        if (nodeData.winningCategory) {
            return nodeData.winningCategory;
        }
        return this._processAndStoreWinningCategoryOf(state, nodeData);
    }
}