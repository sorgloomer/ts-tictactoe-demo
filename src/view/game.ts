import {app} from "./app";
import {BoardState, Turn} from "../model/board-state";
import {GameController, PlayerType} from "../model/game-controller";
import {LocalStorageGameStore} from "../model/game-store";

const ALL_COORDS = [
    [0,0], [1,0], [2,0],
    [0,1], [1,1], [2,1],
    [0,2], [1,2], [2,2]
];

const FIRST_PLAYER : Turn = "x";

// TODO: use ng-annotate
app.controller("GameController",
    function($scope, $routeParams, $location) {

        const model : GameController = determineModel();

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

        $scope.getCellValue = ([coordx, coordy]) => model.boardState.board[coordy][coordx];

        $scope.isAiRound = false;
        $scope.$watch(
            () => model.isCpuTurn(),
            newValue => { $scope.isAiRound = newValue; }
        );

        $scope.gameResult = "play";
        $scope.$watch(
            () => model.boardState.getResult(),
            newValue => { $scope.gameResult = newValue; }
        );

        $scope.putSign = ([coordx, coordy]) => {
            model.putPlayerSign(coordx, coordy);
        };

        $scope.doUndo = () => {
            model.undoPlayerMove();
        };

        $scope.doReset = () => {
            model.reset("x");
        };
        $scope.isTurnOf = (player : Turn) => {
            return model.boardState.getResult() === "play" && model.boardState.turn == player;
        };

        $scope.getPlayerType = (player : Turn) : PlayerType => {
            return model.getPlayerType(player);
        };

        // Don't start new game on refresh
        $location.search("mode", undefined);

        function determineModel() : GameController {
            switch ($routeParams.mode) {
                case "pvp":
                    return createModel("player", "player");
                case "pvc":
                    return createModel("player", "cpu");
                case "cvp":
                    return createModel("cpu", "player");
                case "cvc":
                    return createModel("cpu", "cpu");
                case "continue":
                default:
                    return LocalStorageGameStore.loadGame();
            }
            function createModel(playerx : PlayerType, playero : PlayerType) : GameController {
                return new GameController(playero, playerx, BoardState.initial(FIRST_PLAYER), []);
            }
        }
    }
);


const SignImgs = {
    "o": "img/sign-o.svg",
    "x": "img/sign-x.svg"
};

app.directive("ttSign", function() {
    return {
        restrict: "A",
        link(scope, elem, attrs) {
            scope.$watch(attrs.ttSign, function(newValue) {
                if (newValue) {
                    elem.attr("src", SignImgs[newValue]);
                }
                elem.toggleClass("filled", !!newValue);
            });
        }
    };
});