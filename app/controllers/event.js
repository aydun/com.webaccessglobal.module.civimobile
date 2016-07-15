'use strict';
angular.module('civimobile').controller('EventController', ['$state', '$stateParams', 'ApiService', 'ngDialog', function ($state, $stateParams, ApiService, ngDialog) {
    this.id = $stateParams.id
    this.event = {};
    this.address = {};
    this.fields = [];
    var fieldsToDisplay = ['title', 'start_date', 'end_date', 'summary'];
    this.participants;
    this.displayRegistered = true;
    this.displayCheckedIn = true;
    this.loadingParticipants = true;

    // So we can refer to 'this' within promises.
    var x = this;

    ApiService.getEvent(this.id).then(function (event) {
        x.event = event;
        var address = event['api.LocBlock.getsingle']['api.address.getsingle'];
        if (address) {
            x.address = address;
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
        // FIXME should alert to collect payment if p.payLater
        ApiService.updateParticipant(p.participant_id, p.checkedIn, p.payLater);
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
                        ngDialog.open({ template: 'mobile/partials/dialogs/message', data: 'This contact is already an event participant' });
                        return;
                    }
                }
                ApiService.addParticipant(x.id, contact.contact_id, false).then(function (p) {
                    p.display_name = contact.display_name;
                    x.participants.unshift(p);
                });
            }
        });
    }

    this.save = function () {
        // FIXME also save address
        var fs = {};
        for (var i = 0; i < this.fields.length; i++) {
            var f = this.fields[i];
            fs[f.field_name] = this.event[f.field_name];
        }
        fs.id = this.event.id;
        ApiService.saveEvent(fs).then(function () {
            $state.go('^.view');
        });
    }
}]);
