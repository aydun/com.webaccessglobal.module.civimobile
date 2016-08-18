'use strict';
angular.module('civimobile').controller('MembershipsController', ['$state', 'ApiService', 'ngDialog', '$previousState', function ($state, ApiService, ngDialog, $previousState) {
    this.types = [];
    this.members = [];
    this.selectedId = -1;
    this.loadingMembers = true;
    this.query = '';

    // To refer to 'this' in promises.
    var x = this;

    ApiService.getMembershipTypes().then(function (types) {
        x.types = types;
    });

    // For use with ng-class.
    this.selected = function (id) {
        return id == this.selectedId ? 'selected' : 'not-selected';
    }

    this.show = function (id) {
        this.selectedId = id;
    }

    this.search = function (id) {
        ApiService.getMemberships(this.query).then(function (ms) {
            x.show(-1); // Show all so no result is hidden.
            x.members = ms;
            x.loadingMembers = false;
        });
    }
    this.search();

    this.new = function () {
        ngDialog.open({ template: 'mobile/partials/dialogs/new_membership' })
        .closePromise.then(function (data) {
            var code = data.value;
            if (code == 1) { // Use existing contact.
                ngDialog.open({
                    template: 'mobile/partials/dialogs/new_participant',
                    controller: 'ContactsController',
                    controllerAs: 'contacts',
                    appendClassName: 'ngdialog-list'})
                .closePromise.then(function (data) {
                    var c = data.value;
                    if (c.id) {
                        for (var i = 0; i < x.members.length; i++) {
                            if (x.members[i].contact_id == c.id) {
                                ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'This contact is already a member.' });
                                return;
                            }
                        }
                        $state.go('^.new', { id: c.id });
                    }
                });
            }
            if (code == 2) { // Create new contact.
                $previousState.set('next', 'memberships.new');
                ngDialog.open({ template: 'mobile/partials/dialogs/new_contact' });
            }
        });
    }
}]);
