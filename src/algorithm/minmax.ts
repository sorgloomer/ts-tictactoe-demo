
import { WinningCategory, GameGraph, StateInspection } from "./game-contract";
import {MoveSelector, RandomMoveSelector} from "./minmax-strategies";
import {EdgeToState} from "./minmax-common";


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
        public graph : GameGraph<TState, TTransition, TPlayer>,
        public _stepSelector : MoveSelector<TPlayer, TTransition> = new RandomMoveSelector()
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

    _calculateNextEdges(state: TState) : EdgeToState[] {
        const transitions : TTransition[] = this.graph.transitions(state);
        return transitions.map(transition => {
            const nextState = this.graph.apply(state, transition);
            const category = this.getWinningCategoryOf(nextState);
            return { transition, nextState, category };
        });
    }

    _processNonFinishedState(state: TState, inspection: StateInspection) : WinningCategory<TPlayer, TTransition> {
        const edges: EdgeToState[] = this._calculateNextEdges(state);
        const edge: EdgeToState = this._stepSelector.selectMove(edges, inspection.currentPlayer);
        return extendCategory(edge.category, edge.transition);
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