'use strict';
angular.module('civimobile').controller('EventController', ['$state', '$stateParams', 'ApiService', 'ngDialog', '$filter', function ($state, $stateParams, ApiService, ngDialog, $filter) {
    this.id = $stateParams.id
    this.event = {};
    this.address = {};
    this.stateOptions = [];
    this.countryOptions = [];
    this.fields = [];
    var fieldsToDisplay = ['title', 'start_date', 'end_date', 'summary', 'description'];
    this.participants;
    this.displayRegistered = true;
    this.displayCheckedIn = true;
    this.loadingParticipants = true;
    var addressModified = false; // So we can see if it's been updated.

    // So we can refer to 'this' within promises.
    var x = this;

    ApiService.getEvent(this.id).then(function (event) {
        event.start_date = new Date(event.start_date);
        event.end_date = new Date(event.end_date);
        x.event = event;
        var address = event['api.LocBlock.getsingle']['api.address.getsingle'];
        if (address) {
            x.address = address;
        }
        x.stateOptions = event['api.address.getoptions'].values;
        x.countryOptions = event['api.Address.getoptions'].values; // See comment in ApiService.
        if (address) {
            for (var i = 0; i < x.stateOptions.length; i++) {
                if (x.stateOptions[i].key == x.address.state_province_id) {
                    x.address.state = x.stateOptions[i];
                }
            }
            for (var i = 0; i < x.countryOptions.length; i++) {
                if (x.countryOptions[i].key == x.address.country_id) {
                    x.address.country = x.countryOptions[i];
                }
            }
        }
    });
    ApiService.getEventFields().then(function (fields) {
        for (var i = 0; i < fields.length; i++) {
            if (fieldsToDisplay.indexOf(fields[i].field_name) > -1) {
                x.fields.push(fields[i]);
            }
        }
    });
    ApiService.getEventParticipants(this.id).then(function (ps) {
        x.participants = ps;
        x.loadingParticipants = false;
    });

    this.showRegistered = function () {
        this.displayRegistered = true;
        this.displayCheckedIn = false;
    }
    this.showCheckedIn = function () {
        this.displayCheckedIn = true;
        this.displayRegistered = false;
    }
    this.showAll = function () {
        this.displayRegistered = true;
        this.displayCheckedIn = true;
    }

    // For use with ng-class.
    this.selected = function (reg, check) {
        if (reg == this.displayRegistered && check == this.displayCheckedIn) {
            return 'selected';
        }
        return 'not-selected';
    }

    this.updateParticipant = function (p) {
        if (p.checkedIn && p.payLater) {
            ngDialog.open({ template: 'mobile/partials/dialogs/check_in_participant', data: p })
            .closePromise.then(function (data) {
                var code = data.value;
                if (code != 1 && code != 2 && code != 3) { // No action taken, so revert 'check in'.
                    return p.checkedIn = false;
                }
                if (code == 2) {
                    $state.go('contributions.new', { cId: p.contact_id,
                                                     name: p.display_name,
                                                     type: 4, // 4 = 'event fee' type
                                                     currency: x.event.currency,
                                                     source: x.event.event_title + ' : check in at event' });
                }
                if (code == 3) {
                    ApiService.saveContribution({ id: p.contribution.contribution_id,
                                                  contribution_status_id: 1 }); // 1 = 'complete'
                }
                ApiService.updateParticipant(p.id, p.checkedIn, p.payLater);
            });
        } else {
            ApiService.updateParticipant(p.participant_id, p.checkedIn, p.payLater);
        }
        // FIXME deal with errors/notify of success.
    }

    this.addParticipant = function () {
        if (this.loadingParticipants) {
            return; // FIXME Won't work if participants not loaded yet.
        }
        ngDialog.open({
            template: 'mobile/partials/dialogs/new_participant',
            controller: 'ContactsController',
            controllerAs: 'contacts',
            appendClassName: 'ngdialog-list'})
        .closePromise.then(function (data) {
            var contact = data.value;
            if (contact.contact_id) {
                for (var i = 0; i < x.participants.length; i++) {
                    if (x.participants[i].contact_id == contact.contact_id) { // If contact is already participant do nothing.
                        ngDialog.open({ template: 'mobile/partials/dialogs/message',
                                        data: 'This contact is already an event participant' });
                        return;
                    }
                }
                var payLater = true;
                if (!x.is_monetary) {
                    false;
                }
                // Participants are added as 'pay_later' unless the event is free.
                ApiService.addParticipant(x.id, contact.contact_id, payLater).then(function (p) {
                    p.display_name = contact.display_name;
                    x.participants.unshift(p);
                });
            }
        });
    }

    this.changeAddress = function () {
        // Called by ng-change on edit page.
        addressModified = true;
    }

    this.save = function () {
        var fs = {};
        for (var i = 0; i < this.fields.length; i++) {
            var f = this.fields[i];
            fs[f.field_name] = this.event[f.field_name];
        }
        fs.id = this.event.id;
        fs.loc_block_id = this.event.loc_block_id;
        this.address.state_province_id = this.address.state.key;
        this.address.country_id = this.address.country.key;
        delete this.address.state;    // Don't want to leak these two to the api request.
        delete this.address.country;
        delete this.address.id;       // Need to create a new address record as an address may be used by more than one entity.
        ApiService.saveEvent(fs, addressModified ? this.address : null).then(function () {
            $state.go('^.view', null, { reload: true });
        });
    }
}]);
