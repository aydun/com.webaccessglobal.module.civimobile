'use strict';
angular.module('civimobile').controller('ContactController', ['$state', '$stateParams', 'ApiService', function ($state, $stateParams, ApiService) {
    this.id = $stateParams.id;
    this.type = $stateParams.type
    this.contact = {};
    this.fields = [];

    // So we can refer to 'this' within promises.
    var x = this;

    if (this.id) {
        // Editing a contact
        ApiService.getContact(this.id)
            .then(function (c) {
                x.contact = c;
                return c.contact_type;
            })
            .then(ApiService.getProfile)
            .then(function (p) {
                x.fields = p;
            });
    } else {
        // Creating a contact
        this.contact = { contact_type: this.type };
        ApiService.getProfile(this.contact.contact_type)
            .then(function (p) {
                x.fields = p;
            });
    }

    this.save = function () {
        var fs = {};
        for (var i = 0; i < this.fields.length; i++) {
            var f = this.fields[i];
            fs[f.field_name] = this.contact[f.field_name];
        }
        if (this.contact.contact_id) {
            fs.contact_id = this.contact.contact_id;
        } else {
            fs.contact_type = this.contact.contact_type;
        }
        ApiService.saveContact(fs).then(function (id) {
            $state.go('contacts.detail.view', { id: id });
        });
    }
}]);
