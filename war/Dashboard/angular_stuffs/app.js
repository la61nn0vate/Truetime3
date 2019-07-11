'use strict';


var app = angular.module('admin',
    ['controllers', 'ngRoute', 'ui.bootstrap']).
    config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider.
               when('/', {
                   templateUrl: 'partials/dashboard_home.html',
                   controller: 'dashboard_controller'
               }).
               when('/organisation_details', {
                    templateUrl: 'partials/organisational.html',
                    controller: 'organisation_controller'
                }).
                when('/employee_details', {
                    templateUrl: 'partials/employee.html',
                    controller: 'employee_controller'
                }).
                when('/sites_details', {
                    templateUrl: 'partials/site.html',
                    controller: 'site_controller'
                }).
                when('/shift_details', {
                    templateUrl: 'partials/shift.html',
                    controller: 'shift_controller'
                }).
                when('/attendance_details', {
                    templateUrl: 'partials/attendance_details.html',
                    controller: 'attendance_details_controller'
                }).
                when('/attendance_reports', {
                    templateUrl: 'partials/attendance_reports.html',
                    controller: 'attendance_report_controller'
                }).
                when('/profile', {
                    templateUrl: 'partials/profile.html',
                    controller: 'profile_controller'
                }).
                when('/site_managers', {
                    templateUrl: 'partials/sitemanager.html',
                    controller: 'sitemanager_controller'
                }).
                   otherwise({
                    redirectTo: '/'
                });
        }]);


app.directive('validFile', function () {
    return {
        require: 'ngModel',
        link: function (scope, el, attrs, ngModel) {
            el.bind('change', function () {
                scope.$apply(function () {
                    ngModel.$setViewValue(el.val());
                    ngModel.$render();
                });
            });
        }
    }
});


app.factory('oauth2Provider', function ($modal) {
    var oauth2Provider = {
        CLIENT_ID: '26822065412-gpv1kf1o8os4pkepfvla1t89jagmcke2.apps.googleusercontent.com',
        SCOPES: 'https://www.googleapis.com/auth/userinfo.email profile',
        	signedIn: false
    };

    /**
    * Calls the OAuth2 authentication method.
    */
    oauth2Provider.signIn = function (callback) {
        gapi.auth.signIn({
            'clientid': oauth2Provider.CLIENT_ID,
            'cookiepolicy': 'single_host_origin',
            'accesstype': 'online',
            'approveprompt': 'auto',
            'scope': oauth2Provider.SCOPES,
            'callback': callback
        });
    };

    /**
    * Logs out the user.
    */
    oauth2Provider.signOut = function () {
        gapi.auth.signOut();
        // Explicitly set the invalid access token in order to make the API calls fail.
        gapi.auth.setToken({ access_token: '' })
        oauth2Provider.signedIn = false;
    };

    /**
    * Shows the modal with Google+ sign in button.
    *
    * @returns {*|Window}
    */
    oauth2Provider.showLoginModal = function () {
        var modalInstance = $modal.open({
            templateUrl: 'partials/login.modal.html',
            controller: 'OAuth2LoginModalCtrl'
        });
        return modalInstance;
    };

    return oauth2Provider;
});


/**
 * @ngdoc controller
 * @name DatepickerCtrl
 *
 * @description
 * A controller that holds properties for a datepicker.
 */
app.controller('DatepickerCtrl', function ($scope) {
    $scope.today = function () {
        $scope.dt = new Date();
    };
    $scope.today();

    $scope.clear = function () {
        $scope.dt = null;
    };

    // Disable weekend selection
    $scope.disabled = function (date, mode) {
        return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    $scope.toggleMin = function () {
        $scope.minDate = ( $scope.minDate ) ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.opened = true;
    };

    $scope.dateOptions = {
        'year-format': "'yyyy'",
        'starting-day': 1
    };

    $scope.formats = ['yyyy-MM-dd', 'yyyy/MM/dd', 'shortDate'];
    $scope.format = $scope.formats[0];
});
