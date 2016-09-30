import {app} from "./app";
import {State, ALL_COORDS} from "../model/state";
import {TicTacToeAI} from "../worker/ai";

class StateWithHistory {
    constructor(
        public game : State,
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
        $scope.allCoords = ALL_COORDS;

        $scope.signImgs = SignImgs;

        $scope.state = null;

        $scope.getCellValue = coord => $scope.state.game.board[coord[0]][coord[1]];

        $scope.isAiRound = () => {
            return $scope.state.game.turn == "o";
        };

        function setState(state) {
            $scope.state = state;
            if ($scope.isAiRound()) {
                scheduleAi();
            }
        }

        $scope.putSign = coord => {
            setState(new StateWithHistory(
                $scope.state.game.step(coord[1], coord[0]),
                $scope.state
            ));
        };
        function putAi(coord) {
            setState(new StateWithHistory(
                $scope.state.game.step(coord[1], coord[0]),
                $scope.state.prev // skip ai steps in history
            ));
        };

        $scope.doUndo = () => {
            if ($scope.state.prev) {
                setState($scope.state.prev);
            }
        };

        $scope.doReset = () => {
            reset();
        };

        reset();

        function reset() {
            $scope.state = new StateWithHistory(State.initial("x"));
        }

        function stepAi(lastState) {
            AiService.getWinningCategory(lastState.game).then(cat => {
                if ($scope.state === lastState) {
                    putAi(cat.transition);
                }
            });
        }

        function scheduleAi() {
            const currentState = $scope.state;
            $timeout(() => {
                stepAi(currentState);
            }, 500 + 1500 * Math.random());
        }
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


