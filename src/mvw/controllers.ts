import {app} from "./app";
import {State, ALL_COORDS} from "../model/state";

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
    "$scope",
    function($scope) {
        $scope.allCoords = ALL_COORDS;

        $scope.signImgs = SignImgs;

        $scope.state = null;

        $scope.getCellValue = coord => $scope.state.game.board[coord[0]][coord[1]];

        $scope.putSign = coord => {
            $scope.state = new StateWithHistory(
                $scope.state.game.step(coord[1], coord[0]),
                $scope.state
            );
        };

        $scope.doUndo = () => {
            if ($scope.state.prev) {
                $scope.state = $scope.state.prev;
            }
        };

        $scope.doReset = () => {
            reset();
        };

        reset();

        function reset() {
            $scope.state = new StateWithHistory(State.initial("x"));
        }
    }
]);
