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
                    title: 'Contacts'
                }
            })
            .state('contacts.list', {
                url: '',
                templateUrl: 'mobile/partials/contacts',
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
            .state('contacts.detail.contribution', {
                url: '/contribution?type?amount?currency?status?source',
                templateUrl: 'mobile/partials/new_contribution',
                controller: 'ContributionController',
                controllerAs: 'contribution'
            })
            .state('events', {
                url: '/events',
                abstract: true,
                template: '<ui-view/>',
                controller: 'EventsController',
                controllerAs: 'events',
                data: {
                    title: 'Events'
                }
            })
            .state('events.list', {
                url: '?q',
                templateUrl: 'mobile/partials/events',
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
            .state('events.detail.attendees', {
                url: '/attendees',
                templateUrl: 'mobile/partials/event_attendees'
            })
            .state('events.detail.edit', {
                url: '/edit',
                templateUrl: 'mobile/partials/edit_event'
            })
            .state('memberships', {
                url: '/memberships',
                templateUrl: 'mobile/partials/memberships',
                data: {
                    title: 'Memberships'
                }
            })
            .state('donations', {
                url: '/donations',
                templateUrl: 'mobile/partials/donations',
                data: {
                    title: 'Donations'
                }
            })
            .state('surveys', {
                url: '/surveys',
                templateUrl: 'mobile/partials/surveys',
                data: {
                    title: 'Surveys'
                }
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
