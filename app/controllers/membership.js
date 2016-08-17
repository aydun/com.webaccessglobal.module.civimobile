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
        value.join_date = new Date(value.join_date);
        value.start_date = new Date(value.start_date);
        if (value.end_date) { value.end_date = new Date(value.end_date); }
        x.membership = value;
    });

    this.save = function () {
        var m = angular.copy(this.membership);
        // If 'lifetime'
        if (m.membership_type_id == 3) {
            m.end_date = '';
        }
        m.status_id = m.status.key;
        delete m.status;
        delete m.statusOptions;
        ApiService.saveMembership(m).then(function (data) {
            $state.go('^.view', null, { reload: true });
        });
    }
}]);
