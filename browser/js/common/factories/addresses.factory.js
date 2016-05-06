app.factory('AddressesFactory', function($http, $rootScope){

	return{
		findById: function(id){
			console.log("Finding");
			return $http.get('/api/addresses/' + id)
			.then(function(res){
				console.log(res.data);
				return res.data;
			})
		},

		findByUserId: function(id){
			return $http.get('/api/addresses/user/' + id)
			.then(function(res){
				console.log(res.data);
				return res.data;
			})
		}, 

		findOrCreate: function(obj){
			return $http.post('/api/addresses', obj)
				.then(function(res) {
					return res.data;
				});
		}
	}
});

