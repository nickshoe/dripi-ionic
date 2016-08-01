// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'pubnub.angular.service'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.filter('toMinSec', function(){
  return function(input){
    if (!input) return '';

    var minutes = parseInt(input/60, 10);
    var seconds = input%60;

    return minutes + (minutes > 1 ? ' minutes' : ' minute') + (seconds ? ' and ' + seconds + (seconds > 1 ? ' seconds' : ' second') : '');
  }
})

.controller('MainCtrl', ['$scope', 'Pubnub', function($scope, Pubnub) {

    Pubnub.init({
        publish_key: 'pub-c-202f92c7-77aa-4abd-a588-edea3cbb4ee5',
        subscribe_key: 'sub-c-d379b9a0-573c-11e6-b1c5-0619f8945a4f',
        ssl: true,
        uuid: $scope.uuid
    });


    // Heartbeat
    $scope.status = 'init';

    heartbeat_timeout_timer = null;

    // Water Pump
    $scope.is_running = null;

    $scope.last_session_elapsed_time = null;
    $scope.current_session_elapsed_time = null;

    // Subscribe to 'status' messages channel
    Pubnub.subscribe({
        channel: 'status',
        callback: function(message, channel) {
          //console.log(message);

          if (message.resource == 'heartbeat') {
            clearTimeout(heartbeat_timeout_timer);

            if (message.params == 'good') {
              $scope.status = 'online';
            } else {
              $scope.status = 'offline';
            }

            $scope.$apply();
          }

          if (message.resource == 'water_pump') {
            $scope.is_running = message.params.is_running;
            $scope.max_exercise_time = message.params.max_exercise_time;
            $scope.last_started_at = Date.parse(message.params.last_started_at);
            $scope.last_stopped_at = Date.parse(message.params.last_stopped_at);

            if ($scope.last_stopped_at > $scope.last_started_at) {
              $scope.last_session_elapsed_time = Math.ceil(($scope.last_stopped_at - $scope.last_started_at) / 1000);
            } else {
              $scope.last_session_elapsed_time = null;
            }

            if ($scope.last_started_at > $scope.last_stopped_at) {
              elapsed_time_in_milliseconds = Date.now() - $scope.last_started_at;
              $scope.current_session_elapsed_time = Math.ceil(elapsed_time_in_milliseconds / 1000);
            } else {
              $scope.current_session_elapsed_time = null;
            }

            $scope.$apply();
          }
        }
    });

    function check_heartbeat() {
      Pubnub.publish({
          channel: 'control',
          message: {
            resource: 'heartbeat',
            operation: 'status',
            params: null
          },
          callback: function(message) {
              //console.log(message);
          }
      });

      heartbeat_timeout_timer = setTimeout(function() {
        $scope.status = 'offline'

        $scope.$apply();
      }, 15000);
    }

    check_heartbeat();
    setInterval(function() {
      check_heartbeat();
    }, 15000);

    function check_waterpump_status() {
      Pubnub.publish({
          channel: 'control',
          message: {
            resource: 'water_pump',
            operation: 'status',
            params: null
          },
          callback: function(message) {
              //console.log(message);
          }
      });
    }

    check_waterpump_status();

    $scope.refresh_status = function() {
      check_waterpump_status();
    };

    // Send the messages over PubNub Network
    $scope.start = function() {
        Pubnub.publish({
            channel: 'control',
            message: {
              resource: 'water_pump',
              operation: 'start',
              params: null
            },
            callback: function(message) {
                //console.log(message);

                check_waterpump_status();
            }
        });
    };

    $scope.stop = function() {
        Pubnub.publish({
            channel: 'control',
            message: {
              resource: 'water_pump',
              operation: 'stop',
              params: null
            },
            callback: function(message) {
                //console.log(message);

                check_waterpump_status();
            }
        });
    };

}]);
