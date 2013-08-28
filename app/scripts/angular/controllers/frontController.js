function frontController ($scope, configService) {
	$scope.config = configService;
	$scope.name = 'front';

	$scope.init = function () {
		
	}
}

frontController.$inject = [ '$scope', 'configService' ];