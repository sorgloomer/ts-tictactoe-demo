// I dont require typings for angular, so just declare the namespace
declare const angular;

export const app = angular.module("App", ["ngRoute"]);

app.config([
 "$routeProvider",
  function($routeProvider) {
    $routeProvider.
    when("/game", {
      templateUrl: "view/game.html",
      controller: "TableController"
    }).
    when("/menu", {
      template: "view/menu.html",
      controller: ""
    }).
    otherwise("/menu");
  }
]);
