
import "./view/app";
import "./view/game";


class A {}


let x : number = 4;
x = null;

console.log(x);

function formatState(state) {
    return `Turn: $(state.turn)\n` + state.board.map(r => r.map(c => c || ".").join(" ")).join("\n");
}


