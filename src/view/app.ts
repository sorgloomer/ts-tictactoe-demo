// I dont require typings for angular, so just declare the namespace
declare const angular;

export const app = angular.module("App", ["ngRoute"]);

app.config([
    "$routeProvider",
    function($routeProvider) {
        $routeProvider.
        when("/game", {
            templateUrl: "view/game.html",
            controller: "GameController",
            reloadOnSearch: false
        }).
        when("/menu", {
            templateUrl: "view/menu.html",
            controller: "MenuController",
            reloadOnSearch: false
        }).
        otherwise("/menu");
    }
]);
