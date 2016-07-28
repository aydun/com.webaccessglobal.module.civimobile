'use strict';
angular.module('civimobile').service('ApiService', ['$http', '$q', '$cacheFactory', function ($http, $q, $cacheFactory) {
    var URL = 'ajax/rest';

    // var indProfileId = <?php echo civimobile::getProfileId('Individual'); ?>;
    // var orgProfileId = <?php echo civimobile::getProfileId('Organization'); ?>;
    // var houseProfileId = <?php echo civimobile::getProfileId('Household'); ?>;

    // FIXME
    var indProfileId = defaultProfileIds.Individual;
    var orgProfileId = defaultProfileIds.Organization;
    var houseProfileId = defaultProfileIds.Household;

    var cache = $cacheFactory('ApiService');

    function request(entity, action, json, isPost, then, shouldCache) {
        json.version = 3;
        json.sequential = 1;
        then = then || angular.identity;
        var params = {
            entity: entity,
            action: action,
            json: JSON.stringify(json)
        };
        var key;
        if (shouldCache) {
            key = entity + '/' + action + '/' + JSON.stringify(json);
            var x = cache.get(key);
            if (x) {
                return $q.when(x); // Wrap the result in a resolved promise for consistency with when it's a http call.
            }
        }

        function success(data) {
            var result = data.data.values || data.data.result;
            result = then(result);
            if (key) {
                cache.put(key, result);
            }
            return result;
        }
        function failure() {
            // FIXME
            console.log('An error occured.')
        }

        if (!isPost) {
            return $http.get(URL, { params: params }).then(success, failure);
        } else {
            return $http.post(URL, null, {
                params: params,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(success, failure);
        }
    }

    this.getProfile = function (p) {
        var profile;
        switch (p) {
            case 'Individual':
                return getProfile(indProfileId);
            case 'Organization':
                return getProfile(orgProfileId);
            case 'Household':
                return getProfile(houseProfileId);
            default:
                return new Error('Something went wrong.');
        }
    }

    function getProfile(id) {
        var params = {
            uf_group_id: id,
            'api.Contact.getfield': { name: '$value.field_name', action: 'get' },
            'api.Contact.getoptions': { field: '$value.field_name' },
            // return: ['label','field_name','is_view','is_required', 'field_type'],
            options: { sort: 'weight' }
        };
        function then(values) {
            var profile = [];
            for (var i = 0; i < values.length; i++) {
                // We only want active fields of some subtype of contact.
                if (values[i].is_active === '1' && ['Individual', 'Organization', 'Household', 'Contact'].indexOf(values[i].field_type) > -1) {
                    var field = {};
                    field.html = values[i]['api.Contact.getfield'].values.html;
                    field.field_name = values[i].field_name;
                    field.label = values[i].label;
                    if (values[i].is_required) {
                        field.required = true;
                    }
                    // If there are options for a field, include them.
                    if (!values[i]['api.Contact.getoptions'].is_error) {
                        field.options = values[i]['api.Contact.getoptions'].values;
                    }
                    profile.push(field);
                }
            }
            return profile;
        }
        return request('UFField', 'get', params, false, then, true);
    }

    function processContacts(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            if (c.phone != '') {
                c.icon = 'phone';
                c.url = 'tel:' + c.phone.replace(/\s+/g, ''); // Phone number urls require no spaces.
            } else if (c.email != '') {
                c.icon = 'email';
                c.url = 'mailto:' + c.email;
            } else {
                c.icon = '';
            }
        }
        return contacts;
    }

    this.contactSearch = function (q, searchField, offset) {
        searchField = searchField || 'sort_name';
        var params = {
            return: ['display_name','phone','email','contact_type'],
            sort: 'sort_name',
            options: { limit: 30, offset: (offset*30 || 0) }
        }
        params[searchField] = q;
        return request('Contact', 'get', params).then(processContacts);
    }

    this.getContactsIn = function (postcode) {
        var params = {
            postal_code: {'LIKE': postcode + '%'}, // Match partially completed postcodes.
            'api.contact.getsingle': { contact_id: '$value.contact_id' }
        };
        return request('Address', 'get', params).then(function (values) {
            var cs = [];
            for (var i = 0; i < values.length; i ++) {
                cs.push(values[i]['api.contact.getsingle']);
            }
            return cs;
        }).then(processContacts);
    }

    this.getContactsNearby = function (coords, distance, units) {
        var params = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            distance: distance,
            units: units,
            'api.contact.getsingle': { id: '$value.contact_id', return: ['display_name', 'email', 'phone'] }
        };
        return request('Contact', 'proximity', params, true).then(function (values) {
            var cs = [];
            for (var i = 0; i < values.length; i++) {
                var c = values[i];
                cs.push(c['api.contact.getsingle']);
            }
            return cs;
        }).then(processContacts);
    }

    this.getContact = function (id) {
        return request('Contact', 'get', { id: id }).then(function (values) {
            return values[0];
        });
    }

    this.saveContact = function (fields) {
        return request('Contact', 'create', fields, true).then(function (values) {
            return values[0].id;
        });
    }

    this.getContributionFields = function () {
        var params = {
            api_action: 'create',
            return: ['name', 'title', 'html', 'required']
        };
        return request('Contribution', 'getfields', params, false, null, true);
    }

    this.getContributionFieldOptions = function (field) {
        return request('Contribution', 'getoptions', { field: field }, false, null, true);
    }

    this.saveContribution = function (fields) {
        // If 'default' currency remove the property; the API will handle this as default.
        if (fields.currency == '000') { fields.currency = ''; }
        return request('Contribution', 'create', fields, true).then(function (values) {
            return values[0];
        });
    }

    this.eventSearch = function (q) {
        var params = {
            title: {'LIKE': '%' + q + '%'},
            return: ['event_title','id']
        };
        return request('Event', 'get', params);
    }

    this.getEvent = function (id) {
        var params = {
            id: id,
            'api.LocBlock.getsingle': {
                id: '$value.loc_block_id',
                'api.address.getsingle': {
                    id: '$value.address_id'
                }
            }
        };
        return request('Event', 'get', params).then(function (values) {
            return values[0];
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

    this.getEventParticipants = function (id) {
        var params = {
            event_id: id,
            participant_status_id: { 1: 1, 2: 2, 5: 5 }, // 1 = registered, 2 = attended, 5 = pending (pay later).
            return: ['display_name','participant_status','participant_status_id'],
            sort: 'sort_name',
            options: { limit: 0 }
        };
        return request('Participant', 'get', params).then(function (ps) {
            for (var i = 0; i < ps.length; i++) {
                var p = ps[i];
                processParticipant(p);
            }
            return ps;
        });
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
            participant_id: id,
            participant_status_id: status
        };
        return request('Participant', 'update', params, true);
        // FIXME what to do now?
    }

    this.addParticipant = function (eventId, contactId, payLater) {
        var status = 1;
        if (payLater) { status = 5; }
        var params = {
            event_id: eventId,
            contact_id: contactId,
            status_id: status
        };
        return request('Participant', 'create', params, true).then(function (values) {
            processParticipant(values[0]);
            return values[0];
        });
    }

    this.getEventFields = function () {
        function then(values) {
            var fields = [];
            for (var i = 0; i < values.length; i++) {
                var field = {
                    field_name: values[i].name,
                    label: values[i].title,
                    html: values[i].html
                };
                fields.push(field);
            }
            return fields;
        }
        return request('Event', 'getfields', { api_action: 'get' }, false, then, true);
    }

    this.saveEvent = function (fields) {
        return request('Event', 'update', fields, true);
        // FIXME what to do now?
    }

}]);
