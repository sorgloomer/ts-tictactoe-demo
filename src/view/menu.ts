import {app} from "./app";
import {BoardState} from "../model/board-state";
import {TicTacToeAI} from "../worker/ai";
import {GameController} from "../model/game-controller";
import {LocalStorageGameStore} from "../model/game-store";

// TODO: use ng-annotate
app.controller("MenuController",
    function($scope) {
        $scope.canContinue = LocalStorageGameStore.hasSavedGame();
    }
);
