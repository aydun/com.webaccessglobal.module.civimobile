'use strict';
angular.module('civimobile').controller('MembershipsController', ['ApiService', function (ApiService) {
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
}]);
