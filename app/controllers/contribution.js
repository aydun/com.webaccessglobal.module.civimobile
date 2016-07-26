'use strict';
angular.module('civimobile').controller('ContributionController', ['$state', '$stateParams', 'ApiService', 'ngDialog', '$previousState', function ($state, $stateParams, ApiService, ngDialog, $previousState) {
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
        source: $stateParams.source
    };
    var fieldsToDisplay = ['financial_type_id', 'total_amount', 'currency', 'source', 'contribution_status_id'];
    this.fields = [];

    var x = this; // Allows us to refer to 'this' in promises.

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
                os = angular.extend({ '000': 'Default' }, os); // Add a label for 'default' currency.
            }
            x.fields[j].options = os;
        });
    }

    this.save = function () {
        ApiService.saveContribution(x.contribution).then(function (data) {
            if (data.id) {
                // Success
                if ($previousState.get()) {
                    $previousState.go().then(notify);
                } else {
                    $state.go('home').then(notify);
                }
                function notify() {
                    ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'Contribution recorded' });
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
            $state.go('^.view').then(notify);
        }
        function notify() {
            ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'Contribution not recorded' });
        }
    }
}]);
