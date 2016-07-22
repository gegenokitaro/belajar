
/* global angular, cordova, StatusBar */

angular.module('apclient', ['ionic', 'apclient-config', 'apclient-controller', 'apclient-service'])

        .run(function ($ionicPlatform,  $rootScope, $state, $ws) {
            $ionicPlatform.ready(function () {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                    cordova.plugins.Keyboard.disableScroll(true);
                }
                if (window.StatusBar) {
                    // org.apache.cordova.statusbar required
                    StatusBar.styleDefault();
                }
                
                if ($ws.isLogin()) {
                    $state.transitionTo("app.pos");
                }
                
            });
            
            $rootScope.$on("$stateChangeStart", function (event, toState) {

                if (toState.authenticate && !$ws.isLogin()) {
                    $state.transitionTo("login");
                    event.preventDefault();
                }
                
                if (!toState.authenticate && $ws.isLogin()) {
                    $state.transitionTo("app.pos");
                    event.preventDefault();
                }
                
            });
            
        })

        .config(function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                    .state('app', {
                        url: '/app',
                        abstract: true,
                        templateUrl: 'template/app.html',
                        controller: 'AppCtrl',
                        authenticate: true
                    })
                    .state('login', {
                        url: '/login',
                        templateUrl: 'template/login.html',
                        controller: 'LoginCtrl',
                        authenticate: false
                    })
                    .state('app.pos', {
                        url: '/pos',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/pos.html',
                                controller: 'PosCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.trans', {
                        url: '/trans/:type',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/transaction.html',
                                controller: 'TransCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.transform', {
                        url: '/transform/:type/:act/:id',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/transaction-form.html',
                                controller: 'TransFormCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.payment', {
                        url: '/payment',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/payment.html',
                                controller: 'PaymentCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.paymenthistory', {
                        url: '/paymenthistory/:id',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/payment-history.html',
                                controller: 'PaymentHistoryCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.paymentform', {
                        url: '/paymentform/:act/:id/:type/:partner/:trans',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/payment-form.html',
                                controller: 'PaymentFormCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.inventory', {
                        url: '/inventory',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/inventory.html',
                                controller: 'InventoryCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.inventoryform', {
                        url: '/inventoryform/:act/:id',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/inventory-form.html',
                                controller: 'InventoryFormCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.partner', {
                        url: '/partner',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/partner.html',
                                controller: 'PartnerCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.partnerform', {
                        url: '/partnerform/:act/:id',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/partner-form.html',
                                controller: 'PartnerFormCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.product', {
                        url: '/product',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/product.html',
                                controller: 'ProductCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.productform', {
                        url: '/productform/:act/:id',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/product-form.html',
                                controller: 'ProductFormCtrl'
                            }
                        },
                        authenticate: true
                    })
                    .state('app.setting', {
                        url: '/setting',
                        views: {
                            'menuContent': {
                                templateUrl: 'template/setting.html',
                                controller: 'SettingCtrl'
                            }
                        },
                        authenticate: true
                    });
            $urlRouterProvider.otherwise('/app/pos');
        });
