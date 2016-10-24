import {WinningCategory} from "./game-contract";

export type EdgeToState<TState, TPlayer, TTransition> = {
    transition: TTransition,
    nextState: TState,
    category: WinningCategory<TPlayer, TTransition>
};
