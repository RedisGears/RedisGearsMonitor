var app = angular.module('myApp', []);

function GeDictionaryFromArray(arr, len){
	if(len >= 2){
		return arr;
	}
	if(arr == null || !Array.isArray(arr)){
		return arr;
	}else{
		var i = 0;
		var dict = {}
		for (i = 0; i < arr.length; i+=2) {
			dict[arr[i]] = GeDictionaryFromArray(arr[i + 1], len + 1);
		}
		return dict;
	}
};

app.controller('myCtrl', function($scope, $http) {

	$scope.firstName = "John";
	$scope.lastName = "Doe";
	$scope.registrations = [];
	$scope.RefreshInterval = 1

	$scope.Refresh = function(response) {
		res = response['data'][0];
		var registrations = []
		res.forEach(function(e){
			var eDict = JSON.parse(e);
			var oldDict = $scope.registrations.filter(function(e){
				return e['id'] == eDict['id'];
			});
			if(oldDict.length > 0){
				Object.assign(oldDict[0], eDict);
				eDict = oldDict[0]
			}
			if(eDict['RegistrationData']['numFailures'] > '0'){
				eDict['class'] = 'alert alert-danger';
			}else{
				eDict['class'] = 'alert alert-success';
			}
			registrations.push(eDict);
		});
		$scope.registrations = registrations.sort(function (a,b){
			return a['id'].localeCompare(b['id']);
		});
	};

	$scope.DoRefresh = function() {
		$http.get("dumpregistrations").then($scope.Refresh);
		setTimeout($scope.DoRefresh, $scope.RefreshInterval * 1000);
	};

	$scope.Unregister = function(id) {
		$http.get("unregister?id=" + id).then(function(response){
			$http.get("dumpregistrations").then($scope.Refresh);
		});
	};



	$http.get("dumpregistrations").then($scope.Refresh);

	setTimeout($scope.DoRefresh, $scope.RefreshInterval * 1000);

});