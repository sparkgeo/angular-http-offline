HTTP Offline Interceptor Module
============================
for AngularJS
-------------

Usage
------

- Install via bower: `bower install --save angular-http-offline`
- Include as a dependency in your app: `angular.module('myApp', ['http-offline-interceptor'])`

Manual
------

This module installs $http interceptor and provides the `offlineService`.

The $http interceptor does the following:
the configuration object (this is the requested URL, payload and parameters)
of every HTTP -1 response is buffered and everytime it happens, the
`event:offline-connectionRequired` message is broadcasted from $rootScope.

The `offlineService` has only 2 methods: `retryRequests()` and `cancelRequests()`.

You are responsible to invoke `retryRequests()` after connection is re-established. You may optionally pass in a data argument to this method which will be passed on to the retryRequests
$broadcast. This may be useful, for example if you need to pass through details of the user
that was logged in. The `offlineService` will then retry all the requests previously failed due
to HTTP -1 response.

You are responsible to invoke `cancelRequests()` when a connection cannot be re-established. You may optionally pass in
a data argument to this method which will be passed on to the cancelRequests
$broadcast. The `offlineService` will cancel all pending requests previously failed and buffered due
to HTTP -1 response.

#### Ignoring the interceptor

Sometimes you might not want the interceptor to intercept a request even if one returns status -1 . In a case like this you can add `ignoreOfflineModule: true` to the request config.
