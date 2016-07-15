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

        // var posRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
        var emailRegex = /^\S+@\S+$/
        var phoneRegex = /[0-9]{5,15}/

        var searchField;
        /*if (posRegex.test(this.query)) {
            console.log('position');
        } else*/ if (emailRegex.test(this.query)) {
            console.log('email');
            searchField = 'email';
        } else if (this.query.replace(/\d/g,'').length < 4 && phoneRegex.test(this.query.replace(/\D/g,''))) {
            console.log('phone number');
            searchField = 'phone';
        } else {
            console.log('name');
            searchField = 'sort_name';
        }

        this.loading += 1;
        this.contacts = [];
        ApiService.contactSearch(this.query, searchField).then(function (data) {
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
