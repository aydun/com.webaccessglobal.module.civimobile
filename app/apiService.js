'use strict';
angular.module('civimobile').service('ApiService', ['$http', '$q', '$cacheFactory', function ($http, $q, $cacheFactory) {
    var URL = 'ajax/rest';

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
                return $q.when(angular.copy(x)); // Wrap the result in a resolved promise for consistency
                                                 // with when it's a http call.
            }
        }

        function success(data) {
            var result = data.data.values || data.data.result || data.data;
            result = then(result);
            if (key) {
                cache.put(key, angular.copy(result));
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
            return: ['is_active', 'label','field_name','is_view','is_required', 'field_type'],
            options: { sort: 'weight' }
        };
        function then(values) {
            var profile = [];
            for (var i = 0; i < values.length; i++) {
                // We only want active fields of some subtype of contact.
                if (values[i].is_active === '1' &&
                            ['Individual', 'Organization', 'Household', 'Contact'].indexOf(values[i].field_type) > -1) {
                    var field = {};
                    field.type = values[i]['api.Contact.getfield'].values.html ? values[i]['api.Contact.getfield'].values.html.type : '';
                    field.field_name = values[i].field_name;
                    if (field.field_name == 'email' || field.field_name == 'phone') {
                        field.type = field.field_name;
                    }
                    field.label = values[i].label;
                    field.title = values[i].title;
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
        var params = {
            id: id,
            'api.Phone.get': {},
            'api.Email.get': {}
        }
        return request('Contact', 'getsingle', params).then(function (value) {
            value.email = value['api.Email.get'].values;
            value.phone = value['api.Phone.get'].values;
            return value;
        });
    }

    this.saveContact = function (fields, emails, phones) {
        // Unfortunately multiple api requests are needed here (necessitated by Civi api).
        // One for normal contact fields, and then one for each email or phone number edited.
        // The returned promise is resolved when all requests return successfully.
        var f; var e = []; var p= [];
        f = request('Contact', 'create', fields, true);
        if (emails) {
            for (var i = 0; i < emails.length; i++) {
                if (fields.contact_id || emails[i].contact_id) {
                    emails[i].contact_id = emails[i].contact_id || fields.contact_id;
                    e.push(request('Email', emails[i].email ? 'create' : 'delete', emails[i], true));
                } else {
                    e.push(f.then(function (values) {
                        emails[i].contact_id = values[0].id;
                        return request('Email', 'create', emails[i], true);
                    }));
                }
            }
        }
        if (phones) {
            for (var i = 0; i < phones.length; i++) {
                if (fields.contact_id || phones[i].contact_id) {
                    phones[i].contact_id = phones[i].contact_id || fields.contact_id;
                    p.push(request('Phone', phones[i].phone ? 'create' : 'delete', phones[i], true));
                } else {
                    p.push(f.then(function (values) {
                        phones[i].contact_id = values[0].id;
                        return request('Phone', 'create', phones[i], true);
                    }));
                }
            }
        }
        var x = e.concat(p)
        x.unshift(f);
        return $q.all(x).then(function (vss) {
            return vss[0][0];
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
            },
            'api.address.getoptions': { field: 'state_province_id' },
            'api.Address.getoptions': { field: 'country_id' }
            // Bit hacky - capitalising here allows us two chained 'getoptions' requests, otherwise the
            // second would overwrite the first.
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
            options: { limit: 0 },
            'api.ParticipantPayment.get': {
                'api.Contribution.get': { return: ['total_amount', 'currency', 'contribution_status_id'] }
            }
        };
        return request('Participant', 'get', params).then(function (ps) {
            for (var i = 0; i < ps.length; i++) {
                var p = ps[i];
                p.payment = p['api.ParticipantPayment.get'].values[0];
                if (p.payment) {
                    p.contribution = p.payment['api.Contribution.get'].values[0];
                }
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

    this.saveEvent = function (fields, address) {
        var e = request('Event', 'update', fields, true);
        if (address) { // If we have an address, update that too.
            address.contact_id = userId; // Set in index.php, current user id.
            // A little bit complicated, essentially we create a new address record and update the location
            // block to refer to the new address. Being conservative in case address is used by more than one
            // entity.
            var a = request('Address', 'create', address, true);
            a.then(function (address) {
                return request('LocBlock', 'create', { id: fields.loc_block_id, address_id: address[0].id }, true);
            });
            return $q.all([e,a]);
        }
        return e;
        // FIXME what to do now?
    }

    this.getMembershipTypes = function () {
        function then(values) {
            var ms = [];
            for (var i = 0; i < values.length; i++) {
                if (values[i].is_active) {
                    ms.push(values[i]);
                }
            }
            return ms;
        }
        return request('MembershipType', 'get', {}, false, then, true);
    }

    this.getMemberships = function (q) {
        var params = {
            'contact_id.display_name': { 'LIKE': '%' + q + '%' },
            active_only: true,
            return: ['membership_type_id.name', 'membership_type_id', 'contact_id.display_name',
                     'contact_id', 'is_pay_later', 'status_id'],
            options: { limit: 0, sort: 'contact_id.sort_name' }
            // FIXME: should paginate and load X at a time.
        }
        return request('Membership', 'get', params).then(function (values) {
            for (var i = 0; i < values.length; i++) {
                values[i].display_name = values[i]['contact_id.display_name'];
                values[i].membership_name = values[i]['membership_type_id.name'];
            }
            return values;
        });
    }

    this.getMembershipStatusOptions = function () {
        return request('Membership', 'getoptions', { field: 'status_id' }, false, null, true);
    }

    this.getMembership = function (id) {
        var params = {
            id: id,
            active_only: true,
            'api.Membership.getoptions': { field: 'status_id' },
            'api.Contribution.getoptions': { field: 'contribution_status_id' },
            'api.MembershipPayment.get': {
                membership_id: id,
                return: ['contribution_id.total_amount', 'contribution_id.currency',
                         'contribution_id.receive_date', 'contribution_id.contribution_status_id',
                         'contribution_id']
            },
            return: ['membership_type_id.name', 'membership_type_id',
                     'contact_id.display_name', 'contact_id', 'is_pay_later',
                     'status_id', 'is_override', 'join_date', 'start_date',
                     'end_date', 'source']
        }
        return request('Membership', 'getsingle', params).then(function (value) {
            var cStatusOptions = value['api.Contribution.getoptions'].values;
            delete value['api.Contribution.getoptions'];
            value.display_name = value['contact_id.display_name'];
            delete value['contact_id.display_name'];
            value.membership_name = value['membership_type_id.name'];
            delete value['membership_type_id.name'];
            value.statusOptions = value['api.Membership.getoptions'].values;
            delete value['api.Membership.getoptions'];
            value.payments = value['api.MembershipPayment.get'].values;
            delete value['api.MembershipPayment.get'];
            for (var i = 0; i < value.payments.length; i++) {
                var p = value.payments[i];
                p.total_amount = p['contribution_id.total_amount'];
                delete p['contribution_id.total_amount'];
                p.currency = p['contribution_id.currency'];
                delete p['contribution_id.currency'];
                p.receive_date = new Date(p['contribution_id.receive_date']);
                delete p['contribution_id.receive_date'];
                for (var j = 0; j < cStatusOptions.length; j++) {
                    if (p['contribution_id.contribution_status_id'] == cStatusOptions[j].key) {
                        p.status = cStatusOptions[j].value;
                    }
                }
                delete p['contribution_id.contribution_status_id'];
            }
            return value;
        });
    }

    this.saveMembership = function (m) {
        return request('Membership', 'create', m, true);
    }

    this.saveMembershipPayment = function (mId, cId) {
        var params = { membership_id: mId, contribution_id: cId };
        return request('MembershipPayment', 'create', params, true);
    }

    this.getContribution = function (id) {
        var params = {
            id: id,
            'api.Contact.getsingle': { id: '$value.contact_id', return: ['display_name'] },
            return: ['financial_type_id', 'total_amount', 'currency', 'contribution_source',
                     'contribution_status_id']
        }
        return request('Contribution', 'getsingle', params).then(function (result) {
            result.source = result.contribution_source;
            delete result.contribution_source;
            result.display_name = result['api.Contact.getsingle'].display_name;
            delete result['api.Contact.getsingle'];
            return result;
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

}]);
