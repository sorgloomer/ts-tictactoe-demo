
import { WinningCategory, GameGraph, StateInspection } from "./game-contract";
import {MoveSelector, RandomMoveSelector} from "./minmax-strategies";
import {EdgeToState} from "./minmax-common";


const ENDLESS : WinningCategory<any, any> = new WinningCategory<any, any>("endless");

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
        public _stepSelector : MoveSelector<TState, TPlayer, TTransition> =
            new RandomMoveSelector<TState, TPlayer, TTransition>()
    ) {
    }

    getNodeData(state : TState) : NodeData<TState, TPlayer, TTransition> {
        const key = this.graph.serialize(state);
        const data = this.states.get(key);
        if (data) {
            return data;
        }
        const newData = new NodeData<TState, TPlayer, TTransition>(state);
        this.states.set(key, newData);
        return newData;
    }

    _processFinishedState(inspection: StateInspection<TPlayer>) : WinningCategory<TPlayer, TTransition> {
        if (inspection.isTie) {
            return new WinningCategory<TPlayer, TTransition>("tie");
        } else {
            return new WinningCategory<TPlayer, TTransition>("winning", inspection.winnerPlayer);
        }
    }

    _calculateNextEdges(state: TState) : EdgeToState<TState, TPlayer, TTransition>[] {
        const transitions : TTransition[] = this.graph.transitions(state);
        return transitions.map(transition => {
            const nextState = this.graph.apply(state, transition);
            const category = this.getWinningCategoryOf(nextState);
            return { transition, nextState, category };
        });
    }

    _processNonFinishedState(state: TState, inspection: StateInspection<TPlayer>) : WinningCategory<TPlayer, TTransition> {
        const edges = this._calculateNextEdges(state);
        if (inspection.currentPlayer === undefined) {
            throw new Error("Internal error: current player is not present in _processNonFinishedState");
        }
        const edge = this._stepSelector.selectMove(edges, inspection.currentPlayer);
        return extendCategory<TPlayer, TTransition>(edge.category, edge.transition);
    }

    _processWinningCategoryOf(
        state: TState,
        nodeData: NodeData<TState, TPlayer, TTransition>
    ) : WinningCategory<TPlayer, TTransition> {
        const inspection = this.graph.inspect(state);
        if (inspection.isGameOver) {
            return this._processFinishedState(inspection);
        } else {
            return this._processNonFinishedState(state, inspection);
        }
    }

    _processAndStoreWinningCategoryOf(
        state: TState,
        nodeData: NodeData<TState, TPlayer, TTransition>
    ) {
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