'use strict';
angular.module('civimobile').controller('HomeController', ['$window', function ($window) {
    this.logout = function () { $window.location.href = 'mobile/logout' }
}]);
