import {WinningCategory} from "./game-contract";

export type EdgeToState<TState, TTransition, TPlayer> = {
    transition: TTransition,
    nextState: TState,
    category: WinningCategory<TState, TPlayer>
};
