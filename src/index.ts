import { State } from "./model/state";
import { TicTacToeAI } from "./worker/ai";



function formatState(state) {
    return `Turn: $(state.turn)\n` + state.board.map(r => r.map(c => c || ".").join(" ")).join("\n");
}


window.addEventListener("load", () => {
    let state = State.initial("x");
    const ai = new TicTacToeAI();

    schedule();

    function schedule() {
        setTimeout(stepByAi, 10);
    }
    function stepByAi() {
        console.log(formatState(state));
        ai.getWinningCategory(state).then(res => {

            console.log(res);
            if (res.transition) {
                state = state.step(...res.transition);
                schedule();
            }
        }, reas => {
            console.error(reas);
        });
    }
});