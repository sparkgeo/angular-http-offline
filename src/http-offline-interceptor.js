/*global angular:true, browser:true */

/**
 * @license HTTP Offline Interceptor Module for AngularJS
 * (c) 2017 Alain St Pierre
 * License: MIT
 */

(function () {
  'use strict';

  angular.module('http-offline-interceptor', ['http-offline-interceptor-buffer'])

  .factory('offlineService', ['$rootScope','httpBuffer', function($rootScope, httpBuffer) {
    return {
      /**
       * Call this function to indicate that a connection was established and trigger a
       * retry of all deferred requests.
       * @param data an optional argument to pass on to $broadcast which may be useful for
       * example if you need to pass through details of the user that was logged in
       * @param configUpdater an optional transformation function that can modify the
       * requests that are retried after having logged in. It must return the request.
       */
      retryRequests: function() {
        $rootScope.$broadcast('event:offline-retryRequests');
        httpBuffer.retryAll();
      },

      /**
       * All deferred requests will be abandoned or rejected (if reason is provided).
       * @param data an optional argument to pass on to $broadcast.
       * @param reason if provided, the requests are rejected; abandoned otherwise.
       */
      cancelRequests: function() {
        httpBuffer.rejectAll();
        $rootScope.$broadcast('event:offline-cancelRequests');
      }
    };
  }])

  /**
   * $http interceptor.
   * On -1 response (without 'ignoreOfflineModule' option) stores the request
   * and broadcasts 'event:offline-connectionRequired'.
   */
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push(['$rootScope', '$q', 'httpBuffer', function($rootScope, $q, httpBuffer) {
      return {
        responseError: function(rejection) {
          var config = rejection.config || {};
          if (!config.ignoreOfflineModule) {
            switch (rejection.status) {
              case -1:
                //remove these null transforms - they cause errors for offline
                delete config.transformResponse;
                delete config.transformRequest;
                var deferred = $q.defer();
                var bufferLength = httpBuffer.append(config);
                if (bufferLength === 1)
                  $rootScope.$broadcast('event:offline-connectionRequired', rejection);
                // if (bufferLength > 0)
                //   console.log('Buffered request until back online', rejection);
                return deferred.promise;
            }
          }
          // otherwise, default behaviour
          return $q.reject(rejection);
        }
      };
    }]);
  }]);

  /**
   * Private module, a utility, required internally by 'http-offline-interceptor'.
   */
  angular.module('http-offline-interceptor-buffer', ['ngStorage'])

  .factory('httpBuffer', ['$injector', '$localStorage', function($injector, $localStorage) {
    /** Holds all the requests, so they can be re-requested in future. */

    $localStorage.buffer = $localStorage.buffer || [];

    /** Service initialized later because of circular dependency problem. */
    var $http;
    var $q;

    function retryHttpRequest(config) {
      $q = $q || $injector.get('$q');
      function successCallback(response) {
        $q.resolve(response);
      }
      function errorCallback(response) {
        $q.reject(response);
      }
      $http = $http || $injector.get('$http');
      $http(config).then(successCallback, errorCallback);
    }

    return {
      /**
       * Appends HTTP request configuration object with deferred response attached to buffer.
       * @return {Number} The new length of the buffer.
       */
      append: function(config) {
        return $localStorage.buffer.push(config);
      },

      /**
       * Abandon or reject (if reason provided) all the buffered requests.
       */
      rejectAll: function() {
        $localStorage.buffer = [];
      },

      /**
       * Retries all the buffered requests clears the buffer.
       */
      retryAll: function() {
        for (var i = 0; i < $localStorage.buffer.length; ++i) {
          if ($localStorage.buffer[i])
            retryHttpRequest($localStorage.buffer[i]);
        }
        $localStorage.buffer = [];
      }
    };
  }]);
})();

/* commonjs package manager support (eg componentjs) */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
  module.exports = 'http-offline-interceptor';
}
