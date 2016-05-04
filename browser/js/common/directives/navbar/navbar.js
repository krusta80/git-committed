app.directive('navbar', function ($rootScope, AuthService, OrdersFactory, CategoriesFactory, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function (scope) {

            scope.items = [
                { label: 'Home', state: 'home' },
                { label: 'About', state: 'about' },
                //{ label: 'Members Only', state: 'membersOnly', auth: true },
                { label: 'Categories', state: 'categories'}
            ];

            scope.user = null;

            console.log("cart is "+$rootScope.cart);

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                   OrdersFactory.reloadCart();
                   $state.go('home');
                });
            };

            scope.clearCurrentCategory = function(){
                return CategoriesFactory.clearCurrentCategory();
            };

            var setUser = function () {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function () {
                scope.user = null;
            };

            var updateCartItems = function (event, data) {
                scope.cartItems = data;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
            $rootScope.$on('cartUpdate', updateCartItems);
        }

    };

});
