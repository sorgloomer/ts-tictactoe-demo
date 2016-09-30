
import "./view/app";
import "./view/game";


function formatState(state) {
    return `Turn: $(state.turn)\n` + state.board.map(r => r.map(c => c || ".").join(" ")).join("\n");
}


