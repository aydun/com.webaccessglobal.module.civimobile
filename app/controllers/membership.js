'use strict';
angular.module('civimobile').controller('MembershipController', ['$state', '$stateParams', 'ApiService', function ($state, $stateParams, ApiService) {
    this.id = $stateParams.id;
    this.membership = {};

    // So we can refer to 'this' in promises.
    var x = this;

    ApiService.getMembership(this.id).then(function (value) {
        for (var i = 0; i < value.statusOptions.length; i++) {
            if (value.status_id == value.statusOptions[i].key) {
                value.status = value.statusOptions[i];
            }
        }
        x.membership = value;
    })
}]);
