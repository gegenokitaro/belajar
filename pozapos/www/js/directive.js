/* global angular */

angular.module('apclient-directive', [])
        .directive('itemProduct', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-product.html'
            };
        })
        .directive('itemProductChart', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-product-chart.html'
            };
        })
        .directive('itemChart', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-chart.html'
            };
        })
        .directive('itemChartInv', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-chart-inv.html'
            };
        })
        .directive('itemChartAcc', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-chart-acc.html'
            };
        })
        .directive('itemChartPayment', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-chart-payment.html'
            };
        })
        .directive('itemAcc', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-acc.html'
            };
        })
        .directive('itemDetail', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-detail.html'
            };
        })
        .directive('itemDetailInv', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-detail-inv.html'
            };
        })
        .directive('itemTransaction', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-transaction.html'
            };
        })
        .directive('itemTransactionInv', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-transaction-inv.html'
            };
        })
        .directive('itemPartner', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-partner.html'
            };
        })
        .directive('itemPartnerChart', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-partner-chart.html'
            };
        })
        .directive('itemAccount', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-account.html'
            };
        })
        .directive('itemPayment', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-payment.html'
            };
        })
        .directive('itemPaymentHistory', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-payment-history.html'
            };
        })
        .directive('itemInvoiceChart', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/item-invoice-chart.html'
            };
        })
        .directive('inputSearchPos', function () {
            return {
                restrict: 'E',
                templateUrl: 'template/directive/input-search-pos.html'
            };
        })
        .directive('focusMe', function ($timeout) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    scope.$watch(attrs.focusMe, function (newValue) {
                        if (newValue === true) {
                            $timeout(function () {
                                element[0].focus();
                                element[0].select();
                            }, 100);
                        }
                    });
                }
            };
        })
        .directive('focusInput', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    element.on('click', function () {
                        this.select();
                    });
                }
            };
        })
        .directive('format', function ($filter) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    if (!ctrl)
                        return;

                    ctrl.$formatters.unshift(function (a) {
                        return $filter(attrs.format)(ctrl.$modelValue);
                    });

                    ctrl.$parsers.unshift(function (viewValue) {
                        var plainNumber = viewValue.replace(/[^\d|\-+|\.+]/g, '');
                        elem.val($filter(attrs.format)(plainNumber));
                        return plainNumber;
                    });
                }
            };
        });


