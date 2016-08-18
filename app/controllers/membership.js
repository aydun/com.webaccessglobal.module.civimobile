'use strict';
angular.module('civimobile').controller('MembershipController', ['$state', '$stateParams', 'ApiService', function ($state, $stateParams, ApiService) {
    this.id = $stateParams.id; // Membership id if editing, contact id if creating.
    this.membership = {};
    this.name = '';
    this.statusOptions = [];

    // So we can refer to 'this' in promises.
    var x = this;

    if ($state.includes('memberships.detail')) {
        // Editing a membership
        ApiService.getMembership(this.id).then(function (value) {
            x.statusOptions = value.statusOptions;
            delete value.statusOptions;
            for (var i = 0; i < x.statusOptions.length; i++) {
                if (value.status_id == x.statusOptions[i].key) {
                    value.status = x.statusOptions[i];
                }
            }
            if (value.end_date) { value.join_date = new Date(value.join_date); }
            if (value.end_date) { value.start_date = new Date(value.start_date); }
            if (value.end_date) { value.end_date = new Date(value.end_date); }
            x.membership = value;
        });
    } else {
        // New membership
        this.membership.contact_id = this.id;
        var now = new Date(); var then = new Date();
        this.membership.join_date = now;
        this.membership.start_date = now;
        then.setFullYear(then.getFullYear() + 1)
        this.membership.end_date = then;
        ApiService.getMembershipTypes().then(function (values) {
            // This request will have been cached so limited cost.
            x.membership.membership_type_id = values[0].id;
        });
        ApiService.getMembershipStatusOptions().then(function (values) {
            x.statusOptions = values;
            x.membership.status = values[0];
        });
        this.name = $stateParams.name;
    }

    this.save = function () {
        var m = angular.copy(this.membership);
        if (m.membership_name == 'Lifetime') {
            m.end_date = '';
        }
        m.status_id = m.status.key;
        delete m.status;
        delete m.statusOptions;
        ApiService.saveMembership(m).then(function (data) {
            $state.go('memberships.detail.view', { id: data[0].id }, { reload: true });
        });
    }
}]);
