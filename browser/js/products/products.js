app.config(function($stateProvider){

	$stateProvider.state('categories.products', {
		url: '/:categoryId/products',
		controller: 'ProductsByCategoryCtrl',
		templateUrl: 'js/products/productsByCategory.html',
		resolve: {
			products: function($stateParams, ProductsFactory){
				if($stateParams.categoryId.indexOf('SEARCH') === 0)
					return ProductsFactory.searchProducts($stateParams.categoryId.slice(7));
				return ProductsFactory.fetchByCategory($stateParams.categoryId);
			},
			user: function(AuthService){
				return AuthService.getLoggedInUser();
			},
			searchString: function($stateParams) {
				if($stateParams.categoryId.indexOf('SEARCH') === 0)
					return $stateParams.categoryId.slice(7);
				else
					return null;
			}
		}
	});

	$stateProvider.state('product', {
		url: '/product/:id',
		controller: 'ProductCtrl',
		templateUrl: 'js/products/product.html',
		resolve: {
			product: function($stateParams, ProductsFactory){
				return ProductsFactory.fetchById($stateParams.id);
			}
		}
	});

	$stateProvider.state('adminProduct', {
		url: '/admin/product/:id',
		controller: 'adminProductCtrl',
		templateUrl: 'js/products/adminProduct.html',
		resolve: {
			product: function($stateParams, ProductsFactory){
				if($stateParams.id !== 'NEW')
					return ProductsFactory.fetchById($stateParams.id);
				return {};
			},
			categories: function(CategoriesFactory){
				return CategoriesFactory.fetchAll();
			}
		}
	});

});

app.controller('ProductsByCategoryCtrl', function(OrdersFactory, $state, $scope, $log, $stateParams, products, user, CategoriesFactory, ProductsFactory, searchString, $rootScope){

	$rootScope.$emit('clearProductSearch', true);
	CategoriesFactory.setCurrentCategory($stateParams.categoryId);
	$scope.products = products;
	$scope.user = user;
	$scope.searchString = searchString;

	$scope.addToCart = function(product) {
		OrdersFactory.addToCart(product);
	};

	$scope.scaleDown = function(imgUrl) {
		return imgUrl.replace(/640/, '230').replace(/480/, '172');
	};

	$scope.showCategories = function(categories){
		var categoriesName = categories.map(function(category){
			return category.name;
		});
		return categoriesName.join(', ');
	};

	$scope.editPage = function(productId){
		$state.go('adminProduct', {id: productId});
	};

	$scope.delete = function(id){
		ProductsFactory.deleteProduct(id)
			.then(function(){
				return ProductsFactory.fetchByCategory($stateParams.categoryId);
			})
			.then(function(products){
				$scope.products = products;
				alert('Delete successfully');
			})
			.catch($log);
	};

	$scope.priceFilter = function(product) {
		if($scope.minPrice === undefined && $scope.maxPrice === undefined)
			return true;
		else if($scope.minPrice === undefined)
			return product.price <= $scope.maxPrice; 
		else if($scope.maxPrice === undefined)
			return product.price >= $scope.minPrice;
		else
			return product.price >= $scope.minPrice && product.price <= $scope.maxPrice; 
	};

	$scope.productNameFilter = function(product){
		if($scope.searchByName === undefined)
			return true;
		else if(product.title.toLowerCase().indexOf($scope.searchByName.toLowerCase()) !== -1)
			return true;
		else
			return false;
	};

	$scope.starsFilter = function(product){
		if($scope.minStars === undefined)
			return true;
		else
			return product.averageStars >= $scope.minStars;
	};	

});


app.controller('ProductCtrl', function($scope, OrdersFactory, product, $state, AuthService) {

	$scope.product = product;
	AuthService.getLoggedInUser().then(function(user){
		$scope.user = user;
	})

	$scope.getQuantityArray = function(){
		var quantity = [];
		for(var i = 1; i < $scope.product.inventoryQty + 1; i++){
			quantity.push(i);
		}
		return quantity;
	};

	$scope.addToCart = function(){
		OrdersFactory.addToCart(product, $scope.selectedQuantity);
		$state.go('categories');
	}

	$scope.roundStars = function(stars) {
		return Math.round(stars*10)/10;
	};

	$scope.addReview = function() {
		$state.go('addReviews', {productId: product._id});
	};



});

app.controller('adminProductCtrl', function($scope, $rootScope, $log, $state, product, categories, ProductsFactory, CategoriesFactory, GitCommitted){
	var originalProduct = angular.copy(product);
	$scope.product = product;
	$scope.newProduct = {
		title: product.title,
		price: product.price,
		inventoryQty: product.inventoryQty,
		description: product.description,
		imageUrls: product.imageUrls,
		categories: product.categories
	};

	var restoreForm = function() {
		for(var key in $scope.newProduct){
			$scope.newProduct[key] = originalProduct[key];
		};
	};

	$scope.save = function(){
		
		$scope.newProduct.categories = $scope.categories.filter(function(category){
			return category.exist;
		});

		for(var key in $scope.newProduct){
			$scope.product[key] = $scope.newProduct[key];
		};

		if(product._id)
			ProductsFactory.updateProduct($scope.product)
				.then(function(){
					alert('Save successfully');
					if($rootScope.previousState && $rootScope.previousState.name === 'productList')
						return $state.go($rootScope.previousState);
					$state.go('categories.products', {categoryId: CategoriesFactory.fetchCurrentCategory()});
				})
				.catch(function(err){
					$scope.error = GitCommitted.errorify(err.data);
					restoreForm();
				});
		else
			ProductsFactory.createProduct($scope.product)
				.then(function(){
					alert('Created successfully');
					if($rootScope.previousState && $rootScope.previousState.name === 'productList')
						return $state.go($rootScope.previousState);
					$state.go('categories.products', {categoryId: CategoriesFactory.fetchCurrentCategory()});
				})
				.catch(function(err){
					$scope.error = GitCommitted.errorify(err.data);
					restoreForm();
				});
	};

	$scope.delete = function(){
		restoreForm();
		ProductsFactory.deleteProduct($scope.product._id)
			.then(function(){
				alert('Delete successfully');
				if($rootScope.previousState.name === 'productList')
					return $state.go($rootScope.previousState);
				if(CategoriesFactory.fetchCurrentCategory().length > 0)				
					$state.go('categories.products', {categoryId: CategoriesFactory.fetchCurrentCategory()});
				else 
					$state.go('productList');
			})
			.catch(function(err){
				$scope.error = GitCommitted.errorify(err.data);
				restoreForm();
			});			
	};

	$scope.getHistory = function() {
		$state.go('productHistory', {origId: $scope.product.origId});
	};

	$scope.addImage = function(){
		if(!$scope.product.imageUrls)
			$scope.product.imageUrls = [];
		
		if(!$scope.newProduct.imageUrls)
			$scope.newProduct.imageUrls = [];
		
		if($scope.product.imageUrls.indexOf($scope.newImageUrl) !== -1){
			$scope.newImageUrl = null;
			return alert('Image already exists');
		}
		if($scope.newImageUrl === null){
			$scope.newImageUrl = null;
			return alert('Please enter image url');
		}
		$scope.newProduct.imageUrls.push($scope.newImageUrl);
		$scope.newImageUrl = null;
	};

	$scope.deleteImage = function(imgUrl){
		$scope.newProduct.imageUrls.splice($scope.product.imageUrls.indexOf(imgUrl), 1);
	};

	$scope.categories = categories.map(function(category){
		if(!$scope.newProduct.categories)
			$scope.newProduct.categories = [];
		for(var i = 0; i < $scope.newProduct.categories.length; i++){
			if($scope.newProduct.categories[i]._id === category._id){
				category.exist = true;
				break;
			}
			else
				category.exist = false;

		}
		return category;
	});
});



