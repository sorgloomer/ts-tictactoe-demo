import {EdgeToState} from "./minmax-common";
import * as utils from "../utils/arrays";

export interface MoveSelector<TPlayer, TTransition> {
    selectMove(edges: EdgeToState[], currentPlayer : TPlayer);
}

export abstract class MoveSelectorBase<TPlayer, TTransition> implements MoveSelector<TPlayer, TTransition> {
    abstract selectWinningMove(edges: EdgeToState[], currentPlayer: TPlayer) : EdgeToState | null;
    abstract selectTieMove(edges: EdgeToState[]) : EdgeToState | null;
    abstract selectLosingMove(edges: EdgeToState[]) : EdgeToState | null;

    getWinningMoves(edges: EdgeToState[], currentPlayer: TPlayer) : EdgeToState[] {
        return edges.filter(d => d.category.doesWin(currentPlayer));
    }
    getTieMoves(edges: EdgeToState[]) : EdgeToState[] {
        return edges.filter(d => d.category.kind === "tie");
    }

    selectMove(edges: EdgeToState[], currentPlayer : TPlayer) {
        let edge: EdgeToState = this.selectWinningMove(edges, currentPlayer);
        edge = edge || this.selectTieMove(edges);
        return edge || this.selectLosingMove(edges);
    }
}

export class RandomMoveSelector<TPlayer, TTransition>
extends MoveSelectorBase<TPlayer, TTransition>
implements MoveSelector<TPlayer, TTransition> {
    selectWinningMove(edges: EdgeToState[], currentPlayer: TPlayer) : EdgeToState | null {
        const possibilities = this.getWinningMoves(edges, currentPlayer);
        return utils.getRandomItem(possibilities);
    }

    selectTieMove(edges: EdgeToState[]) : EdgeToState | null {
        const possibilities = this.getTieMoves(edges);
        return utils.getRandomItem(possibilities);
    }

    selectLosingMove(edges: EdgeToState[]) : EdgeToState | null {
        return utils.getRandomItem(edges);
    }
}

export class SpeculatingMoveSelector<TPlayer, TTransition>
extends MoveSelectorBase<TPlayer, TTransition>
implements MoveSelector<TPlayer, TTransition> {
    selectWinningMove(edges: EdgeToState[], currentPlayer: TPlayer) : EdgeToState | null {
        const possibilities = this.getWinningMoves(edges, currentPlayer);
        return utils.minBy(possibilities, categoryDistanceOf, null);
    }

    selectTieMove(edges: EdgeToState[]) : EdgeToState | null {
        const possibilities = this.getTieMoves(edges);
        return utils.maxBy(possibilities, categoryDistanceOf, null);
    }

    selectLosingMove(edges: EdgeToState[]) : EdgeToState | null {
        return utils.maxBy(edges, categoryDistanceOf, null);
    }
}

function categoryDistanceOf(edge: EdgeToState) : number {
    return edge.category.distance;
}
