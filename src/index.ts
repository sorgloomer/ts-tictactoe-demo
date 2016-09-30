
import "./mvw/app";
import "./mvw/controllers";


function formatState(state) {
    return `Turn: $(state.turn)\n` + state.board.map(r => r.map(c => c || ".").join(" ")).join("\n");
}


