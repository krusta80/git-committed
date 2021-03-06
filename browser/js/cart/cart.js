app.config(function($stateProvider){

	$stateProvider.state('cart', {
		url: '/cart',
		controller: 'CartCtrl',
		templateUrl: 'js/cart/cart.html',
		resolve: {
			cart: function(OrdersFactory) {
				return OrdersFactory.populateCart();
			},
			user: function(AuthService) {
				return AuthService.getLoggedInUser()
						.then(function(user) {
							return user;
						})
						.catch(function(err) {
							return {};
						})
			}
		}
	});
});

app.controller('CartCtrl', function(cart, user, OrdersFactory, $scope, $stateParams, $state, $rootScope, AuthService, GitCommitted){

	$scope.user = user;
	console.log("CartCtr: user is " + user);
	$scope.cart = cart;
	console.log("Cart state when entering checkout page:", cart);
	$scope.billing = {type: "Billing Address", show: false}; $scope.shipping = {type: "Shipping Address", show: false};

	$scope.toggleAddressBook = function(type){
		$scope[type].show = !$scope[type].show;
	}

	$scope.isEmpty = function(){
		return $scope.cart.lineItems.length === 0;
	}

	$scope.addToCart = function(product, qty) {
		OrdersFactory.addItem(product, qty)
		.then(function(updatedCart) {
			return OrdersFactory.populateCart(updatedCart.id);
		})
		.then(function(populatedCart) {
			$scope.cart = populatedCart;
		})
	};

	$scope.setQuantity = function(product, qty){
		OrdersFactory.setItemQuantity(product, qty)
		.then(function(updatedCart){
			return OrdersFactory.populateCart(updatedCart.id)
		})
		.then(function(populatedCart){
			$scope.cart = populatedCart;
		})
	}

	$scope.deleteItem = function(product) {
		OrdersFactory.removeFromCart(product)
		.then(function(updatedCart) {
			return OrdersFactory.populateCart(updatedCart.id);
		})
		.then(function(populatedCart) {
			$scope.cart = populatedCart;
		})
	};

	// Truncate to two decimal places
	$scope.calculateTax = function(){
		var state = $scope.billing.state;
		var subtotal = $scope.cart.subtotal;
		if(state){
			return parseFloat((subtotal * (OrdersFactory.getSalesTaxPercent(state) / 100)).toFixed(2));
		}
	}

	$scope.submitOrder = function(){
		$scope.billing.userId = cart.userId; 
		$scope.shipping.userId = cart.userId;
		OrdersFactory.submitOrder(cart.id, $scope.cart, $scope.billing, $scope.shipping, $scope.payment)
		.then(function(updatedCart){
			//Reset cart counter
			OrdersFactory.reloadCart();
			$rootScope.$emit('cartUpdate', 0);
			//Clear cart after ordering
			$scope.success = "Order Successful!  Thanks for shopping with $git committed!"
			setTimeout(function() {
				$state.go('home');	
			}, 3000);
			
		})
		.catch(function(err) {
			console.log("Error!", err);
			$scope.error = GitCommitted.errorify(err);
		})
		
	}

});