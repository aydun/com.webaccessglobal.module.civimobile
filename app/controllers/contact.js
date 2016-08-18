'use strict';
angular.module('civimobile').controller('ContactController', ['$state', '$stateParams', 'ApiService', '$previousState', function ($state, $stateParams, ApiService, $previousState) {
    this.id = $stateParams.id;
    this.type = $stateParams.type
    this.contact = {};
    this.fields = [];
    this.emails = []; this.deletedEmails = [];
    this.newEmail = ''; // Used when adding a new email.
    this.primaryEmail = ''; this.billingEmail = ''; this.bulkmailEmail = ''; // Email IDs.
    this.phones = []; this.deletedPhones = [];
    this.newPhone = ''; // Used when adding a new phone.
    this.primaryPhone = ''; this.billingPhone = ''; this.bulkmailPhone = ''; // Phone IDs.
    this.hasEmail = false; // Whether to display email or not.
    this.hasPhone = false; // Whether to display phone or not.

    // So we can refer to 'this' within promises.
    var x = this;

    if (this.id) {
        // Editing a contact
        ApiService.getContact(this.id)
            .then(function (c) {
                x.emails = c.email;
                for (var i = 0; i < x.emails.length; i++) {
                    var e = x.emails[i];
                    if (e.is_primary == '1') { x.primaryEmail = e.id; }
                    if (e.is_billing == '1') { x.billingEmail = e.id; }
                    if (e.is_bulkmail == '1') { x.bulkmailEmail = e.id; }
                }
                x.phones = c.phone;
                for (var i = 0; i < x.phones.length; i++) {
                    var p = x.phones[i];
                    if (p.is_primary == '1') { x.primaryPhone = p.id; }
                    if (p.is_billing == '1') { x.billingPhone = p.id; }
                }
                x.contact = c;
                return c.contact_type;
            })
            .then(ApiService.getProfile).then(processProfile);
    } else {
        // Creating a contact
        this.contact = { contact_type: this.type };
        ApiService.getProfile(this.contact.contact_type).then(processProfile);
    }

    function processProfile(p) {
        for (var i = 0; i < p.length; i++) {
            var f = p[i];
            if (f.options) {
                for (var j = 0; j < f.options.length; j++) {
                    if (f.options[j].key == x.contact[f.field_name]) {
                        x.contact[f.field_name] = f.options[j];
                    }
                }
            }
            if (f.field_name == 'email' || f.field_name == 'phone') {
                x.hasEmail = x.hasEmail || f.field_name == 'email';
                x.hasPhone = x.hasPhone || f.field_name == 'phone';
                p.splice(i,1);
                i--;
            }
        }
        x.fields = p;
    }

    this.removeEmail = function () {
        for (var i = 0; i < this.emails.length; i++) {
            if (this.emails[i].email == '') {
                this.deletedEmails.push(this.emails[i]);
                this.emails.splice(i,1);
                i--;
            }
        }
    }

    this.addEmail = function () {
        var emailRegex = /^\S+@\S+$/;
        if (emailRegex.test(this.newEmail)) {
            this.emails.push({
                email: this.newEmail,
                is_primary: '0',
                is_bulkmail: '0',
                is_billing: '0'
            });
            this.newEmail = '';
        }
    }

    this.removePhone = function () {
        for (var i = 0; i < this.phones.length; i++) {
            if (this.phones[i].phone == '') {
                this.deletedPhones.push(this.phones[i]);
                this.phones.splice(i,1);
                i--;
            }
        }
    }

    this.addPhone = function () {
        var phoneRegex = /[0-9]{4,15}/;
        if (phoneRegex.test(this.newPhone)) {
            this.phones.push({
                phone: this.newPhone,
                is_primary: '0',
                is_billing: '0'
            });
            this.newPhone = '';
        }
    }

    this.back = function (route) {
        if ($previousState.get('next')) {
            // If there's a 'next' state, then the previous state is more relevant than
            // the hierarchical parent, so it's not .go('next').
            $previousState.go();
            $previousState.forget('next');
        } else {
            $state.go(route, null, { reload: route == '^.view' });
        }
    }

    this.save = function () {
        var fs = {};
        for (var i = 0; i < this.fields.length; i++) {
            var f = this.fields[i];
            if (f.options) {
                if (this.contact[f.field_name]) {
                    fs[f.field_name] = this.contact[f.field_name].key;
                }
            } else {
                fs[f.field_name] = this.contact[f.field_name];
            }
        }
        if (this.contact.contact_id) {
            fs.contact_id = this.contact.contact_id;
        } else {
            fs.contact_type = this.contact.contact_type;
        }
        for (var i = 0; i < this.emails.length; i++) {
            var e = this.emails[i];
            e.is_primary = e.id == this.primaryEmail ? '1' : '0';
            e.is_billing = e.id == this.billingEmail ? '1' : '0';
            e.is_bulkmail = e.id == this.bulkmailEmail ? '1' : '0';
        }
        for (var i = 0; i < this.phones.length; i++) {
            var p = this.phones[i];
            p.is_primary = p.id == this.primaryPhone ? '1' : '0';
            p.is_billing = p.id == this.billingPhone ? '1' : '0';
        }
        ApiService.saveContact(fs, this.emails.concat(this.deletedEmails), this.phones.concat(this.deletedPhones)).then(function (c) {
            if ($previousState.get('next')) {
                $state.go($previousState.get('next').state.name, { id: c.id, name: c.display_name });
                $previousState.forget('next');
            } else {
                $state.go('contacts.detail.view', { id: c.id }, { reload: true });
            }
        });
    }
}]);
