import {app} from "./app";
import {BoardState, ALL_COORDS} from "../model/board-state";
import {TicTacToeAI} from "../worker/ai";
import {GameController} from "../model/game-controller";

class StateWithHistory {
    constructor(
        public game : BoardState,
        public prev : StateWithHistory | null = null
    ) {
    }
}

const SignImgs = {
    "": "img/empty.svg",
    "o": "img/sign-o.svg",
    "x": "img/sign-x.svg"
};

// TODO: wire ng-annotate
app.controller("TableController", [
    "$scope", "$timeout", "AiService",
    function($scope, $timeout, AiService) {

        const model = new GameController(
            "cpu", "cpu",
            BoardState.initial("x"),
            []
        );

        model.addEventListener("afterCpuRound", () => {
            $scope.$apply();
        });
        model.addEventListener("error", e => {
            console.error(e);
            alert("Sorry, the game ran into an error.");
        });

        $scope.allCoords = ALL_COORDS;

        $scope.signImgs = SignImgs;

        $scope.state = null;

        $scope.getCellValue = coord => model.boardState.board[coord[0]][coord[1]];

        $scope.isAiRound = () => {
            return $scope.model.isCpuTurn();
        };


        $scope.putSign = coord => {
            model.putPlayerSign(coord[0], coord[1]);
        };

        $scope.doUndo = () => {
            model.undoPlayerStep();
        };

        $scope.doReset = () => {
            model.reset();
        };
    }
]);


app.factory("AiService", [
    "$q", function($q) {
        const service = new TicTacToeAI();
        return {
            getWinningCategory(state) {
                return $q.when(service.getWinningCategory(state));
            }
        };
    }
]);


