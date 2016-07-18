'use strict';
angular.module('civimobile').service('ApiService', ['$http', '$q', function ($http, $q) {
    var URL = 'ajax/rest';

    // FIXME need to sort out api errors.

    // var indProfileId = <?php echo civimobile::getProfileId('Individual'); ?>;
    // var orgProfileId = <?php echo civimobile::getProfileId('Organization'); ?>;
    // var houseProfileId = <?php echo civimobile::getProfileId('Household'); ?>;

    // FIXME
    var indProfileId = defaultProfileIds.Individual;
    var orgProfileId = defaultProfileIds.Organization;
    var houseProfileId = defaultProfileIds.Household;
    var indProfile, orgProfile, houseProfile;

    this.getProfile = function (p) {
        var profile;
        switch (p) {
            case 'Individual':
                return getIndProf();
            case 'Organization':
                return getOrgProf();
            case 'Household':
                return getHouseProf();
            default:
                return new Error('Something went wrong.');
        }
    }

    function getIndProf() {
        if (!indProfile) {
            indProfile = getProfile(indProfileId);
        }
        return indProfile;
    }
    function getOrgProf() {
        if (!orgProfile) {
            orgProfile = getProfile(orgProfileId);
        }
        return orgProfile;
    }
    function getHouseProf() {
        if (!houseProfile) {
            houseProfile = getProfile(houseProfileId);
        }
        return houseProfile;
    }

    function getProfile(id) {
        var params = {
            entity: 'UFField',
            action: 'get',
            json: JSON.stringify({
                version: 3,
                uf_group_id: id,
                'api.Contact.getfield': { name: '$value.field_name', action: 'get' },
                'api.Contact.getoptions': { field: '$value.field_name' },
                // return: ['label','field_name','is_view','is_required', 'field_type'],
                sequential: 1,
                options: { sort: 'weight' }
            })
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            return data.data.values;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        })
        .then(function (data) {
            var profile = [];
            for (var i = 0; i < data.length; i++) {
                // We only want active fields of some subtype of contact.
                if (data[i].is_active === '1' && ['Individual', 'Organization', 'Household', 'Contact'].indexOf(data[i].field_type) > -1) {
                    var field = {};
                    field.html = data[i]['api.Contact.getfield'].values.html;
                    field.field_name = data[i].field_name;
                    field.label = data[i].label;
                    if (data[i].is_required) {
                        field.required = true;
                    }
                    // If there are options for a field, include them.
                    if (!data[i]['api.Contact.getoptions'].is_error) {
                        field.options = data[i]['api.Contact.getoptions'].values;
                    }
                    profile.push(field);
                }
            }
            return profile;
        });
    }

    this.contactSearch = function (q, searchField) {
        searchField = searchField || 'sort_name';
        var json = {
                version: 3,
                return: ['display_name','phone','email','contact_type'],
                sequential: 1
            }
        json[searchField] = { 'LIKE': '%' + q + '%' };
        var params = {
            entity: 'Contact',
            action: 'get',
            json: JSON.stringify(json)
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            return processContacts(data.data.values);
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    };

    function processContacts(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            if (c.phone != '') {
                c.icon = 'phone';
                c.url = 'tel:' + c.phone.replace(/\s+/g, ''); // Phone number urls require no spaces
            } else if (c.email != '') {
                c.icon = 'email';
                c.url = 'mailto:' + c.email;
            } else {
                c.icon = '';
            }
        }
        return contacts;
    }

    this.getContactsIn = function (postcode) {
        var params = {
            entity: 'Address',
            action: 'get',
            json: JSON.stringify({
                version: 3,
                postal_code: postcode,
                'api.contact.getsingle': { contact_id: '$value.contact_id' },
                sequential: 1
            })
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            var cs = [];
            for (var i = 0; i < data.data.values.length; i ++) {
                cs.push(data.data.values[i]['api.contact.getsingle']);
            }
            return cs;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        }).then(processContacts);
    }

    this.getContactsNearby = function (coords, distance, units) {
        var params = {
            entity: 'Contact',
            action: 'proximity',
            json: JSON.stringify({
                version: 3,
                latitude: coords.latitude,
                longitude: coords.longitude,
                distance: distance,
                units: units,
                'api.contact.getsingle': { id: '$value.contact_id', return: ['display_name', 'email', 'phone'] },
                sequential: 1
            })
        };
        return $http.post(URL, null, { params: params, headers: {'Content-Type': 'application/x-www-form-urlencoded'} })
        .then(function success(data) {
            var cs = []
            for (var i = 0; i < data.data.values.length; i++) {
                var c = data.data.values[i];
                cs.push(c['api.contact.getsingle']);
            }
            return cs;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        }).then(processContacts);
    }

    this.getContactType = function (id) {
        var params = {
            entity: 'Contact',
            action: 'getvalue',
            json: JSON.stringify({
                version: 3,
                id: id,
                return: 'contact_type'
            })
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            return data.data.result;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    }

    this.getContact = function (id) {
        var params = {
            entity: 'Contact',
            action: 'get',
            json: JSON.stringify({
                version: 3,
                id: id
            })
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            return data.data.values[id];
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    }

    this.saveContact = function (fields) {
        fields.version = 3;
        fields.sequential = 1;
        var params = {
            entity: 'Contact',
            action: 'create',
            json: JSON.stringify(fields)
        };
        return $http.post(URL, null, { params: params, headers: {'Content-Type': 'application/x-www-form-urlencoded'} })
        .then(function success(data) {
            return data.data.values[0].id;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    }

    this.eventSearch = function (q) {
        var params = {
            entity: 'Event',
            action: 'get',
            json: JSON.stringify({
                version: 3,
                title: {'LIKE': '%' + q + '%'},
                return: ['event_title','id'],
                sequential: 1
            })
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            return data.data.values;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    };

    this.getEvent = function (id) {
        var params = {
            entity: 'Event',
            action: 'get',
            json: JSON.stringify({
                version: 3,
                id: id,
                'api.LocBlock.getsingle': {
                    id: '$value.loc_block_id',
                    'api.address.getsingle': {
                        id: '$value.address_id'
                    }
                }
            })
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            return data.data.values[id];
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    }

    this.getEventParticipants = function (id) {
        var params = {
            entity: 'Participant',
            action: 'get',
            json: JSON.stringify({
                version: 3,
                event_id: id,            // 1 = registered, 2 = attended, 5 = pending (pay later)
                participant_status_id: { 1: 1, 2: 2, 5: 5 },
                return: ['display_name','participant_status','participant_status_id'],
                sort: 'sort_name',
                sequential: 1
            })
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            return data.data.values;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        })
        .then(function (ps) {
            for (var i = 0; i < ps.length; i++) {
                var p = ps[i];
                processParticipant(p);
            }
            return ps;
        });
    }

    function processParticipant(p) {
        var x = p.participant_status_id || p.status_id; // This is inconsistent, so check both.
        switch (x) {                                    // Distinguish between three types of participant
            case '1':                                   // we're interested in.
                p.checkedIn = false;
                p.payLater = false;
                break;
            case '2':
                p.checkedIn = true;
                p.payLater = false;
                break;
            case '5':
                p.checkedIn = false;
                p.payLater = true;
                break;
        }
    }

    this.updateParticipant = function (id, checkedIn, payLater) {
        var status;
        if (checkedIn) {
            status = 2;
        } else if (payLater) {
            status = 5;
        } else {
            status = 1;
        }
        var params = {
            entity: 'Participant',
            action: 'update',
            json: JSON.stringify({
                version: 3,
                participant_id: id,
                participant_status_id: status
            })
        };
        return $http.post(URL, null, { params: params, headers: {'Content-Type': 'application/x-www-form-urlencoded'} })
        .then(function success(data) {
            // FIXME What to do?
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    }

    this.addParticipant = function (eventId, contactId, payLater) {
        var params = {
            entity: 'Participant',
            action: 'create',
            json: JSON.stringify({
                version: 3,
                event_id: eventId,
                contact_id: contactId,
                is_pay_later: payLater,
                sequential: 1
            })
        };
        return $http.post(URL, null, { params: params, headers: {'Content-Type': 'application/x-www-form-urlencoded'} })
        .then(function success(data) {
            // FIXME What to do?
            var p = data.data.values[0];
            processParticipant(p);
            return p;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    }

    this.getEventFields = function () {
        var params = {
            entity: 'Event',
            action: 'getfields',
            json: JSON.stringify({
                version: 3,
                api_action: 'get',
                sequential: 1
            })
        };
        return $http.get(URL, { params: params })
        .then(function success(data) {
            return data.data.values;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        })
        .then(function (data) {
            var fields = [];
            for (var i = 0; i < data.length; i++) {
                var field = {
                    field_name: data[i].name,
                    label: data[i].title,
                    html: data[i].html
                };
                fields.push(field);
            }
            return fields;
        });
    }

    this.saveEvent = function (fields) {
        fields.version = 3;
        fields.sequential = 1;
        var params = {
            entity: 'Event',
            action: 'update',
            json: JSON.stringify(fields)
        };
        return $http.post(URL, null, { params: params, headers: {'Content-Type': 'application/x-www-form-urlencoded'} })
        .then(function success(data) {
            return;
        }, function error(data, status, headers) {
            return new Error('Something went wrong.');
        });
    }

}]);
