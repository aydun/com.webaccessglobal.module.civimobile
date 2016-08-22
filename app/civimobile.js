'use strict';
angular.module('civimobile', ['ui.router', 'ngDialog', 'ct.ui.router.extras.core', 'ct.ui.router.extras.previous', 'vs-repeat'])
    .config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('home', {
                url: '',
                templateUrl: 'mobile/partials/home',
                controller: 'HomeController',
                controllerAs: 'home',
                data: {
                    title: 'CiviMobile'
                }
            })
            .state('contacts', {
                url: '/contacts',
                abstract: true,
                template: '<ui-view/>',
                controller: 'ContactsController',
                controllerAs: 'contacts',
                data: {
                    title: 'Manage contacts'
                }
            })
            .state('contacts.list', {
                url: '',
                templateUrl: 'mobile/partials/contacts'
            })
            .state('contacts.new', {
                url: '/new/:type',
                templateUrl: 'mobile/partials/new_contact',
                controller: 'ContactController',
                controllerAs: 'contact'
            })
            .state('contacts.detail', {
                url: '/:id',
                abstract: true,
                template: '<ui-view/>',
                controller: 'ContactController',
                controllerAs: 'contact'
            })
            .state('contacts.detail.view', {
                url: '',
                templateUrl: 'mobile/partials/contact'
            })
            .state('contacts.detail.edit', {
                url: '/edit',
                templateUrl: 'mobile/partials/edit_contact'
            })
            .state('events', {
                url: '/events',
                abstract: true,
                template: '<ui-view/>',
                controller: 'EventsController',
                controllerAs: 'events',
                data: {
                    title: 'Manage events'
                }
            })
            .state('events.list', {
                url: '',
                templateUrl: 'mobile/partials/events'
            })
            .state('events.detail', {
                url: '/:id',
                abstract: true,
                template: '<ui-view/>',
                controller: 'EventController',
                controllerAs: 'event'
            })
            .state('events.detail.view', {
                url: '',
                templateUrl: 'mobile/partials/event'
            })
            .state('events.detail.participants', {
                url: '/participants',
                templateUrl: 'mobile/partials/event_participants'
            })
            .state('events.detail.edit', {
                url: '/edit',
                templateUrl: 'mobile/partials/edit_event'
            })
            .state('memberships', {
                url: '/memberships',
                abstract: true,
                template: '<ui-view/>',
                controller: 'MembershipsController',
                controllerAs: 'memberships',
                data: {
                    title: 'Manage memberships'
                }
            })
            .state('memberships.list', {
                url: '',
                templateUrl: 'mobile/partials/memberships'
            })
            .state('memberships.new', {
                url: '/new?id?name',
                templateUrl: 'mobile/partials/new_membership',
                controller: 'MembershipController',
                controllerAs: 'membership'
            })
            .state('memberships.detail', {
                url: '/:id',
                abstract: true,
                template: '<ui-view/>',
                controller: 'MembershipController',
                controllerAs: 'membership'
            })
            .state('memberships.detail.view', {
                url: '',
                templateUrl: 'mobile/partials/membership'
            })
            .state('memberships.detail.edit', {
                url: '/edit',
                templateUrl: 'mobile/partials/edit_membership'
            })
            .state('donations', {
                url: '/donations',
                templateUrl: 'mobile/partials/donations',
                controller: 'ContactsController',
                controllerAs: 'contacts',
                data: {
                    title: 'Collect donations'
                }
            })
            .state('contributions', {
                url: '/contributions',
                abstract: true,
                template: '<ui-view/>',
                data: {
                    title: 'Manage contributions'
                }
            })
            .state('contributions.new', {
                url: '/new?cId?mId?name?type?amount?currency?status?source',
                templateUrl: 'mobile/partials/new_contribution',
                controller: 'ContributionController',
                controllerAs: 'contribution'
            })
            .state('contributions.edit', {
                url: '/:id/edit',
                templateUrl: 'mobile/partials/edit_contribution',
                controller: 'ContributionController',
                controllerAs: 'contribution'
            });
    }])
    // This is necessary to access the Civi api without throwing an error
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    }])
    // Some nice defaults for dialogs
    .config(['ngDialogProvider', function (ngDialog) {
        ngDialog.setDefaults({
            className: 'ngdialog-theme',
            closeByNavigation: true,
            trapFocus: false
        });
    }])
    // This lets us update the page title dynamically
    .run(['$rootScope', '$state', function ($rootScope, $state) {
        $rootScope.$state = $state;
    }]);
