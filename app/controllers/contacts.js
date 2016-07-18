'use strict';
angular.module('civimobile').controller('ContactsController', ['$state', '$stateParams', 'ApiService', 'ngDialog', function ($state, $stateParams, ApiService, ngDialog) {
    this.contacts = [];
    this.query = '';
    this.loading = 0; // Number of ongoing 'searches', 0 => loaded
    this.geoHeader = '';

    // Lets us refer to 'this' in promises.
    var x = this;

    this.back = function () {
        if (this.geoHeader) {
            this.search();
            this.geoHeader = '';
        } else {
            $state.go('home');
        }
    }

    this.search = function () {

        var emailRegex = /^\S+@\S+$/;
        var phoneRegex = /[0-9]{5,15}/;

        var q = this.query;
        var searchField;
        if (emailRegex.test(this.query)) {
            searchField = 'email';
        } else if (this.query.replace(/\d/g,'').length < 4 && phoneRegex.test(this.query.replace(/\D/g,''))) {
            searchField = 'phone';
            // Remove inital zero if there is one and replace special chars with a wildcard to match as many
            // different phone number formats as possible.
            q = {
                LIKE: '%' + this.query.replace(/^[0]/, '').replace(/[ #+.-]{1,}/g, '%') + '%'
            };
        } else {
            searchField = 'display_name';
        }

        this.loading += 1;
        this.contacts = [];
        ApiService.contactSearch(q, searchField).then(function (data) {
            if (x.loading > 0) {    // Necessary as geolocation may set loading to 0 directly.
                x.loading -= 1;
            }
            if (x.loading == 0) {
                x.contacts = data;
            }
        });
    }
    this.search();

    this.geoSearch = function () {
        ngDialog.open({ template: 'mobile/partials/dialogs/contact_geo_search', data: { distance: 50, unit: 'miles' } })
        .closePromise.then(function (data) {
            var value = data.value;
            if (!value.postcode && !value.distance && !value.unit) {
                return; // If a user just clicks away without providing any detail
            }
            else if (!value.postcode && (!value.distance || !value.unit)) {
                ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'Please provide valid location information' });
            } else {
                x.loading += 1;
                x.contacts = [];
                if (value.postcode) {
                    x.geoHeader = 'Contacts in ' + value.postcode;
                    ApiService.getContactsIn(value.postcode).then(function (data) {
                        x.loading = 0;  // If we're doing a geolocation search, we are overriding any other pending searches.
                        x.contacts = data;
                    });
                } else {
                    if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(success, error, { maximumAge: 600000 });
                    } else {
                        return error();
                    }
                    x.geoHeader = 'Contacts within ' + value.distance + ' ' + value.unit;
                    function success(location) {
                        ApiService.getContactsNearby(location.coords, value.distance, value.unit).then(function (data) {
                            x.loading = 0;  // If we're doing a geolocation search, we are overriding any other pending searches.
                            x.contacts = data;
                        });
                    }
                    function error() {
                        ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'Geolocation data not available' });
                        x.geoHeader = '';
                        x.loading -= 1;
                        x.search();
                    }
                }
            }
        });
    }
}]);
