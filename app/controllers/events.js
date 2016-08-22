'use strict';
angular.module('civimobile').controller('EventsController', ['$scope', '$state', 'ApiService', function ($scope, $state, ApiService) {
    this.events = [];
    this.query = '';
    this.loading = 0; // Number of ongoing 'searches', 0 => loaded
    this.search = function () {
        // FIXME
        //if (this.query.length > 1) {

            this.loading += 1;
            // Lets us refer to 'this' in promises.
            var x = this;
            ApiService.eventSearch(this.query).then(function (data) {
                x.events = data;
                x.loading -= 1;
            });

        //}
    }
    this.search();
}]);
