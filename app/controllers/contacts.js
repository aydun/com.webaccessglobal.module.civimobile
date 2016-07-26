'use strict';
angular.module('civimobile').controller('ContactsController', ['$state', 'ApiService', 'ngDialog', function ($state, ApiService, ngDialog) {
    this.contacts = [];
    this.query = ''; // The search string.
    var q = ''; // The search query parameter sent to the API.
    this.loading = 0; // Number of ongoing 'searches', 0 => loaded
    this.geoHeader = '';
    this.searchFields = ['name', 'email', 'phone'];
    this.searchField = this.searchFields[0];
    var f = '' // The search field parameter sent to the API.
    var manual = false; // Whether the user has overriden the automatic search field detection (name, email, phone).
    var offset = 0; // We load results in chunks of 30.
    var loadedAll = false; // Are there any more results to load?
    this.loadingMore = false; // Are we loading further results?

    // Lets us refer to 'this' in promises.
    var x = this;

    this.back = function () {   // We use an ng-show and ng-hide to display the geo header if relevant,
        if (this.geoHeader) {   // else the standard header.
            this.search();
            this.geoHeader = '';
        } else {
            $state.go('home');
        }
    }

    this.changeField = function (newField, setManual) {
        if (setManual) { manual = true; };
        if (newField != this.searchField) {
            this.searchFields = [newField];
            if ('name' != newField) { this.searchFields.push('name'); }
            if ('email' != newField) { this.searchFields.push('email'); }
            if ('phone' != newField) { this.searchFields.push('phone'); }
            this.searchField = newField;
            this.search();
        }
    }

    this.search = function () {
        this.loading += 1;
        this.contacts = [];
        this.loadedAll = false;
        offset = 0;
        this.loadingMore = false;

        if (!manual) {
            var emailRegex = /^\S+@\S+$/;
            var phoneRegex = /[0-9]{5,15}/;

            if (emailRegex.test(this.query)) {
                this.changeField('email');
            } else if (this.query.replace(/\d/g,'').length < 4 && phoneRegex.test(this.query.replace(/\D/g,''))) {
                this.changeField('phone');
            } else {
                this.changeField('name');
            }
        }

        q = this.query;
        if (x.searchField == 'phone') {
            // Remove inital zero if there is one and replace special chars with a wildcard to match as many
            // different phone number formats as possible.
            q = {
                LIKE: '%' + this.query.replace(/^[0]/, '').replace(/[ #+.-]{1,}/g, '%') + '%'
            };
        }

        f = x.searchField;
        if (f == 'name') {
            f = 'display_name';
        }

        ApiService.contactSearch(q, f, offset).then(function (data) {
            if (x.loading > 0) {    // Necessary as geolocation may set loading to 0 directly.
                x.loading -= 1;
            }
            if (x.loading == 0) {
                x.contacts = data;
                if (data.length < 30) {
                    x.loadedAll = true;
                }
            }
        });
    }

    this.loadMore = function () {
        // Check we're not already loading more contacts and that a search is not ongoing.
        if (!this.loadingMore && this.loading == 0 && !this.loadedAll) {
            this.loadingMore = true;
            offset += 1;
            console.log('load more ' + offset);
            var query = this.query;
            ApiService.contactSearch(q, f, offset).then(function (data) {
                if (query == x.query && x.loading == 0) {  // Make sure the query hasn't been updated in the mean time.
                    x.contacts = x.contacts.concat(data);
                    if (data.length < 30) {
                        x.loadedAll = true;
                    }
                }
                x.loadingMore = false;
            });
        }
    }

    this.geoSearch = function () {
        ngDialog.open({ template: 'mobile/partials/dialogs/contact_geo_search', data: { distance: 50, unit: 'miles' } })
        .closePromise.then(function (data) {
            var value = data.value;
            if (!value.postcode && !value.distance && !value.unit) {
                return; // If a user just clicks away without providing any detail.
            }
            else if (!value.postcode && (!value.distance || !value.unit)) {
                ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'Please provide valid location information' });
            } else {
                x.loading += 1;
                x.contacts = [];
                if (value.postcode) {
                    x.geoHeader = 'Contacts in ' + value.postcode.toUpperCase();
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

    this.search(); // Initially load list of contacts with search with empty query.
}]);
