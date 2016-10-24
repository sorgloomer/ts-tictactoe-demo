import { int } from "../utils/types";

export interface StateInspection<TPlayer> {
    isGameOver: boolean;
    isTie: boolean;
    winnerPlayer? : TPlayer;
    currentPlayer? : TPlayer;
}

export interface GameGraph<TState, TTransition, TPlayer> {
    transitions(state : TState) : TTransition[];
    inspect(state : TState) : StateInspection<TPlayer>;
    apply(state : TState, transition : TTransition) : TState;
    serialize(state : TState) : string;
}

type WinningCategoryKind = "tie" | "endless" | "winning";

export interface WinningCategoryData<TPlayer, TTransition> {
    kind: WinningCategoryKind;
    player: TPlayer | null;
    distance: int;
    transition: TTransition | null;
}

export class WinningCategory<TPlayer, TTransition> implements WinningCategoryData<TPlayer, TTransition> {
    constructor(
        public kind: WinningCategoryKind,
        public player: TPlayer | null = null,
        public distance: int = 0,
        public transition: TTransition | null = null
    ) {}

    doesWin(player: TPlayer) {
        return this.kind === "winning" && this.player === player;
    }
}
