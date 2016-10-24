import {EdgeToState} from "./minmax-common";
import * as utils from "../utils/arrays";

export interface MoveSelector<TState, TPlayer, TTransition> {
    selectMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[],
        currentPlayer : TPlayer
    ): EdgeToState<TState, TPlayer, TTransition>;
}

export abstract class MoveSelectorBase<TState, TPlayer, TTransition>
implements MoveSelector<TState, TPlayer, TTransition> {
    abstract selectWinningMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[],
        currentPlayer: TPlayer
    ) : EdgeToState<TState, TPlayer, TTransition> | null;
    abstract selectTieMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[]
    ) : EdgeToState<TState, TPlayer, TTransition> | null;
    abstract selectLosingMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[]
    ) : EdgeToState<TState, TPlayer, TTransition> | null;

    getWinningMoves(
        edges: EdgeToState<TState, TPlayer, TTransition>[],
        currentPlayer: TPlayer
    ) : EdgeToState<TState, TPlayer, TTransition>[] {
        return edges.filter(d => d.category.doesWin(currentPlayer));
    }
    getTieMoves(edges: EdgeToState<TState, TPlayer, TTransition>[]) : EdgeToState<TState, TPlayer, TTransition>[] {
        return edges.filter(d => d.category.kind === "tie");
    }

    selectMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[], currentPlayer : TPlayer
    ) : EdgeToState<TState, TPlayer, TTransition> {
        let edge: EdgeToState<TState, TPlayer, TTransition> | null = this.selectWinningMove(edges, currentPlayer);
        edge = edge || this.selectTieMove(edges);
        edge = edge || this.selectLosingMove(edges);
        if (edge !== null) {
            return edge;
        } else {
            throw new Error("Strategy didn't find a move");
        }
    }
}

export class RandomMoveSelector<TState, TPlayer, TTransition>
extends MoveSelectorBase<TState, TPlayer, TTransition>
implements MoveSelector<TState, TPlayer, TTransition> {
    selectWinningMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[],
        currentPlayer: TPlayer
    ) : EdgeToState<TState, TPlayer, TTransition> | null {
        const possibilities = this.getWinningMoves(edges, currentPlayer);
        return utils.getRandomItem(possibilities, null);
    }

    selectTieMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[]
    ) : EdgeToState<TState, TPlayer, TTransition> | null {
        const possibilities = this.getTieMoves(edges);
        return utils.getRandomItem(possibilities, null);
    }

    selectLosingMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[]
    ) : EdgeToState<TState, TPlayer, TTransition> | null {
        return utils.getRandomItem(edges, null);
    }
}

export class SpeculatingMoveSelector<TState, TPlayer, TTransition>
extends MoveSelectorBase<TState, TPlayer, TTransition>
implements MoveSelector<TState, TPlayer, TTransition> {
    selectWinningMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[],
        currentPlayer: TPlayer
    ) : EdgeToState<TState, TPlayer, TTransition> | null {
        const possibilities = this.getWinningMoves(edges, currentPlayer);
        return utils.minBy<EdgeToState<TState, TPlayer, TTransition> | null>(possibilities, categoryDistanceOf, null);
    }

    selectTieMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[]
    ) : EdgeToState<TState, TPlayer, TTransition> | null {
        const possibilities = this.getTieMoves(edges);
        return utils.maxBy<EdgeToState<TState, TPlayer, TTransition> | null>(possibilities, categoryDistanceOf, null);
    }

    selectLosingMove(
        edges: EdgeToState<TState, TPlayer, TTransition>[]
    ) : EdgeToState<TState, TPlayer, TTransition> | null {
        return utils.maxBy<EdgeToState<TState, TPlayer, TTransition> | null>(edges, categoryDistanceOf, null);
    }
}

function categoryDistanceOf<TState, TPlayer, TTransition>(
    edge: EdgeToState<TState, TPlayer, TTransition>
) : number {
    return edge.category.distance;
}
