import {app} from "./app";
import {BoardState, Turn} from "../model/board-state";
import {GameController, PlayerType} from "../model/game-controller";
import {LocalStorageGameStore} from "../model/game-store";

const SignImgs = {
    "": "img/empty.svg",
    "o": "img/sign-o.svg",
    "x": "img/sign-x.svg"
};

const ALL_COORDS = [
    [0,0], [1,0], [2,0],
    [0,1], [1,1], [2,1],
    [0,2], [1,2], [2,2]
];


const FIRST_PLAYER : Turn = "x";
// TODO: wire ng-annotate
app.controller("GameController",
    function($scope, $routeParams) {

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

        $scope.getCellValue = coord => model.boardState.board[coord[1]][coord[0]];

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

        $scope.putSign = coord => {
            model.putPlayerSign(coord[0], coord[1]);
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
