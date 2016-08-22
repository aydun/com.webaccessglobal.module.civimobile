'use strict';
angular.module('civimobile').controller('ContributionController', ['$state', '$stateParams', 'ApiService', 'ngDialog', '$previousState', function ($state, $stateParams, ApiService, ngDialog, $previousState) {
    this.contribution = {};
    var fieldsToDisplay = ['financial_type_id', 'total_amount', 'currency', 'source', 'contribution_status_id'];
    this.fields = [];
    this.name = '';

    var x = this; // Allows us to refer to 'this' in promises.

    if ($stateParams.id) {
        // Edit contribution
        ApiService.getContribution($stateParams.id).then(function (c) {
            c.total_amount = parseInt(c.total_amount);
            x.contribution = c;
            x.name = c.display_name;
        });
    }
    else {
        // New contribution
        $stateParams.type = $stateParams.type || '1';
        $stateParams.amount = $stateParams.amount || '10.00';
        $stateParams.currency = $stateParams.currency || '000';
        $stateParams.status = $stateParams.status || '1';
        this.contribution = {
            contact_id: $stateParams.id,
            financial_type_id: $stateParams.type,
            total_amount: parseFloat($stateParams.amount),
            currency: $stateParams.currency,
            contribution_status_id: $stateParams.status,
            source: $stateParams.source,
            contact_id: $stateParams.cId
        };
        this.name = $stateParams.name;
    }

    ApiService.getContributionFields().then(function (fields) {
        var j = 0;
        for (var i = 0; i < fields.length; i++) {
            if (fieldsToDisplay.indexOf(fields[i].name) > -1) {
                if (fields[i].name == 'total_amount') {
                    fields[i].html.type = 'Currency';
                }
                if (fields[i].name == 'contribution_status_id') {
                    fields[i].title = 'Contribution Status';
                }
                x.fields.push(fields[i]);
                if (fields[i].html.type == 'Select') {
                    getOptions(j);
                }
                j++;
            }
        }
    });

    function getOptions(j) {
        ApiService.getContributionFieldOptions(x.fields[j].name).then(function (os) {
            if (x.fields[j].name == 'currency') {
                os.unshift({ key: '000', value: 'Default' });
            }
            x.fields[j].options = os;
        });
    }

    this.save = function () {
        var r = ApiService.saveContribution(angular.copy(x.contribution));
        if ($stateParams.mId && x.contribution.financial_type_id == 2) {
            r = r.then(function (data) {
                return ApiService.saveMembershipPayment($stateParams.mId, data.id);
            });
        }
        r.then(function (result) {
            if (result.id || result[0].id) {
                // Success
                if ($previousState.get()) {
                    $previousState.go().then(notify);
                } else {
                    $state.go('home').then(notify);
                }
                function notify() {
                    ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'Contribution saved' });
                }
            } else {
                ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'An error occured' });
            }
        });
    }

    this.back = function () {
        if ($previousState.get()) {
            $previousState.go().then(notify);
        } else {
            $state.go('home').then(notify);
        }
        function notify() {
            ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'Contribution not saved' });
        }
    }
}]);
