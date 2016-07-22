/* global angular, device */

angular.module('apclient-controller', ['apclient-directive', 'apclient-helper'])

        .controller('AppCtrl', function ($scope, $state, $ionicLoading, $ionicPopup, $ionicModal, $ionicHistory, $timeout, $ws, CONFIG) {

//            APP CONSTANT
            $scope.BASEPATH = $ws.getServer();
            $scope.SERVERNAME = $ws.getServerName();
            $scope.BASEPATH_IMG = $ws.getServer(CONFIG.PATH_IMG);
            $scope.CUSTOMER = 'Customer';
            $scope.VENDOR = 'Vendor';
            $scope.CUSTOMER_AFF = 'Customer_Aff';
            $scope.VENDOR_AFF = 'Vendor_Aff';
            $scope.PARTNER = 'partner';
            $scope.PURCHASE = 'purchase';
            $scope.SALES = 'sales';
            $scope.CREATE = 'create';
            $scope.UPDATE = 'update';
            $scope.DELETE = 'delete';
            $scope.COMPLETE = 'complete';
            $scope.CANCEL = 'cancel';
            $scope.VIEW = 'view';
            $scope.C_INVOICE = 'I';
            $scope.C_CHARGE = 'C';
            $scope.C_CASH = 'B';
            $scope.C_CREDIT = 'K';
            $scope.C_DEBIT = 'D';
            $scope.PRINT_NOTA = 'nota';
            $scope.PRINT_STRUK = 'struk';
            $scope.PRINT_WIRELESS = 'wireless';
            $scope.PRINT_MOBILE = 'mobile';
            $scope.STATUSES = [{id: 'Draft', name: 'DRAFT'}, {id: 'Complete', name: 'COMPLETE'}, {id: 'Void', name: 'VOID'}, {id: 'Approved', name: 'APPROVED'}];

            $scope.activeMenu = 1;
            $scope.useSearch = false;
            $scope.setMenu = function (id) {
                $scope.activeMenu = id;
            };
            $scope.logout = function () {
                $scope.showConfirm('Keluar aplikasi harus login kembali. Apakah anda yakin?', function (res) {
                    if (res) {
                        $scope.doLogout();
                    }
                });
            };
            $scope.doLogout = function () {
                $ws.logout();
                $state.transitionTo('login');
                $scope.$on('$ionicView.afterLeave', function () {
                    $ionicHistory.clearCache();
                    $ionicHistory.clearHistory();
                });
            };
            $scope.init = function () {
                $scope.CONFIG = CONFIG;
                $scope.user = $ws.loginUser();
                if (!$scope.user.rolename) {
                    $scope.hideLoading();
                    return $scope.showAlert('Silakan login kembali.', $scope.doLogout);
                }

                $ws.getPrinterBarcode($scope.initPrinterBarcode, $scope.errorWS);
            };
            $scope.initPrinterBarcode = function (respon) {
                var def = respon.length > 0 ? respon[0] : {id: null, name: null};
                for (var i = 0; i < respon.length; i++) {
                    if (respon[i].isDefault) {
                        def = respon[i];
                        break;
                    }
                }
                $scope.updateLogin(false, $scope.user.setting || {
                    printFormat: $scope.isNative() ? $scope.PRINT_STRUK : $scope.PRINT_NOTA,
                    printer: $scope.PRINT_WIRELESS,
                    printerBarcode: def.id,
                    printerBarcodeName: def.name
                });
            }
            $scope.updateLogin = function (user, setting) {
                $scope.user = $ws.updateLogin(user, setting);
            };

//            GLOBAL FUNCTION
            $scope.isNative = function () {
                return navigator.camera;
            };

            $scope.showAlert = function (msg, callback) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Peringatan',
                    template: msg
                });
                alertPopup.then(callback);
            };
            $scope.showAlertEmpty = function () {
                $scope.showAlert('Field harus diisi semua.');
            };
            $scope.showNotif = function (msg, callback) {
                var msgs = {
                    create: 'Data berhasil ditambahkan.',
                    delete: 'Data berhasil dihapus.',
                    update: 'Data berhasil diperbaharui.',
                    view: 'Data berhasil diperbaharui.',
                    complete: 'Data berhasil diperbaharui.',
                    cancel: 'Data berhasil diperbaharui.'
                };
                var res = (msgs[msg]) ? msgs[msg] : msg;
                var alertPopup = $ionicPopup.alert({
                    title: 'Notifikasi',
                    template: res
                });
                alertPopup.then(callback);
            };
            $scope.showConfirm = function (msg, callback, opt) {
                var confirmPopup;
                if (opt) {
                    confirmPopup = $ionicPopup.show(opt);
                } else {
                    confirmPopup = $ionicPopup.confirm({
                        title: 'Konfirmasi',
                        template: msg
                    });
                }

                confirmPopup.then(callback);
            };
            $scope.showInput = function (scope, msg, callback) {
                $ionicPopup.show({
                    template: '<input type="tel" ng-model="popUp.data">',
                    title: msg,
                    scope: scope,
                    buttons: [
                        {text: 'Batal'},
                        {
                            text: 'Cetak',
                            type: 'button-positive',
                            onTap: function (e) {
                                if (!scope.popUp.data || isNaN(scope.popUp.data)) {
                                    e.preventDefault();
                                } else {
                                    return Number(scope.popUp.data);
                                }
                            }
                        }
                    ]
                }).then(callback);
            };
            $scope.showPrint = function (scope, trans, callback) {
                $ionicPopup.show({
                    template: '<small>Pilih \'Cetak\' untuk mencetak ulang struk.</small>',
                    title: 'Transaksi berhasil disimpan.',
                    scope: scope,
                    buttons: [
                        {text: 'Tutup'},
                        {
                            text: 'Cetak',
                            type: 'button-positive',
                            onTap: function (e) {
                                scope.$parent.printReceipt(scope, trans);
                                e.preventDefault();
                            }
                        }
                    ]
                }).then(callback);
            };
            $scope.errorWS = function (msg) {
                var callback = false;
                var filterMsg = msg;
                $scope.hideLoading();
                if (msg) {
                    if (msg.indexOf('Error logging in') > -1) {
                        filterMsg = "Tidak mengenali user, silakan login kembali.";
                        callback = $scope.doLogout;
                    } else if (msg.indexOf('On Hand Quantity') > -1) {
                        filterMsg = "Stok Produk sudah ada di Gudang, silahkan di non aktifkan.";
                    } else if (msg.indexOf('after delete') > -1 && msg.indexOf('M_Product') > -1) {
                        filterMsg = "Produk sudah ada transaksi, silahkan di non aktifkan.";
                    } else if (msg.indexOf('after delete') > -1 && msg.indexOf('C_BPartner') > -1) {
                        filterMsg = "Partner sudah ada transaksi, silahkan di non aktifkan.";
                    } else if (msg.indexOf('duplicate key value') > -1 && msg.indexOf('M_Product') > -1) {
                        filterMsg = 'Kode produk sudah ada, silahkan ganti kode produk.';
                    } else if (msg.indexOf('duplicate key value') > -1 && msg.indexOf('C_BPartner') > -1) {
                        filterMsg = 'Kode partner sudah ada, silahkan ganti kode partner.';
                    } else if (msg.indexOf('PeriodClosed') > -1) {
                        filterMsg = "Periode Akuntasi Closed, silahkan ganti tanggal transaksi.";
                    } else if (msg.indexOf('Product is not on PriceList') > -1) {
                        filterMsg = "Produk belum memiliki harga, silakan atur harga di halaman 'Produk'.";
                    } else if (msg.indexOf('IllegalStateException') > -1) {
                        filterMsg = "Status transaksi tidak dapat dirubah.";
                    } else if (msg.indexOf('Invalid int') > -1) {
                        filterMsg = 'Data tidak boleh kosong. Silahkan isi data terlebih dahulu.';
                    }
                }
                $scope.showAlert('Operasi ke server gagal!<br/><small><i>' + filterMsg + '</i></small>', callback);
            };
            $scope.showLoading = function () {
                $ionicLoading.show({
                    template: 'Loading...'
                });
            };
            $scope.hideLoading = function () {
                $ionicLoading.hide();
            };
            $scope.initModals = function (scope) {
                $ionicModal.fromTemplateUrl('template/modal/product-modal.html', {
                    scope: scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    scope.productModal = modal;
                });
                $ionicModal.fromTemplateUrl('template/modal/checkout-modal.html', {
                    scope: scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    scope.checkoutModal = modal;
                });
                $ionicModal.fromTemplateUrl('template/modal/acc-modal.html', {
                    scope: scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    scope.accModal = modal;
                });
                $ionicModal.fromTemplateUrl('template/modal/transbank-modal.html', {
                    scope: scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    scope.transBankModal = modal;
                });
            };
            $scope.showProduct = function (scope) {
                scope.productModal.show();
                scope.isIdle = false;
            };
            $scope.hideProduct = function (scope) {
                scope.productModal.hide();
                scope.isIdle = true;
            };
            $scope.showAcc = function (scope) {
                scope.accModal.show();
            };
            $scope.hideAcc = function (scope) {
                scope.accModal.hide();
                if (scope.changeAcc) {
                    scope.initWs();
                }
            };
            $scope.showTransBank = function (scope) {
                scope.$parent.showLoading();
                $ws.getAccounts(function (respon) {
                    if (respon.length ===0) {
                        return scope.$parent.showAlert('Data tidak ditemukan', function() {
                            $state.transitionTo("app.payment");
                        });
                    };
                    $scope.$parent.accounts = respon;
                    scope.$parent.hideLoading();
                    scope.transBankModal.show();
                }, scope.$parent.errorWS, scope.filter);
            };
            $scope.hideTransBank = function (scope) {
                scope.transBankModal.hide();
            }
            $scope.onEnter = function (key, func, scope) {
                if (key.which === 13) {
                    func(scope);
                }
            };
            $scope.onPress = function (key, keyid, func, scope) {
                if (keyid && keyid.toString().indexOf(key.which.toString()) > -1) {
                    func(scope);
                }
            };
            $scope.goBack = function () {
                if ($ionicHistory.backView()) {
                    $ionicHistory.goBack();
                } else {
                    var cur = $ionicHistory.currentView();
                    if (cur.stateName === 'app.transform') {
                        return $state.transitionTo("app.trans", {type: cur.stateParams.type});
                    } else if (cur.stateName === 'app.inventoryform') {
                        return $state.transitionTo("app.inventory");
                    } else {
                        return $state.transitionTo("app.pos");
                    }
                }
            };
            $scope.goDenied = function () {
                $scope.hideLoading();
                console.log('Access denied!');
                $scope.noBack();
                if ($scope.isOwner()) {
                    $scope.activeMenu = 1;
                    return $state.transitionTo("app.pos");
                } else if ($scope.isOperator()) {
                    $scope.activeMenu = 1;
                    return $state.transitionTo("app.pos");
                } else if ($scope.isInventor()) {
                    $scope.activeMenu = 3;
                    return $state.transitionTo("app.transform", {type: $scope.PURCHASE, act: $scope.CREATE, id: 0});
                } else {
                    $scope.doLogout();
                }

            };
            $scope.noBack = function () {
//                $scope.$on('$ionicView.afterLeave', function () {
//                    $ionicHistory.clearHistory();
//                });
            };
            $scope.searchNav = function () {
                var cur = $ionicHistory.currentView();
                if (cur.stateName === 'app.transform') {
                    return $state.transitionTo("app.trans", {type: cur.stateParams.type});
                } else if (cur.stateName === 'app.inventoryform') {
                    return $state.transitionTo("app.inventory");
                } else if (cur.stateName === 'app.partnerform') {
                    return $state.transitionTo("app.partner");
                } else if (cur.stateName === 'app.productform') {
                    return $state.transitionTo("app.product");
                }
            };
            $scope.delaySet = function (delayed, time) {
                $timeout(delayed, time || 100);
            };

//            IMAGE HANDLING
            $scope.checkImagedata = function (data) {
                var size = data ? (data.length - 814) / 1300 : 10000;
                if (data.substring(0, 10) !== 'data:image' || size > 2000) {
                    $scope.showAlert("Hanya file dalam format Gambar (.JPG/.PNG) dan kurang dari 2 MB");
                    return null;
                } else {
                    return data;
                }
            };
            $scope.initImage = function (id, success) {
                if (!$scope.isNative()) {
                    var fileInput = document.getElementById(id);
                    if (fileInput) {
                        document.getElementById(id).onchange = function () {
                            var f = document.getElementById(id).files;
                            if (f.length > 0) {
                                var r = new FileReader();
                                r.onloadend = function (e) {
                                    success($scope.checkImagedata(e.target.result));
                                };
                                r.onerror = function (msg) {
                                    $scope.showAlert(msg);
                                };
                                r.readAsDataURL(f[0]);
                            }
                        };
                    }
                }
            };
            $scope.getImage = function (scope, id) {
                navigator.camera.getPicture(
                        function (source) {
                            scope.imageReady($scope.checkImagedata("data:image/jpeg;base64," + source), id);
                        },
                        function (msg) {
                            if (msg !== 'Selection cancelled.') {
                                $scope.showAlert(msg);
                            }
                        },
                        {
                            quality: 50,
                            destinationType: navigator.camera.DestinationType.DATA_URL,
                            sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
                        });
            };
            $scope.getCamera = function (scope, id) {
                navigator.camera.getPicture(
                        function (source) {
                            scope.imageReady($scope.checkImagedata("data:image/jpeg;base64," + source), id);
                        },
                        function (msg) {
                            if (msg !== 'Camera cancelled.') {
                                $scope.showAlert(msg);
                            }
                        },
                        {
                            quality: 50,
                            destinationType: navigator.camera.DestinationType.DATA_URL,
                            sourceType: navigator.camera.PictureSourceType.CAMERA
                        });
            };
            $scope.getBarcode = function (scope, id) {
                if (cordova && cordova.plugins) {
                    cordova.plugins.barcodeScanner.scan(
                            function (result) {
                                $scope.delaySet(function () {
                                    scope.search.keyword = result.text;
                                    $scope.searchPos(scope);
                                });
                            },
                            function (error) {
                                $scope.showAlert(error);
                            }
                    );
                }
            };
            $scope.forceNumber = function (obj, ind) {
                if (obj && obj[ind]) {
                    obj[ind] = $scope.parseNumber(obj[ind]);
                }
            };
            $scope.parseNumber = function (val) {
                if (!val) {
                    return 0;
                }
                return isNaN(val) ? Number(val.replace(/\D/g, '')) : Number(val);
            };

//          STATUS ROLE
            $scope.isDraft = function (stat) {
                return stat ? $scope.STATUSES[0].id.toLowerCase().indexOf(stat.toLowerCase()) > -1 : false;
            };
            $scope.isComplete = function (stat) {
                return stat ? $scope.STATUSES[1].id.toLowerCase().indexOf(stat.toLowerCase()) > -1 || $scope.STATUSES[3].id.toLowerCase().indexOf(stat.toLowerCase()) > -1 : false;
            };
            $scope.isVoid = function (stat) {
                return stat ? $scope.STATUSES[2].id.toLowerCase().indexOf(stat.toLowerCase()) > -1 : false;
            };
            $scope.isMovement = function (type) {
                return type ? type.toLowerCase().indexOf('pindah') > -1 : false;
            };
            $scope.isStockIn = function (type) {
                return type ? type.toLowerCase().indexOf('masuk') > -1 : false
            };
            $scope.isStockOut = function (type) {
                return type ? type.toLowerCase().indexOf('keluar') > -1 : false
            };
            $scope.isOpname = function (type) {
                return type ? type.toLowerCase().indexOf('opname') > -1 : false;
            };
            $scope.isOwner = function () {
                return $scope.user.rolename ? $scope.user.rolename.toLowerCase().indexOf('owner') > -1 : false;
            };
            $scope.isOperator = function () {
                return $scope.user.rolename ? $scope.user.rolename.toLowerCase().indexOf('operasional') > -1 : false;
            };
            $scope.isInventor = function () {
                return $scope.user.rolename ? $scope.user.rolename.toLowerCase().indexOf('inventory') > -1 : false;
            };
            $scope.isRetur = function (type) {
//                for payment purpose, for transaction use isRMA
                return type ? type.toLowerCase().indexOf('retur') > -1 : false;
            };
            $scope.isVendor = function (type) {
                return type ? type.toLowerCase().indexOf('vendor') > -1 : false;
            };

            $scope.initAllProducts = function (scope, page, complete) {
                $ws.getProducts(function (respon, maxpage) {
                    scope.products = scope.products.concat(respon);
                    page++;
                    if (page > maxpage) {
                        $scope.hideLoading();
                        if (complete) {
                            complete(page);
                        }
                    } else {
                        $scope.initAllProducts(scope, page, complete);
                    }
                }, $scope.errorWS, {page: page, idWarehouse: $scope.user.WarehouseID, qty: '!= 0', purchaseprice: '!= 0', stocked: true});
            };
            $scope.initAllProductsMaster = function (scope, page, complete, filter) {
                filter = filter ? filter : {};
                filter.page = page;
                if (!filter.noWarehouse) {
                    filter.idWarehouse = $scope.user.WarehouseID;
                }
                $ws.getProductsMaster(function (respon, maxpage) {
                    scope.products = scope.products.concat(respon);
                    page++;
                    if (page > maxpage) {
                        $scope.hideLoading();
                        if (complete) {
                            complete(page);
                        }
                    } else {
                        $scope.initAllProductsMaster(scope, page, complete, filter);
                    }
                }, $scope.errorWS, filter);
            };
            $scope.initAllPartners = function (scope, page, complete, bpGroup, noLoading) {
                $ws.getPartners(function (respon, maxpage) {
                    scope.partners = scope.partners.concat(respon);
                    page++;
                    if (page > maxpage) {
                        if (!noLoading) {
                            $scope.hideLoading();
                        }
                        if (complete) {
                            complete(page);
                        }
                    } else {
                        $scope.initAllPartners(scope, page, complete, bpGroup, noLoading);
                    }
                }, $scope.errorWS, {page: page, bpGroup: bpGroup, status: true});
            };
            $scope.initAllDetails = function (scope, page, ws, complete, filter) {
                filter.page = page;
                ws(function (respon, maxpage) {
                    if (page === 0) {
                        scope.details = [];
                    }
                    scope.details = scope.details.concat(respon);
                    page++;
                    if (page > maxpage) {
                        complete(scope.details);
                    } else {
                        $scope.initAllDetails(scope, page, ws, complete, filter);
                    }
                }, $scope.$parent.errorWS, filter);
            };
            $scope.initAllWarehousesUser = function (scope, page, complete) {
                var filter = filter ? filter : {};
                filter.idUser = $scope.user.idUser;
                filter.page = page;
                $ws.getWarehousesUser(function (respon, maxpage) {
                    if (page === 0) {
                        scope.warehouses = [];
                    }
                    scope.warehouses = scope.warehouses.concat(respon);
                    page++;
                    if (page > maxpage) {
                        complete(scope.warehouses);
                    } else {
                        $scope.initAllWarehousesUser(scope, page, complete);
                    }
                }, $scope.$parent.errorWS, filter);
            };

            $scope.searchPos = function (scope) {
                scope.result = [];
                var amount = 1;
                var key = scope.search.keyword;
                if (scope.search.keyword.indexOf('*') > -1) {
                    var tmps = scope.search.keyword.split('*');
                    amount = Number(tmps[0]);
                    key = tmps[1];
                }

                if (key < 1 || !isNaN(key)) {
                    return;
                }

                var keys = key.split(' ');
                for (var i in scope.products) {
                    var match = 0;
                    for (var k in keys) {
                        if (scope.products[i].name.toLowerCase().indexOf(keys[k].toLowerCase()) > -1 || scope.products[i].code.toLowerCase() === keys[k].toLowerCase()) {
                            match++;
                            if (match >= keys.length && scope.result.indexOf(scope.products[i]) < 0) {
                                scope.products[i].tmpAmount = amount;
                                scope.result.push(scope.products[i]);
                            }
                        }
                    }
                }
            };
            $scope.addProductPOS = function (scope) {
                if (scope.result.length > 0) {
                    var tmp = scope.result[0];
                    $scope.addChart(scope, tmp);
                }
            };
            $scope.searchProductModal = function (scope) {
                scope.filtered = [];
                var key = scope.search.filter;
                $scope.showLoading();
                var filter = {
                    page: 0,
                    maxpage: 0,
                    name: key,
                    code: key
                };
                var cur = $ionicHistory.currentView();
                if ((cur.stateName === 'app.transform' && cur.stateParams.type === $scope.PURCHASE) || cur.stateName === 'app.inventoryform') {
                    if (cur.stateName === 'app.inventoryform') {
                        filter.purchaseprice = '!= 0';
                        filter.idWarehouse = $scope.user.WarehouseID;
                    }
                    $ws.getProductsMaster(function (respon, maxpage) {
                        scope.filtered = respon;
                        filter.page = 1;
                        filter.maxpage = maxpage;
                        $scope.hideLoading();
                    }, $scope.errorWS, filter);
                } else {
                    filter.qty = '!= 0';
                    filter.idWarehouse = $scope.user.WarehouseID;
                    filter.purchaseprice = '!= 0';
                    filter.stocked = true;
                    $ws.getProducts(function (respon, maxpage) {
                        scope.filtered = respon;
                        filter.page = 1;
                        filter.maxpage = maxpage;
                        $scope.hideLoading();
                    }, $scope.errorWS, filter);
                }


            };
            $scope.clearSearch = function (scope) {
                scope.search.filter = "";
                scope.search.keyword = "";
                scope.search.filterPartner = "";
                scope.search.resultPartner = [];
                scope.result = [];
                scope.$parent.result = [];
                scope.filtered = [];
                scope.$parent.filtered = [];
            };
            $scope.addChart = function (scope, product) {
                var id = -1;
                for (var i in scope.chart) {
                    if (product.id === scope.chart[i].id) {
                        id = i;
                        break;
                    }
                }
                if (id < 0) {
                    product.price = product[scope.varPrice];
                    product.amount = Number(product.tmpAmount) || 1;
                    if (scope.trans && scope.trans.tax) {
                        product.rate = scope.trans.tax.rate;
                        product.tax = scope.trans.tax.name;
                        product.idTax = scope.trans.tax.id;
                    }
                    scope.chart.push(product);
                } else {
                    scope.chart[id].amount = Number(scope.chart[id].amount) + Number(product.tmpAmount) || 1;
                }
                scope.calculateChart();
                $scope.clearSearch(scope);
                $scope.hideProduct(scope);
            };
            $scope.searchPartnerOff = function (scope) {
                if (scope.search) {
                    scope.search.isDate = true;
                }
                scope.search.resultPartner = [];
                var key = scope.search.filterPartner;
                if (key.length < 1) {
                    return;
                }
                for (var i in scope.partners) {
                    var keys = key.split(' ');
                    for (var k in keys) {
                        if (scope.partners[i].name.toLowerCase().indexOf(keys[k].toLowerCase()) > -1) {
                            if (scope.search.resultPartner.indexOf(scope.partners[i]) < 0) {
                                scope.search.resultPartner.push(scope.partners[i]);
                            }
                            break;
                        }
                    }
                }
            };
            $scope.selectPartner = function (scope, partner) {
                scope.trans.idPartner = partner.id;
                scope.trans.partner = partner.name;
                $scope.clearSearch(scope);
                if (scope.search) {
                    $timeout(function () {
                        scope.search.isDate = false;
                    }, 1000);

                }
            };
            $scope.clearPartner = function (scope) {
                scope.trans.idPartner = null;
                scope.trans.partner = '';
                $scope.clearSearch(scope);
            };

            $scope.toggleForm = function (scope, state) {
                scope.search.isForm = state;
                if (state === false && scope.initWs) {
                    return scope.initWs();
                }
            };
            $scope.toggleAcc = function (scope, state) {
                scope.search.isAcc = state;
            };
            $scope.togglePrice = function (scope, product) {
                product.tmpPrice = product.price || 0;
                scope.showPrice = true;
            };
            $scope.changePrice = function (scope, product) {
                product.price = isNaN(product.tmpPrice) ? 0 : product.tmpPrice;
                scope.showPrice = false;
                scope.calculateChart();
            };
            $scope.changeTax = function (scope) {
                for (var i in scope.taxes) {
                    if (scope.taxes[i].id === scope.trans.idTax) {
                        scope.trans.tax = scope.taxes[i];
                        break;
                    }
                }
                if (scope.trans.details) {
                    for (var i in scope.trans.details) {
                        scope.trans.details[i].rate = scope.trans.tax.rate;
                        scope.trans.details[i].tax = scope.trans.tax.name;
                        scope.trans.details[i].idTax = scope.trans.tax.id;
                    }
                }
            };
            $scope.removeChart = function (scope, product) {
                scope.chart.splice(scope.chart.indexOf(product), 1);
                scope.calculateChart();
            };

            $scope.printReceipt = function (scope, trans) {
                if (!$scope.user.setting) {
                    $scope.updateLogin(false, {
                        printFormat: $scope.isNative() ? $scope.PRINT_STRUK : $scope.PRINT_NOTA,
                        printer: $scope.isNative() ? $scope.PRINT_MOBILE : $scope.PRINT_WIRELESS
                    });
                }
                var data = $scope.user.setting.printFormat === $scope.PRINT_STRUK ? $scope.getStruk(scope, trans) : $scope.getNota(scope, trans);
                var dataUrl = $scope.BASEPATH + 'ws/print64/' + btoa(data);
                if ($scope.isNative()) {
                    $scope.printNative({data: data, dataUrl: dataUrl, format: $scope.user.setting.printFormat, printer: $scope.user.setting.printer})
                } else {
                    if ($scope.user.setting.printFormat === $scope.PRINT_STRUK) {
                        var tab = window.open("data:text/plain;base64," + btoa(data), "_blank");
                    } else {
                        var tab = window.open(dataUrl, '_blank');
                    }
                    if (!tab || tab.closed || typeof tab.closed == 'undefined')
                    {
                        return false;
                    } else {
                        tab.focus();
                        tab.print();
                    }
                }
                return true;
            };
            $scope.getStruk = function (scope, trans) {
                var nl = '\n';
                var date = trans.date || new Date();
                var dateStr = date.toJSON().substr(0, 10) + ' ' + date.toTimeString().substr(0, 8);
                var str = nl;
                str += sprintf("%s", $scope.user.warehouse) + nl;
                str += sprintf("%s", $scope.user.address) + nl;
                str += sprintf("%'=32s", nl);
                str += sprintf("%s%2s%s", 'No. Trans', ':', trans.code) + nl;
                str += sprintf("%s%4s%s", 'Tanggal', ':', dateStr) + nl;
                str += sprintf("%s%6s%s", 'Kasir', ':', $scope.user.user) + nl;
                str += sprintf("%s%3s%s", 'Customer', ':', trans.partner || 'Standard') + nl;
                str += sprintf("%'-32s", nl);
                str += sprintf("%s", nl);
                for (var i in trans.details) {
                    var item = trans.details[i];
                    var price = item[scope.varPrice] || item.price;
                    var totalStr = toCurrency(item.amount * price);
                    var priceStr = toCurrency(price);
                    str += sprintf('%s. %4s', (parseInt(i) + 1), item.name) + nl;
                    str += sprintf('%4sx%-11s%15s', item.amount, priceStr, totalStr) + nl;
                }
                str += sprintf("%11s%'-21s", '', nl);
                var tax = trans.tax.rate * trans.total / 100;
                var method = trans.method === $scope.$parent.C_CASH ? 'Cash' : (trans.method === $scope.$parent.C_DEBIT ? 'Debit' : 'Kredit');
                trans.cash = trans.cash || trans.totalPaid;
                str += sprintf("%-12s%s%18s", 'Total Harga', ':', toCurrency(trans.total)) + nl;
                str += sprintf("%-12s%s%18s", trans.tax.name, ':', toCurrency(tax)) + nl;
                str += sprintf("%-12s%s%18s", 'Grand Total', ':', toCurrency(trans.total + tax)) + nl;
                str += nl;
                str += sprintf("%s", 'Type Pembayaran') + nl;
                str += sprintf("-%8s%22s", method, toCurrency(trans.cash)) + nl;
                str += sprintf("%'=31s", '') + nl;
                str += sprintf("%4s%'*6s%s%'*6s", '', '', ' ' + trans.details.length + ' item(s) ', '') + nl;
                str += sprintf('%21s', 'TERIMA KASIH') + nl;
                str += sprintf('%s', 'Barang Yang Sudah Dibeli Tidak') + nl;
                str += sprintf('%s', 'Dapat Ditukar Atau Dikembalikan') + nl + nl + nl + nl + nl;
                return str;
            };
            $scope.getNota = function (scope, trans) {
                var date = trans.date || new Date();
                var dateStr = date.toJSON().substr(0, 10) + ' ' + date.toTimeString().substr(0, 8);

                var type = trans.isSales ? 'PENJUALAN' : 'PEMBELIAN';
                var str = sprintf(
                        "%s;;%s;;%s;;%s;;%s;;%s;;%s;;",
                        $scope.user.warehouse,
                        $scope.user.address,
                        'FAKTUR ' + type,
                        trans.code,
                        $scope.user.user,
                        dateStr,
                        trans.partner || 'Standard'
                        );
                var tmps = [];
                for (var i in trans.details) {
                    var item = trans.details[i];
                    var price = item[scope.varPrice] || item.price;
                    tmps.push(
                            sprintf(
                                    "%s&&%s&&%s&&%s&&%s&&",
                                    item.code, item.name, item.amount, toCurrency(price), toCurrency(item.amount * price)
                                    )
                            );
                }
                str += tmps.join('::');
                var tax = trans.tax.rate * trans.total / 100;
                trans.cash = trans.cash || trans.totalPaid;
                str += sprintf(
                        ";;%s;;%s;;%s;;%s;;%s;;%s;;%s;;%s",
                        trans.details.length,
                        toCurrency(trans.total),
                        trans.tax.name,
                        trans.tax.rate + ' %',
                        toCurrency(tax),
                        toCurrency(trans.total + tax),
                        toCurrency(trans.cash),
                        toCurrency(trans.cash - trans.total - tax)
                        );
                return str;
            };
            $scope.printNative = function (data) {
                var printError = function () {
                    $scope.showAlert('Tidak dapat menemukan printer.');
                };
                var printRespon = function () {

                };
                var doPrintToMobile = function (data) {
                    cordova.plugins.Printer.printToMobile(data, printRespon, printError);
                }
                if ($scope.user.setting.printer === $scope.PRINT_WIRELESS) {
//                    if(parseFloat(device.version) < 4.4){
//                        $scope.showAlert("Wireless Printer hanya untuk Android versi 4.4 (KITKAT) ke atas, versi Android Anda "+cordova.version+".")
//                        return false;
//                    }
                    cordova.plugins.Printer.printToWireless(data, printRespon, printError);
                } else {
                    cordova.plugins.Printer.statusMobile(function (respon) {
                        if (respon.status) {
                            doPrintToMobile(data);
                        } else {
                            if (respon.code === 2) {
                                cordova.plugins.Printer.openBluetooth(function (respon) {
                                    $scope.showLoading();
                                    $timeout(function () {
                                        $scope.hideLoading();
                                        cordova.plugins.Printer.connectMobile(function (respon) {
                                            doPrintToMobile(data);
                                        }, printError);
                                    }, 5000)
                                }, printError);
                            } else if (respon.code === 3) {
                                cordova.plugins.Printer.connectMobile(function (respon) {
                                    doPrintToMobile(data);
                                }, printError);
                            } else {
                                $scope.showAlert(respon.message);
                            }
                        }
                    }, printError);
                }
            };

            $scope.deleteTrans = function (trans) {
                $scope.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.showLoading();
                        $ws.deleteTrans(trans, function (respon) {
                            $scope.hideLoading();
                            $scope.showNotif($scope.DELETE, $scope.goBack);
//                            return $state.transitionTo('app.trans', {type: trans.isSales ? $scope.SALES : $scope.PURCHASE});
                        }, $scope.errorWS);
                    }
                });
            };
            $scope.deleteInventory = function (trans) {
                $scope.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.showLoading();
                        var onRespon = function (respon) {
                            $scope.hideLoading();
                            $scope.showNotif($scope.DELETE, $scope.goBack);
//                            return $state.transitionTo("app.inventory");
                        };
                        if ($scope.isMovement(trans.type)) {
                            $ws.deleteMovement(trans, onRespon, $scope.errorWS);
                        } else {
                            $ws.deleteInventory(trans, onRespon, $scope.errorWS);
                        }
                    }
                });
            };
            $scope.init();
        })

        .controller('LoginCtrl', function ($scope, $state, $ionicLoading, $ionicPopup, $timeout, $ws, CONFIG) {
            var showAlert = function (msg) {
                $ionicPopup.alert({
                    title: 'Peringatan',
                    template: msg
                });
            };
            var errorWS = function (err) {
                $ionicLoading.hide();
                $scope.state.loginLoading = false;
                var msg = err;
                if (err && err.indexOf('org not allowed for this role') > -1) {
                    msg = "Login gagal.<br/>Silakan pilih lokasi sesuai user Anda.";
                } else if (err && err.indexOf('Invalid') > -1) {
                    msg = "Field harus diisi semua.";
                }
                showAlert(msg);
            };
            var findArr = function (id, arr) {
                for (var i in arr) {
                    if (arr[i].id === id) {
                        return arr[i].name;
                    }
                }
            };
            $scope.init = function () {
                $scope.CONFIG = CONFIG;
                $scope.haserror = false;
                $scope.hassubmit = false;
                $scope.clients = [];
                $scope.warehouses = [];
                $scope.servers = [
                    {id: 'http://103.5.50.107:8000/', name: 'Dev Server'},
                    {id: 'http://103.5.50.109:8000/', name: 'Prod Server'}
                ];
                $scope.state = {
                    loginReady: false,
                    loginLoading: false,
                    server: $ws.getServer()
                };
                $scope.user = {
                    username: '',
                    password: '',
                    idClient: '',
                    idWarehouse: ''
                };
            };
            $scope.initWs = function () {
                $scope.init();
                $ws.getClients(function (respon) {
                    $scope.clients = respon.data;
                    $timeout(function () {
                        $scope.state.loginReady = true;
                    }, 1000);
                }, errorWS);
            };
            $scope.changeClient = function () {
                $ionicLoading.show({
                    template: 'Loading...'
                });
                $ws.getWarehousesLogin(function (respon) {
                    $scope.warehouses = respon.data;
                    $scope.user.idWarehouse = "";
                    $ionicLoading.hide();
                }, errorWS, $scope.user.idClient);
            };
            $scope.changeServer = function () {
                $ws.setServer($scope.state.server);
                for (var i = 0; i < $scope.servers.length; i++) {
                    if ($scope.servers[i].id === $scope.state.server) {
                        $ws.setServerName($scope.servers[i].name);
                    }
                }
                $ionicLoading.show({
                    template: 'Loading...'
                });
                $ws.getClients(function (respon) {
                    $scope.clients = respon.data;
                    $scope.user.idClient = "";
                    $scope.user.idWarehouse = "";
                    $scope.warehouses = [];
                    $ionicLoading.hide();
                }, errorWS);
            };
            $scope.login = function (form) {
                $scope.hassubmit = true;
                if (form.$valid) {
                    $scope.state.loginLoading = true;
                    $scope.user.client = findArr($scope.user.idClient, $scope.clients);
                    $scope.user.warehouse = findArr($scope.user.idWarehouse, $scope.warehouses);
                    $ws.getRole(function (respon) {
                        if (respon.data) {
                            $scope.user.role = respon.data;
                            var role = respon.data;
                            $ws.login($scope.user, function (respon) {
                                if (respon) {
                                    return $ws.getWarehousesUser(function (respon) {
                                        if (respon.length === 0) {
                                            $scope.state.loginLoading = false;
                                            showAlert('Login gagal.<br/>Silakan pilih lokasi sesuai user Anda.');
                                        } else {
                                            if (role.rolename.toLowerCase().indexOf('inventory') > -1) {
                                                $scope.activeMenu = 3;
                                                return $state.transitionTo("app.transform", {type: 'purchase', act: 'create', id: 0});
                                            } else {
                                                $state.transitionTo('app.pos');
                                            }
                                            $scope.user = {};
                                        }
                                    }, errorWS, {idUser: role.iduser, idWarehouse: $scope.user.idWarehouse.split('-')[0]})

                                } else {
                                    $scope.state.loginLoading = false;
                                    showAlert('Username atau password salah!');
                                }
                            }, errorWS);
                        } else {
                            $scope.state.loginLoading = false;
                            showAlert('Username atau password salah!');
                        }
                    }, errorWS, $scope.user);
                }
            };

            $scope.init();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.initWs();
            });
        })

        .controller('PosCtrl', function ($scope, $ws) {
            $scope.init = function () {
                if (!$scope.$parent.isOwner() && !$scope.$parent.isOperator()) {
                    $scope.readySearch = false;
                    return $scope.$parent.goDenied();
                }

                $scope.products = [];
                $scope.banks = [];
                $scope.banksCash = [];
                $scope.chart = [];
                $scope.result = [];
                $scope.filtered = [];
                $scope.taxes = [];
                $scope.isCheckout = false;
                $scope.isIdle = true;
                $scope.hidePurchase = true;
                $scope.readySearch = true;
                $scope.varPrice = 'salesprice';
                $scope.trans = {details: [], cash: 0, total: 0, method: $scope.$parent.C_CASH, tax: {}};
                $scope.search = {
                    keyword: "",
                    filter: ""
                };
            };
            $scope.initWs = function () {
                $scope.init();
                $scope.$parent.showLoading();
                $ws.getPOSBanks(function (respon) {
                    $scope.banksCash = respon;
                    $scope.banks = [];
                    for (var i in $scope.banksCash) {
                        if ($scope.banksCash[i].name.toLowerCase().indexOf('cash') !== 0) {
                            $scope.banks.push($scope.banksCash[i]);
                        }
                    }
                    $ws.getTaxes(function (respon) {
                        $scope.taxes = respon;
                        $scope.trans.tax = $scope.taxes.length > 0 ? $scope.taxes[0] : {};
                        $scope.trans.idTax = $scope.trans.tax.id;
                        $scope.$parent.initAllProducts($scope, 0);
                    }, $scope.$parent.errorWS);
                }, $scope.$parent.errorWS, $scope.$parent.user);

            };
            $scope.showCheckout = function () {
                if ($scope.trans.details.length === 0) {
                    return $scope.$parent.showAlert('Tambahkan produk.');
                }
                for (var i in $scope.trans.details) {
                    if ($scope.trans.details[i].amount < 1) {
                        return $scope.$parent.showAlert('Jumlah barang tidak boleh kosong.');
                    }
                    if (!$scope.trans.details[i].price || Number($scope.trans.details[i].price) === 0) {
                        return $scope.$parent.showAlert("Produk '" + $scope.trans.details[i].name + "' belum memiliki harga, silakan atur harga di halaman 'Produk'.");
                    }
                }
                $scope.checkoutModal.show();
                $scope.isIdle = false;
                $scope.isCheckout = true;
            };
            $scope.hideCheckout = function () {
                $scope.checkoutModal.hide();
                $scope.isCheckout = false;
                $scope.isIdle = true;
            };

            $scope.changeMethodPOS = function () {

                $scope.$parent.delaySet(function () {
                    $scope.trans.idBank = $scope.banks.length > 0 ? $scope.banks[0].id : null;
                });
            };
            $scope.payCheckout = function () {
                if (!$scope.$parent.isOwner() && !$scope.$parent.isOperator()) {
                    return $scope.$parent.goDenied();
                }

                if (isNaN($scope.trans.cash)) {
                    $scope.trans.cash = 0;
                }
                if ($scope.trans.cash === 0 || $scope.trans.cash < ($scope.trans.tax.rate * $scope.trans.total / 100 + $scope.trans.total)) {
                    return $scope.$parent.showAlert('Tunai tidak cukup.');
                }

                if ($scope.trans.method === $scope.$parent.C_CASH) {
                    for (var i in $scope.banksCash) {
                        if ($scope.banksCash[i].name.toLowerCase().indexOf('cash') > -1 && $scope.banksCash[i].name.toLowerCase().indexOf($scope.$parent.user.warehouse.toLowerCase()) > -1) {
                            $scope.trans.idBank = $scope.banksCash[i].id;
                            break;
                        }
                    }
                }
                if (!$scope.trans.idBank || $scope.trans.idBank === '') {
                    return $scope.$parent.showAlert('Bank dengan nama CASH ' + $scope.$parent.user.warehouse + ' tidak ditemukan.');
                }
                $scope.$parent.showLoading();
                $ws.createPOS($scope.trans, function (respon) {
                    $scope.$parent.hideLoading();
                    $scope.hideCheckout();
                    if ($scope.$parent.printReceipt($scope, $scope.trans)) {
                        $scope.$parent.showPrint($scope, $scope.trans, function () {
                            $scope.clearChart();
                        });
                    } else {
                        $scope.$parent.showAlert('Silakan ijinkan pop-up untuk mencetak nota secara langsung atau pilih "Cetak" setalah notifikasi ini.', function () {
                            $scope.$parent.showPrint($scope, $scope.trans, function () {
                                $scope.clearChart();
                            });
                        });
                    }
                }, $scope.$parent.errorWS);
            };
            $scope.calculateChart = function () {
                $scope.trans.total = 0;
                for (var i in $scope.chart) {
                    if ($scope.chart[i].amount && isNaN($scope.chart[i].amount)) {
                        $scope.chart[i].amount = $scope.$parent.parseNumber($scope.chart[i].amount);
                    }
                    if ($scope.chart[i].isStocked && $scope.$parent.parseNumber($scope.chart[i].amount) > $scope.$parent.parseNumber($scope.chart[i].qty)) {
                        $scope.$parent.showAlert('Jumlah (' + $scope.chart[i].amount + ') "' + $scope.chart[i].name + '" melebihi stok (' + $scope.chart[i].qty + ').');
                        $scope.chart[i].amount = $scope.$parent.parseNumber($scope.chart[i].qty);
                    }
                    if ($scope.chart[i].tmpPrice && isNaN($scope.chart[i].tmpPrice)) {
                        $scope.chart[i].tmpPrice = $scope.$parent.parseNumber($scope.chart[i].tmpPrice);
                    }
                    $scope.trans.total += Number($scope.chart[i].amount) * Number($scope.chart[i].price);
                }
                $scope.trans.details = $scope.chart;
            };
            $scope.clearChart = function () {
                $scope.chart = [];
                $scope.calculateChart();
                $scope.trans = {details: [], idBank: null, cash: 0, total: 0, method: $scope.$parent.C_CASH, tax: {}};
                $scope.$parent.delaySet(function () {
                    $scope.trans.tax = $scope.taxes.length > 0 ? $scope.taxes[0] : {};
                    $scope.trans.idTax = $scope.trans.tax.id;
                });
            };

            $scope.$parent.initModals($scope);
            $scope.init();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.$parent.useSearch = false;
                if ($scope.readySearch) {
                    $scope.initWs();
                }
            });


        })

        .controller('TransCtrl', function ($scope, $stateParams, $ws) {
//            TODO: partner need reload on new item
            $scope.init = function () {
                if (!$scope.$parent.isOwner() &&
                        (
                                ($scope.$parent.isOperator() && $stateParams.type !== $scope.$parent.SALES) ||
                                ($scope.$parent.isInventor() && $stateParams.type !== $scope.$parent.PURCHASE)
                                )
                        ) {
                    return $scope.$parent.goDenied();
                }

                $scope.params = $stateParams;
                $scope.transactions = [];
                $scope.partners = [];
                $scope.warehouses = [];
                $scope.title = $stateParams.type === $scope.$parent.SALES ? 'Daftar Penjualan' : 'Daftar Pembelian';
                $scope.partnerlabel = $stateParams.type === $scope.$parent.SALES ? 'Pelanggan' : 'Pemasok';
                $scope.filter = {
                    page: 0,
                    maxpage: 0,
//                    idWarehouse : $scope.$parent.user.WarehouseID
                };
            };
            $scope.initWs = function () {
                $scope.$parent.showLoading();
                $ws.getWarehouses(function (respon) {
                    $scope.warehouses = respon;
                    $scope.$parent.delaySet(function () {
                        $scope.filter.idWarehouse = $scope.$parent.user.WarehouseID;
                    });
                    $scope.$parent.initAllPartners($scope, 0, false, $stateParams.type === $scope.$parent.SALES ? $scope.$parent.CUSTOMER_AFF : $scope.$parent.VENDOR_AFF);
                }, $scope.$parent.errorWS);
            };
            $scope.searchTransaction = function () {
                $scope.transactions = [];
                $scope.filter.page = 0;
                $scope.filter.maxpage = 0;
                $scope.$parent.showLoading();
                var onRespon = function (respon, maxpage) {
                    $scope.transactions = respon;
                    $scope.filter.page = 1;
                    $scope.filter.maxpage = maxpage;
                    $scope.$parent.hideLoading();
                };
                if ($stateParams.type === $scope.$parent.SALES) {
                    $ws.getSales(onRespon, $scope.$parent.errorWS, $scope.filter);
                } else {
                    $ws.getPurchase(onRespon, $scope.$parent.errorWS, $scope.filter);
                }
            };
            $scope.hasMore = function () {
                return $scope.filter.page < $scope.filter.maxpage;
            };
            $scope.loadMore = function () {
                var onRespon = function (respon, maxpage) {
                    $scope.transactions = $scope.transactions.concat(respon);
                    $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                    $scope.filter.page++;
                    $scope.filter.maxpage = maxpage;
                };
                if ($stateParams.type === $scope.$parent.SALES) {
                    $ws.getSales(onRespon, $scope.$parent.errorWS, $scope.filter);
                } else {
                    $ws.getPurchase(onRespon, $scope.$parent.errorWS, $scope.filter);
                }
            };

            $scope.init();
            $scope.initWs();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.$parent.useSearch = false;
                $scope.searchTransaction();
            });
        })

        .controller('TransFormCtrl', function ($scope, $state, $stateParams, $ws) {
            var processAcc = function (accs) {
                var noVoid = 0;
                if (accs.length <= 0) {
                    return accs;
                }
                var curId = accs[0].id;
                accs[0].isHeader = true;
                for (var i in accs) {
                    accs[i].isSales = $scope.trans.isSales;
                    if (curId !== accs[i].id) {
                        curId = accs[i].id;
                        accs[i].isHeader = true;
                    }
                    if ($scope.$parent.isComplete(accs[i].status)) {
                        noVoid++;
                    }
                }
                return [accs, noVoid];
            };

            $scope.init = function () {
                if (!$scope.$parent.isOwner() &&
                        (
                                ($scope.$parent.isOperator() && $stateParams.type !== $scope.$parent.SALES) ||
                                ($scope.$parent.isInventor() && $stateParams.type !== $scope.$parent.PURCHASE)
                                )
                        ) {
                    $scope.readySearch = false;
                    return $scope.$parent.goDenied();
                }

                $scope.partners = [];
                $scope.warehouses = [];
                $scope.products = [];
                $scope.taxes = [];
                $scope.details = [];
                $scope.result = [];
                $scope.filtered = [];
                $scope.chart = [];
                $scope.bpPOS = null;
                $scope.showPrice = false;
                $scope.forceUpdate = false;
                $scope.noAcc = false;
                $scope.changeAcc = false;
                $scope.readySearch = true;
                $scope.hidePurchase = $stateParams.type === $scope.$parent.SALES;
                $scope.search = {
                    keyword: "",
                    filter: "",
                    filterPartner: "",
                    resultPartner: [],
                    isAcc: false,
                    isDate: false,
                    isForm: $stateParams.act === $scope.$parent.CREATE || $stateParams.act === $scope.$parent.UPDATE
                };
                $scope.filter = {
                    page: 0,
                    maxpage: 0,
                    idTrans: $stateParams.id
                };
                $scope.trans = $stateParams.act === $scope.$parent.CREATE ? {total: 0, date: new Date(), paid: 0, details: [], accs: []} : {};

                $scope.varPrice = $stateParams.type === $scope.$parent.SALES ? 'salesprice' : 'purchaseprice';
                $scope.partnerlabel = $stateParams.type === $scope.$parent.SALES ? 'Pelanggan' : 'Pemasok';
                $scope.params = $stateParams;
                if ($stateParams.act === $scope.$parent.CREATE) {
                    $scope.title = $stateParams.type === $scope.$parent.SALES ? 'Penjualan Baru' : 'Pembelian Baru';
                } else {
                    $scope.title = $stateParams.type === $scope.$parent.SALES ? 'Transaksi Penjualan' : 'Transaksi Pembelian';
                }
            };
            $scope.initWs = function () {
                $scope.init();
                $scope.$parent.showLoading();
                $ws.getTaxes(function (respon) {
                    $scope.taxes = respon;
                    if ($stateParams.act !== $scope.$parent.CREATE) {
                        $ws.getPartnerPOS(function (respon) {
                            $scope.bpPOS = respon;
                            var onRespon = function (respon) {
                                $scope.trans = respon.length > 0 ? respon[0] : false;

                                if (!$scope.trans) {
                                    $scope.$parent.hideLoading();
                                    return $scope.$parent.showAlert('Data tidak ditemukan.', function () {
                                        $state.transitionTo('app.trans', {type: $stateParams.type});
                                    });
                                } else {
                                    var onResponDet = function (respon) {
                                        var tmpTot = 0;
                                        var tmpAcc = 0;
                                        for (var i in respon) {
                                            respon[i].amountAcc = false;
                                            tmpTot += parseInt(respon[i].amount);
                                            tmpAcc += parseInt(respon[i].amountDelivered);
                                            if (respon[i].amount !== respon[i].amountDelivered) {
                                                respon[i].amountAcc = respon[i].amount - respon[i].amountDelivered;
                                            } else {
                                                respon[i].amountAcc = false;
                                            }
                                        }
                                        if (tmpAcc >= tmpTot) {
                                            $scope.noAcc = true;
                                        }
                                        $scope.chart = respon;
                                        $scope.trans.details = respon;
                                        $scope.trans.oldDetails = respon.slice();
                                        if ($scope.trans.details.length > 0) {
                                            var det = $scope.trans.details[0];
                                            $scope.trans.idTax = det.idTax;
                                            $scope.trans.tax = {id: det.idTax, name: det.tax, rate: det.rate};
                                        }
                                        $ws.getAccs(function (respon) {
                                            var tmpAcc = processAcc(respon);
                                            var noVoid = tmpAcc[1];
                                            $scope.trans.accs = tmpAcc[0];
                                            if ($stateParams.type === $scope.$parent.SALES) {
                                                $scope.$parent.initAllProducts($scope, 0);
                                            } else {
                                                $scope.$parent.initAllProductsMaster($scope, 0);
                                            }
//                                            replaced by status_bayar
//                                            if (parseInt($scope.trans.totalPaid || 0) >= parseInt($scope.trans.total) && (noVoid > 0 || $scope.noAcc) && $scope.$parent.isComplete($scope.trans.status)) {
//                                                $scope.trans.statusPaid = 'LUNAS';
//                                            } else if (parseInt($scope.trans.totalPaid || 0) < parseInt($scope.trans.total) && (noVoid > 0 || $scope.noAcc) && $scope.$parent.isComplete($scope.trans.status)) {
//                                                $scope.trans.statusPaid = 'BELUM LUNAS';
//                                            } else {
//                                                $scope.trans.statusPaid = '-';
//                                            }

                                            $scope.$parent.initAllPartners($scope, 0, function () {
                                                var tmp = $scope.trans.idPartner;
                                                $scope.trans.idPartner = null;
                                                $scope.$parent.delaySet(function () {
                                                    $scope.trans.idPartner = tmp;
                                                });
                                            }, $stateParams.type === $scope.$parent.SALES ? $scope.$parent.CUSTOMER_AFF : $scope.$parent.VENDOR_AFF, true);
                                        }, $scope.$parent.errorWS, {idTrans: $scope.trans.id});

                                        $scope.calculateChart();
                                    };
                                    $scope.$parent.initAllDetails(
                                            $scope,
                                            0,
                                            ($stateParams.type === $scope.$parent.SALES) ? $ws.getSalesDetails : $ws.getPurchaseDetails,
                                            onResponDet,
                                            {idTrans: $stateParams.id}
                                    );
                                }
                            };
                            if ($stateParams.type === $scope.$parent.SALES) {
                                $ws.getSales(onRespon, $scope.$parent.errorWS, {id: $stateParams.id, page: 0});
                            } else {
                                $ws.getPurchase(onRespon, $scope.$parent.errorWS, {id: $stateParams.id, page: 0});
                            }
                        }, $scope.$parent.errorWS);
                    } else {
                        $scope.$parent.delaySet(function () {
                            $scope.trans.tax = $scope.taxes.length > 0 ? $scope.taxes[0] : {};
                            $scope.trans.idTax = $scope.trans.tax.id;
                        });
                        $ws.getNextTrans($stateParams.type, function (respon) {
                            $scope.trans.code = respon.data;
                            if ($stateParams.type === $scope.$parent.SALES) {
                                $scope.$parent.initAllProducts($scope, 0);
                            } else {
                                $scope.$parent.initAllProductsMaster($scope, 0, false, {noWarehouse: true});
                            }
                            $scope.$parent.initAllPartners($scope, 0, false, $stateParams.type === $scope.$parent.SALES ? $scope.$parent.CUSTOMER_AFF : $scope.$parent.VENDOR_AFF, true);
                        }, $scope.$parent.errorWS);
                    }
                }, $scope.$parent.errorWS);
            };
            $scope.submitTrans = function (form) {
                if (form.$valid && $scope.trans.idPartner) {
                    if ($scope.trans.details.length === 0) {
                        return $scope.$parent.showAlert('Tambahkan produk.');
                    }
                    for (var i in $scope.trans.details) {
                        if ($scope.trans.details[i].amount < 1) {
                            return $scope.$parent.showAlert('Jumlah barang tidak boleh kosong.');
                        }
                        if (!$scope.trans.details[i].price || Number($scope.trans.details[i].price) === 0) {
                            return $scope.$parent.showAlert("Produk '" + $scope.trans.details[i].name + "' belum memiliki harga, silakan atur harga di halaman 'Produk'.");
                        }
                    }
                    $scope.$parent.showLoading();
                    if ($scope.$parent.isComplete($scope.trans.status)) {
                        $scope.createAcc();
                    } else if ($stateParams.act === $scope.$parent.CREATE) {
                        $scope.trans.idWarehouse = $scope.$parent.user.WarehouseID;
                        $scope.createTrans();
                    } else {
                        $scope.updateTrans();
                    }
                } else {
                    $scope.$parent.showAlertEmpty();
                }
            };
            $scope.submitSuccess = function (act, respon) {
                $scope.$parent.hideLoading();
                var onRespon = function () {
                    if (act === $scope.$parent.UPDATE || act === $scope.$parent.VIEW || (act === $scope.$parent.COMPLETE && $stateParams.type === $scope.$parent.PURCHASE)) {
                        $scope.initWs();
                    } else if (act === $scope.$parent.CREATE) {
                        return $state.transitionTo("app.transform", {type: $stateParams.type, act: $scope.$parent.VIEW, id: $scope.trans.id});
                    } else {
                        return $state.transitionTo("app.trans", {type: $stateParams.type});
                    }
                };
                if (act === $scope.$parent.COMPLETE && $stateParams.type === $scope.$parent.SALES) {
                    $scope.$parent.showConfirm(null, function (res) {
                        if (res) {
                            return $state.transitionTo("app.payment");
                        } else {
                            onRespon();
                        }
                    }, {
                        title: 'Konfirmasi',
                        template: 'Anda ingin langsung melakukan pembayaran?',
                        buttons: [
                            {
                                text: 'Tidak',
                                onTap: function () {
                                    return false;
                                }
                            },
                            {
                                text: 'Bayar',
                                type: 'button-positive',
                                onTap: function () {
                                    return true;
                                }
                            }
                        ]
                    });
                } else {
                    $scope.$parent.showNotif(act, onRespon);
                }
            };
            $scope.createTrans = function () {
                if ($stateParams.type === $scope.$parent.SALES) {
                    $ws.createSales($scope.trans, function (respon) {
                        $scope.submitSuccess($stateParams.act, respon);
                    }, $scope.$parent.errorWS);
                } else {
                    $ws.createPurchase($scope.trans, function (respon) {
                        $scope.submitSuccess($stateParams.act, respon);
                    }, $scope.$parent.errorWS);
                }

            };
            $scope.updateTrans = function (act) {
                var onRespon = function (respon) {
                    if (act === $scope.$parent.COMPLETE) {
                        $scope.completeTrans();
                    } else {
                        $scope.submitSuccess($stateParams.act, respon);
                    }
                }
                if ($stateParams.type === $scope.$parent.SALES) {
                    $ws.updateSales($scope.trans, onRespon, $scope.$parent.errorWS);
                } else {
                    $ws.updatePurchase($scope.trans, onRespon, $scope.$parent.errorWS);
                }
            };
            $scope.completeTrans = function () {
                $scope.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.$parent.showLoading();
                        if ($scope.forceUpdate) {
                            $scope.forceUpdate = false;
                            $scope.updateTrans($scope.$parent.COMPLETE);
                        } else {
                            $ws.completeTrans($scope.trans, function (respon) {
                                $scope.submitSuccess($scope.$parent.COMPLETE);
                            }, $scope.$parent.errorWS);
                        }
                    }
                });
            };
            $scope.cancelTrans = function () {
                $scope.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.$parent.showLoading();
                        var onRespon = function (respon) {
                            $scope.submitSuccess($scope.$parent.CANCEL);
                        };
                        if ($scope.trans.partner === 'Standard') {
                            $ws.cancelPOS($scope.trans, onRespon, $scope.$parent.errorWS);
                        } else {
                            if ($scope.trans.isSales) {
                                $ws.getPaymentDetails(function (respon) {
                                    if (respon.length > 0) {
                                        $scope.$parent.hideLoading();
                                        $scope.$parent.showAlert('Order sudah dibayar.');
                                    } else {
                                        $ws.cancelTrans($scope.trans, onRespon, $scope.$parent.errorWS);
                                    }
                                }, $scope.$parent.errorWS, {idTrans: $scope.trans.id});
                            } else {
                                $ws.getAccs(function (respon) {
                                    var can = true;
                                    if (respon.length > 0) {
                                        for (var i in respon) {
                                            if ($scope.$parent.isComplete(respon[i].status)) {
                                                can = false;
                                                break;
                                            }
                                        }
                                    }
                                    if (can) {
                                        $ws.cancelTrans($scope.trans, onRespon, $scope.$parent.errorWS);
                                    } else {
                                        $scope.$parent.hideLoading();
                                        $scope.$parent.showAlert('Gagal. Order sudah diterima.');
                                    }
                                }, $scope.$parent.errorWS, {idTrans: $scope.trans.id});
                            }
                        }
                    }
                });
            };
            $scope.createAcc = function () {
                var countNol = 0;
                var countRcp = 0;
                var nega = false;
                for (var i in $scope.trans.details) {
                    if ($scope.trans.details[i].amountAcc && $scope.$parent.parseNumber($scope.trans.details[i].amountAcc) <= 0) {
                        countNol++;
                    } else {
                        countNol--;
                    }
                    if ($scope.trans.details[i].amount === $scope.trans.details[i].amountDelivered) {
                        countRcp++;
                    }
                    if ($scope.trans.details[i].amountAcc && $scope.$parent.parseNumber($scope.trans.details[i].amountDelivered) + $scope.$parent.parseNumber($scope.trans.details[i].amountAcc) > $scope.$parent.parseNumber($scope.trans.details[i].amount)) {
                        nega = true;
                    }
                }
                if (countNol > 0 || nega || countRcp === $scope.trans.details.length) {
                    $scope.$parent.hideLoading();
                    return $scope.$parent.showNotif('Tidak ada penerimaan baru atau penerimaan melebihi pesanan.');
                }
                $ws.createAcc($scope.trans, function (respon) {
                    $scope.submitSuccess($scope.$parent.UPDATE, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.cancelAcc = function (acc) {

                $scope.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        var doCancel = function () {
                            $ws.cancelAcc(acc, function (respon) {
                                acc.status = 'VOID';
                                $scope.changeAcc = true;
                                $scope.$parent.hideAcc($scope);
                            }, $scope.$parent.errorWS);
                        };
                        $scope.$parent.showLoading();
                        if (acc.idInvoice) {
                            $ws.getPaymentDetails(function (respon) {
                                if (respon.length > 0) {
                                    $scope.$parent.hideLoading();
                                    $scope.$parent.showAlert('Gagal. Order sudah dibayar.');
                                } else {
                                    doCancel();
                                }
                            }, $scope.$parent.errorWS, {idInvoice: acc.idInvoice});
                        } else {
                            doCancel();
                        }
                    }
                });
            };
            $scope.createRMA = function (acc) {

                var rmas = [];
                for (var i in $scope.trans.accs) {
                    var tmp = $scope.$parent.parseNumber($scope.trans.accs[i].amount) - $scope.$parent.parseNumber($scope.trans.accs[i].rma);
                    if ($scope.trans.accs[i].id === acc.id && $scope.trans.accs[i].isForm && $scope.$parent.parseNumber($scope.trans.accs[i].amountRma) <= tmp && $scope.$parent.parseNumber($scope.trans.accs[i].amountRma) > 0) {
                        rmas.push($scope.trans.accs[i]);
                    }
                }
                if (rmas.length === 0) {
                    return $scope.$parent.showAlert('Jumlah retur tidak boleh kosong.');
                } else {
                    $scope.$parent.showLoading();
                    $ws.createRMA($scope.trans, rmas, function (respon) {
                        $scope.$parent.hideLoading();
                        $scope.$parent.showNotif($scope.$parent.UPDATE, $scope.searchAcc);
                    }, $scope.$parent.errorWS);
                }
            };

            $scope.toggleRMA = function (acc, stat) {
                for (var i in $scope.trans.accs) {
                    if ($scope.trans.accs[i].id === acc.id) {
                        var tmp = $scope.$parent.parseNumber($scope.trans.accs[i].amount) - $scope.$parent.parseNumber($scope.trans.accs[i].rma);
                        $scope.trans.accs[i].isForm = stat && tmp > 0;
                        $scope.trans.accs[i].amountRma = 0;
                    }
                }
            };
            $scope.isRMA = function (acc) {
                var res = $scope.bpPOS && $scope.trans.idPartner !== $scope.bpPOS.id;
                for (var i in $scope.trans.accs) {
                    if ($scope.trans.accs[i].id === acc.id) {
                        var tmp = $scope.$parent.parseNumber($scope.trans.accs[i].amount) - $scope.$parent.parseNumber($scope.trans.accs[i].rma);
                        res = res && tmp > 0;
                    }
                }
                return res;
            };
            $scope.calculateRMA = function () {
                for (var i in $scope.trans.accs) {
                    if ($scope.trans.accs[i].isForm) {
                        var tmp = $scope.$parent.parseNumber($scope.trans.accs[i].amount) - $scope.$parent.parseNumber($scope.trans.accs[i].rma);
                        if ($scope.$parent.parseNumber($scope.trans.accs[i].amountRma) > tmp) {
                            $scope.$parent.showAlert('Retur (' + $scope.trans.accs[i].amountRma + ') "' + $scope.trans.accs[i].name + '" melebihi sisa penerimaan (' + tmp + ').');
                            $scope.trans.accs[i].amountRma = tmp;
                        }
                    }
                }
            };
            $scope.calculateAcc = function () {
                for (var i in $scope.trans.details) {
                    if ($scope.trans.details[i].amountAcc && $scope.$parent.parseNumber($scope.trans.details[i].amountDelivered) + $scope.$parent.parseNumber($scope.trans.details[i].amountAcc) > $scope.$parent.parseNumber($scope.trans.details[i].amount)) {
                        var rcp = $scope.$parent.parseNumber($scope.trans.details[i].amount) - $scope.$parent.parseNumber($scope.trans.details[i].amountDelivered);
                        $scope.$parent.showAlert('Penerimaan (' + $scope.chart[i].amountAcc + ') "' + $scope.chart[i].name + '" melebihi sisa pesanan (' + rcp + ').');
                        $scope.trans.details[i].amountAcc = rcp;
                    }
                }
            };
            $scope.calculateChart = function () {
                $scope.forceUpdate = false;
                $scope.trans.details = $scope.chart;
                $scope.trans.total = 0;
                for (var i in $scope.chart) {
                    if ($scope.chart[i].amount && isNaN($scope.chart[i].amount)) {
                        $scope.chart[i].amount = $scope.$parent.parseNumber($scope.chart[i].amount);
                    }
                    if ($scope.chart[i].isStocked && ($scope.$parent.isDraft($scope.trans.status) || !$scope.trans.status) && $scope.chart[i].amount && $scope.chart[i].qty && $stateParams.type === $scope.$parent.SALES && $scope.$parent.parseNumber($scope.chart[i].amount) > $scope.$parent.parseNumber($scope.chart[i].qty)) {
                        $scope.$parent.showAlert('Jumlah (' + $scope.chart[i].amount + ') "' + $scope.chart[i].name + '" melebihi stok (' + $scope.chart[i].qty + ').');
                        $scope.chart[i].amount = $scope.$parent.parseNumber($scope.chart[i].qty);
                        $scope.forceUpdate = true;
                    }
                    if ($scope.chart[i].tmpPrice && isNaN($scope.chart[i].tmpPrice)) {
                        $scope.chart[i].tmpPrice = $scope.$parent.parseNumber($scope.chart[i].tmpPrice);
                    }
                    $scope.trans.total += Number($scope.chart[i].amount) * Number($scope.chart[i].price);
                }
            };
            $scope.clearChart = function () {
                $scope.chart = [];
                $scope.calculateChart();
            };
            $scope.searchAcc = function () {
                $scope.filter.page = 0;
                $scope.filter.maxpage = 0;
                $scope.trans.accs = [];
                $scope.$parent.showLoading();
                $scope.filter.warehouse = $scope.search.filter;
                $scope.filter.name = $scope.search.filter;
                $scope.filter.docRcp = $scope.search.filter;
                $scope.filter.status = $scope.search.filter;
                $ws.getAccs(function (respon, maxpage) {
                    $scope.trans.accs = processAcc(respon)[0];
                    $scope.filter.page++;
                    $scope.filter.maxpage = maxpage;
                    $scope.$parent.hideLoading();
                }, $scope.$parent.errorWS, $scope.filter);
            };
            $scope.hasMoreAcc = function () {
                return $scope.readySearch ? $scope.filter.page < $scope.filter.maxpage : false;
            };
            $scope.loadMoreAcc = function () {
                $ws.getInvoices(function (respon, maxpage) {
                    $scope.trans.accs = processAcc($scope.trans.accs.concat(respon))[0];
                    $scope.filter.page++;
                    $scope.filter.maxpage = maxpage;
                    $scope.$parent.hideLoading();
                }, $scope.$parent.errorWS, $scope.filter);
            };

            $scope.$parent.initModals($scope);
            $scope.init();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.$parent.useSearch = true;
                if ($scope.readySearch) {
                    var tmp = $ws.getCache();
                    if (tmp && tmp.name === $scope.$parent.PARTNER) {
                        $scope.partners.push(tmp.data);
                        $scope.$parent.clearPartner($scope);
                        $scope.$parent.delaySet(function () {
                            $scope.$parent.selectPartner($scope, tmp.data);
                        });
                    } else {
                        $scope.initWs();
                    }
                }
            });
        })

        .controller('InventoryCtrl', function ($scope, $ws) {
            $scope.init = function () {
                if (!$scope.$parent.isOwner() && !$scope.$parent.isInventor()) {
                    return $scope.$parent.goDenied();
                }
                $scope.warehouses = [];
                $scope.locations = [];
                $scope.types = [];
                $scope.transactions = [];
                $scope.filter = {
                    page: 0,
                    maxpage: 0,
//                    idWarehouse : $scope.$parent.user.WarehouseID
                };
            };
            $scope.initWs = function () {
                $scope.$parent.showLoading();
                $ws.getInvWarehouses(function (respon) {
                    $scope.warehouses = respon;
                    $scope.locations = respon;
                    $scope.$parent.delaySet(function () {
                        $scope.filter.idWarehouse = $scope.$parent.user.WarehouseID;
                    });
                    $ws.getInvTypes(function (respon) {
                        $scope.types = respon;
                        $scope.$parent.hideLoading();
                    }, $scope.$parent.errorWS);
                }, $scope.$parent.errorWS);
            };
            $scope.searchInventory = function () {
                $scope.transactions = [];
                $scope.filter.page = 0;
                $scope.filter.maxpage = 0;
                $scope.$parent.showLoading();
                $ws.getInventories(function (respon, maxpage) {
                    $scope.transactions = respon;
                    $scope.filter.page = 1;
                    $scope.filter.maxpage = maxpage;
                    $scope.$parent.hideLoading();
                }, $scope.$parent.errorWS, $scope.filter);
            };
            $scope.hasMore = function () {
                return $scope.filter.page < $scope.filter.maxpage;
            };
            $scope.loadMore = function () {
                $ws.getInventories(function (respon, maxpage) {
                    $scope.transactions = $scope.transactions.concat(respon);
                    $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                    $scope.filter.page++;
                    $scope.filter.maxpage = maxpage;
                }, $scope.$parent.errorWS, $scope.filter);
            };

            $scope.init();
            $scope.initWs();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.searchInventory();
                $scope.$parent.useSearch = false;
            });
        })

        .controller('InventoryFormCtrl', function ($scope, $state, $stateParams, $ws) {
            var onRespon = function (respon) {
                if (respon.length > 0 && respon[0].id) {
                    if ($scope.$parent.isStockIn($scope.trans.type)) {
                        for (var i in respon) {
                            respon[i].amount = Math.abs(respon[i].amount);
                        }
                    }
                    $scope.chart = respon;
                    $scope.trans.details = respon;
                    $scope.trans.oldDetails = respon.slice();
                    $scope.trans.idWarehouse = respon[0].idWarehouse;
                    $scope.trans.idLocation = respon[0].idLocation;
                    $scope.trans.idCharge = respon[0].idCharge;
                    for (var i in $scope.charges) {
                        if ($scope.charges[i].idCharge === $scope.trans.idCharge) {
                            $scope.trans.charge = $scope.charges[i].charge;
                            break;
                        }
                    }
                    if ($scope.$parent.isMovement($scope.trans.type)) {
                        $scope.trans.warehouse = respon[0].warehouse;
                        $scope.trans.location = respon[0].location;
                    }
                } else {
                    $scope.chart = [];
                    $scope.trans.details = [];
                    $scope.trans.oldDetails = [];
                }
                $scope.$parent.initAllProductsMaster($scope, 0, false, {purchaseprice: '!= 0'});
            };

            $scope.init = function () {
                if (!$scope.$parent.isOwner() && !$scope.$parent.isInventor()) {
                    $scope.readySearch = false;
                    return $scope.$parent.goDenied();
                }
                $scope.readySearch = true;
                $scope.$parent.useSearch = true;
                $scope.warehouses = [];
                $scope.types = [];
                $scope.locations = [];
                $scope.products = [];
                $scope.details = [];
                $scope.result = [];
                $scope.filtered = [];
                $scope.chart = [];
                $scope.charges = [];
                $scope.params = $stateParams;
                $scope.title = $stateParams.act === $scope.$parent.CREATE ? 'Inventory Baru' : 'Transaksi Inventory';
                $scope.search = {
                    keyword: "",
                    filter: "",
                    isForm: $stateParams.act === $scope.$parent.UPDATE || $stateParams.act === $scope.$parent.CREATE
                };
                $scope.trans = $stateParams.act === $scope.$parent.CREATE ? {date: new Date(), details: []} : false;

            };
            $scope.initWs = function () {
                $scope.init();
                $scope.$parent.showLoading();
                $scope.$parent.initAllWarehousesUser($scope, 0, function () {
                    $ws.getInvWarehouses(function (respon) {
//                        $scope.warehouses = respon;
                        $scope.locations = respon;
                        $ws.getCharges(function (respon) {
                            $scope.charges = respon;
                            $ws.getInvTypes(function (respon) {
                                $scope.types = respon;
                                $scope.$parent.delaySet(function () {
                                    $scope.trans.idWarehouse = $scope.$parent.user.WarehouseID;
                                    $scope.trans.type = $scope.types.length > 0 ? $scope.types[0].name : '';
                                    $scope.trans.idType = $scope.types.length > 0 ? $scope.types[0].id : 0;
                                    $scope.trans.idCharge = $scope.charges.length > 0 ? $scope.charges[0].idCharge : null;
                                });
                                if ($stateParams.act !== $scope.$parent.CREATE) {
                                    $ws.getInventories(function (respon) {
                                        $scope.trans = respon.length > 0 ? respon[0] : false;
                                        if (!$scope.trans) {
                                            $scope.$parent.hideLoading();
                                            return $scope.$parent.showAlert('Data tidak ditemukan.', function () {
                                                $state.transitionTo("app.inventory");
                                            });
                                        } else {
                                            $scope.typeChange();
                                            $scope.$parent.initAllDetails(
                                                    $scope,
                                                    0,
                                                    $scope.$parent.isMovement($scope.trans.type) ? $ws.getMovementDetails : $ws.getInventoryDetails,
                                                    onRespon,
                                                    {idTrans: $stateParams.id}
                                            );
                                        }
                                    }, $scope.$parent.errorWS, {id: $stateParams.id, page: 0});
                                } else {
                                    $ws.getNextInv($scope.trans.type, function (respon) {
                                        $scope.trans.code = respon.data;
                                        $scope.$parent.initAllProductsMaster($scope, 0, false, {purchaseprice: '!= 0'});
                                    }, $scope.$parent.errorWS)
                                }
                            }, $scope.$parent.errorWS);
                        }, $scope.$parent.errorWS);
                    }, $scope.$parent.errorWS);
                });
            };
            $scope.submitInventory = function (form) {
                if (form.$valid) {
                    if ($scope.trans.details.length === 0) {
                        $scope.$parent.showAlert('Tambahkan produk.');
                        return;
                    }
                    if ($stateParams.act === $scope.$parent.CREATE) {
                        if ($scope.$parent.isMovement($scope.trans.type)) {
                            $scope.$parent.showLoading();
                            $scope.createMovement();
                        } else {
                            if ($scope.$parent.isOpname($scope.trans.type)) {
                                $scope.showConfirm('Regenerate akan menghapus data saat ini, Anda yakin?', function (res) {
                                    if (res) {
                                        $scope.$parent.showLoading();
                                        $scope.createInventory();
                                    }
                                });
                            } else {
                                $scope.$parent.showLoading();
                                $scope.createInventory();
                            }
                        }
                    } else {
                        $scope.$parent.showLoading();
                        if ($scope.$parent.isMovement($scope.trans.type)) {
                            $scope.updateMovement();
                        } else {
                            $scope.updateInventory();
                        }
                    }
                } else {
                    $scope.$parent.showAlertEmpty();
                }
            };
            $scope.submitSuccess = function (act, respon) {
                $scope.$parent.hideLoading();
                $scope.$parent.showNotif(act, function () {
                    if ($scope.$parent.isOpname($scope.trans.type) && (act === $scope.$parent.UPDATE || act === $scope.$parent.VIEW)) {
                        return $state.transitionTo("app.inventoryform", {act: $scope.$parent.VIEW, id: $scope.trans.id});
                    } else if (act === $scope.$parent.UPDATE || act === $scope.$parent.VIEW) {
                        $scope.initWs();
                    } else if (act === $scope.$parent.CREATE) {
                        if ($scope.$parent.isOpname($scope.trans.type)) {
                            return $state.transitionTo("app.inventoryform", {act: $scope.$parent.UPDATE, id: $scope.trans.id});
                        } else {
                            return $state.transitionTo("app.inventoryform", {act: $scope.$parent.VIEW, id: $scope.trans.id});
                        }
                    } else {
                        return $state.transitionTo("app.inventory");
                    }
                });
            };
            $scope.createInventory = function () {
                $ws.createInventory($scope.trans, function (respon) {
                    $scope.submitSuccess($stateParams.act, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.createMovement = function () {
                $ws.createMovement($scope.trans, function (respon) {
                    $scope.submitSuccess($stateParams.act, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.updateInventory = function () {
                $ws.updateInventory($scope.trans, function (respon) {
                    $scope.submitSuccess($stateParams.act, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.updateMovement = function () {
                $ws.updateMovement($scope.trans, function (respon) {
                    $scope.submitSuccess($stateParams.act, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.completeInventory = function () {
                $scope.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.$parent.showLoading();
                        if ($scope.$parent.isMovement($scope.trans.type)) {
                            $ws.completeMovement($scope.trans, function (respon) {
                                $scope.submitSuccess($scope.$parent.COMPLETE);
                            }, $scope.$parent.errorWS);
                        } else {
                            $ws.completeInventory($scope.trans, function (respon) {
                                $scope.submitSuccess($scope.$parent.COMPLETE);
                            }, $scope.$parent.errorWS);
                        }
                    }
                });
            };
            $scope.cancelInventory = function () {
                $scope.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.$parent.showLoading();
                        if ($scope.$parent.isMovement($scope.trans.type)) {
                            $ws.cancelMovement($scope.trans, function (respon) {
                                $scope.submitSuccess($scope.$parent.CANCEL);
                            }, $scope.$parent.errorWS);
                        } else {
                            $ws.cancelInventory($scope.trans, function (respon) {
                                $scope.submitSuccess($scope.$parent.CANCEL);
                            }, $scope.$parent.errorWS);
                        }
                    }
                });
            };
            $scope.generateOpname = function (trans) {
                $scope.showConfirm('Regenerate akan menghapus data saat ini, Anda yakin?', function (res) {
                    if (res) {
                        $scope.$parent.showLoading();
                        $ws.createOpnameDetails(trans, function (respon) {
                            $scope.submitSuccess($scope.$parent.UPDATE, respon);
                        }, $scope.$parent.errorWS);
                    }
                });
            };

            $scope.typeChange = function () {
                if ($scope.$parent.isOpname($scope.trans.type)) {
                    $scope.clearChart();
                }
                for (var i in $scope.types) {
                    if ($scope.types[i].name === $scope.trans.type) {
                        $scope.trans.idType = $scope.types[i].id;
                        break;
                    }
                }
                $scope.trans.code = $ws.getNextInv($scope.trans.type, $scope.trans.code);
                $scope.calculateChart();
            };
            $scope.calculateChart = function () {
                for (var i in $scope.chart) {
                    if ($scope.chart[i].amount && isNaN($scope.chart[i].amount)) {
                        $scope.chart[i].amount = $scope.$parent.parseNumber($scope.chart[i].amount);
                    }
                    if (($scope.$parent.isMovement($scope.trans.type) || $scope.$parent.isStockOut($scope.trans.type)) && $scope.$parent.parseNumber($scope.chart[i].amount) > $scope.$parent.parseNumber($scope.chart[i].qty)) {
                        $scope.$parent.showAlert('Jumlah (' + $scope.chart[i].amount + ') "' + $scope.chart[i].name + '" melebihi stok (' + $scope.chart[i].qty + ').');
                        $scope.chart[i].amount = $scope.$parent.parseNumber($scope.chart[i].qty);
                    }
                }
                $scope.trans.details = $scope.chart;
            };
            $scope.clearChart = function () {
                $scope.chart = [];
                $scope.calculateChart();
            };

            $scope.$parent.initModals($scope);
            $scope.init();
            $scope.$on('$ionicView.enter', function (e) {
                if ($scope.readySearch) {
                    $scope.initWs();
                }
            });
        })

        .controller('PaymentCtrl', function ($scope, $ws) {
            $scope.init = function () {
                if (!$scope.$parent.isOwner() && !$scope.$parent.isOperator()) {
                    return $scope.$parent.goDenied();
                }
                $scope.cash = 0;
                $scope.accounts = [];
                $scope.filter = {
                    page: 0,
                    maxpage: 0,
                    keyword: "",
                    idOrg: $scope.$parent.user.OrgID
                };
            };
            $scope.initWs = function () {
                $scope.init();
                $scope.$parent.showLoading();
                $ws.getCashOnHand(function (respon) {
                    $scope.cash = respon.data.total;
                    $scope.searchAccount();
                }, $scope.$parent.errorWS);
            };
            $scope.searchAccount = function () {
                $scope.filter.page = 0;
                $scope.filter.maxpage = 0;
                $scope.accounts = [];
                $scope.$parent.showLoading();
                $ws.getAccounts(function (respon, maxpage) {
                    $scope.accounts = respon;
                    $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                    $scope.filter.page = 1;
                    $scope.filter.maxpage = maxpage;
                    $scope.$parent.hideLoading();
                }, $scope.$parent.errorWS, $scope.filter);
            };
            $scope.hasMore = function () {
                return $scope.filter.page < $scope.filter.maxpage;
            };
            $scope.loadMore = function () {
                $ws.getAccounts(function (respon, maxpage) {
                    $scope.accounts = $scope.accounts.concat(respon);
                    $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                    $scope.filter.page++;
                    $scope.filter.maxpage = maxpage;
                }, $scope.$parent.errorWS, $scope.filter);
            };

            $scope.init();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.initWs();
                $scope.$parent.useSearch = false;
            });
        })

        .controller('PaymentHistoryCtrl', function ($scope, $state, $stateParams, $ws) {
            $scope.init = function () {
                if (!$scope.$parent.isOwner() && !$scope.$parent.isOperator()) {
                    return $scope.$parent.goDenied();
                }
                $scope.$parent.useSearch = false;
                $scope.account = {details: []};
                $scope.filter = {
                    page: 0,
                    maxpage: 0,
                    id: $stateParams.id
                };
            };
            $scope.initWs = function () {
                $scope.$parent.showLoading();
                $ws.getAccounts(function (respon) {
                    if (respon.length === 0) {
                        return $scope.$parent.showAlert('Data tidak ditemukan.', function () {
                            $state.transitionTo("app.payment");
                        });
                    }
                    $scope.account = respon[0];
                    $scope.$parent.hideLoading();
                }, $scope.$parent.errorWS, $scope.filter);
            };
            $scope.searchPayment = function () {
                $scope.filter.page = 0;
                $scope.filter.maxpage = 0;
                $scope.account.details = [];
                $scope.$parent.showLoading();
                $ws.getAccountBalance(function (respon) {
                    $scope.account.balanceStart = respon.data ? Number(respon.data.total) || 0 : 0;
                    $ws.getAccountSum(function (respon) {
                        $scope.account.balanceFilter = respon.data ? Number(respon.data.total) || 0 : 0;
                        $ws.getAccountPayments(function (respon, maxpage) {
                            $scope.account.details = respon;
                            $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                            $scope.filter.page = 1;
                            $scope.filter.maxpage = maxpage;
                            $scope.$parent.hideLoading();
                        }, $scope.$parent.errorWS, $scope.filter);
                    }, $scope.$parent.errorWS, $scope.filter);
                }, $scope.$parent.errorWS, $scope.filter);

            };
            $scope.hasMore = function () {
                return $scope.filter.page < $scope.filter.maxpage;
            };
            $scope.loadMore = function () {
                $ws.getAccountPayments(function (respon, maxpage) {
                    $scope.account.details = $scope.account.details.concat(respon);
                    $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                    $scope.filter.page++;
                    $scope.filter.maxpage = maxpage;
                }, $scope.$parent.errorWS, $scope.filter);
            };

            $scope.init();
            $scope.initWs();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.$parent.useSearch = false;
                $scope.searchPayment();
            });
        })

        .controller('PaymentFormCtrl', function ($scope, $state, $stateParams, $ionicModal, $ws) {
            var tmpType;
            var processFilter = function () {
                var filter = JSON.parse(JSON.stringify($scope.filter));
                filter.dateFrom = $scope.filter.dateFrom;
                filter.dateTo = $scope.filter.dateTo;
                filter.isSales = $scope.trans.type.name.indexOf('AR') > -1 ? 'Y' : 'N';
                filter.idPartner = $scope.trans.idPartner;
                filter.idOrg = $scope.$parent.user.OrgID;
                delete filter.id;
                return filter;
            };

            $scope.init = function () {
                if (!$scope.$parent.isOwner() && !$scope.$parent.isOperator()) {
                    return $scope.$parent.goDenied();
                }
                $scope.types = [];
                $scope.partners = [];
                $scope.chart = [];
                $scope.result = [];
                $scope.pool = [];
                $scope.title = $stateParams.act === $scope.$parent.CREATE ? 'Pembayaran Baru' : 'Transaksi Pembayaran';
                $scope.isForm = $stateParams.act === $scope.$parent.CREATE || $stateParams.act === $scope.$parent.UPDATE;
                $scope.params = $stateParams;
                $scope.transNotExist = $stateParams.trans === '';
                $scope.typeNotExist = $stateParams.type === '';
                $scope.partnerNotExist = $stateParams.partner === '';
                $scope.search = {
                    filterPartner: '',
                    resultPartner: []
                };
                $scope.filter = {
                    page: 0,
                    maxpage: 0
                };
                $scope.filter[$stateParams.act === $scope.$parent.CREATE ? 'id' : 'idPayment'] = $stateParams.id;
                $scope.trans = $stateParams.act === $scope.$parent.CREATE ? {details: []} : false;
                $scope.PartnerName = '';
                $scope.dataPartner = [];
            };
            $scope.initWs = function () {
                $scope.init();
                $ionicModal.fromTemplateUrl('template/modal/invoice-modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.invoiceModal = modal;
                });
                $scope.$parent.showLoading();
                if ($stateParams.act !== $scope.$parent.CREATE) {
                    $ws.getAccountPayments(function (respon) {
                        if (respon.length === 0) {
                            return $scope.$parent.showAlert('Data tidak ditemukan.', function () {
                                $state.transitionTo("app.payment");
                            });
                        }
                        $scope.trans = respon[0];
                        $scope.trans.details = [];
                        if (!$scope.trans.idCharge) {
                            $ws.getPaymentDetails(function (respon) {
                                $scope.$parent.hideLoading();
                                $scope.trans.details = respon;
                            }, $scope.$parent.errorWS, $scope.filter);
                        } else {
                            $scope.$parent.hideLoading();
                        }

                    }, $scope.$parent.errorWS, $scope.filter);
                } else {
                    $ws.getAccounts(function (respon) {
                        if (respon.length === 0) {
                            $scope.$parent.showAlert('Data tidak ditemukan.');
                            return $state.transitionTo("app.payment");
                        }
                        $scope.trans = respon[0];
                        $scope.trans.total = 0;
                        $scope.trans.date = new Date();
                        $scope.trans.details = [];
                        $scope.trans.method = $scope.$parent.C_INVOICE;

                        if (!$scope.partnerNotExist) {
                            $ws.getTransPartners(function (respon) {
                                $scope.dataPartner = respon;
                                for (var i = $scope.dataPartner.length - 1; i >= 0; i--) {
                                    if ($scope.dataPartner[i].idPartner === $stateParams.partner) {
                                        $scope.PartnerName = $scope.dataPartner[i].partner;
                                    };
                                };
                                $scope.trans.idPartner = $stateParams.partner;
                            }, $scope.$parent.errorWS, {id: $stateParams.id});
                        };

                        $ws.getPaymentTypes(function (respon) {
                            $scope.types = respon;
                            $scope.trans.type = $scope.types.length > 0 ? $scope.types[0] : {};
                            $scope.$parent.delaySet(function () {
                                $scope.trans.idType = $scope.types.length > 0 ? $scope.types[0].id : 0;
                            });
                            $ws.getNextPayment($scope.trans.type.name, function (respon) {
                                $scope.trans.code = respon.data;
                                $scope.$parent.initAllPartners($scope, 0, false, $scope.trans.type.name.indexOf('AR') > -1 ? $scope.$parent.CUSTOMER_AFF : $scope.$parent.VENDOR_AFF);
                            }, $scope.$parent.errorWS)

                        }, $scope.$parent.errorWS);
                    }, $scope.$parent.errorWS, {id: $scope.filter.id});
                }
            };
            $scope.methodChange = function () {
                $scope.$parent.showConfirm('Mengganti jenis menghapus daftar yang sudah dimasukkan, Anda yakin?', function (res) {
                    if (res) {
                        $scope.clearChart();
                        $scope.searchInvoice();
                    } else {
                        $scope.$parent.delaySet(function () {
                            $scope.trans.method = $scope.trans.method === $scope.$parent.C_INVOICE ? $scope.$parent.C_CHARGE : $scope.$parent.C_INVOICE;
                        });
                    }
                });
            };
            $scope.typeChange = function () {
                $scope.$parent.showConfirm('Mengganti jenis menghapus daftar yang sudah dimasukkan, Anda yakin?', function (res) {
                    if (res) {
                        for (var i in $scope.types) {
                            if ($scope.types[i].id === $scope.trans.idType) {
                                $scope.trans.type = $scope.types[i];
                                break;
                            }
                        }
                        $scope.trans.code = $ws.getNextPayment($scope.trans.type.name, $scope.trans.code);
                        $scope.$parent.showLoading();
                        $scope.clearChart();
                        $scope.$parent.clearPartner($scope);
                        $scope.partners = [];
                        $scope.$parent.initAllPartners($scope, 0, false, $scope.trans.type.name.indexOf('AR') > -1 ? $scope.$parent.CUSTOMER_AFF : $scope.$parent.VENDOR_AFF);

                    } else {
                        $scope.$parent.delaySet(function () {
                            $scope.trans.idType = tmpType;
                        });
                    }
                });
            };
            $scope.typeClick = function () {
                tmpType = $scope.trans.idType;
            };
            $scope.partnerChange = function () {
                if ($scope.trans.idPartner) {
                    $scope.$parent.showConfirm('Mengganti partner menghapus daftar yang sudah dimasukkan, Anda yakin?', function (res) {
                        if (res) {
                            $scope.clearChart();
                            $scope.$parent.clearPartner($scope);
                        }
                    });
                }
            };
            $scope.clearChart = function () {
                $scope.chart = [];
                $scope.pool = [];
                $scope.trans.details = [];
                $scope.calculateChart();
            };
            $scope.calculateChart = function () {
                $scope.trans.total = 0;
                for (var i in $scope.chart) {
                    if ($scope.trans.method === $scope.$parent.C_INVOICE) {
                        if ($scope.$parent.parseNumber($scope.chart[i].rest) >= 0 && $scope.$parent.parseNumber($scope.chart[i].amount) > $scope.$parent.parseNumber($scope.chart[i].rest)) {
                            $scope.$parent.showAlert('Jumlah pembayaran (' + toCurrency($scope.chart[i].amount) + ') melebihi sisa tagihan (' + toCurrency($scope.chart[i].rest) + ').');
                            $scope.chart[i].amount = $scope.chart[i].rest;
                        }
                        $scope.trans.total += $scope.$parent.parseNumber($scope.chart[i].amount);
                    } else {
                        $scope.trans.total += $scope.$parent.parseNumber($scope.chart[i].total);
                    }
                }
                $scope.trans.details = $scope.chart;
            };

            $scope.submitPayment = function (form) {
                if (form.$valid && $scope.trans.idPartner) {
                    if ($scope.chart.length === 0) {
                        return $scope.$parent.showAlert('Tambahkan tagihan atau pembiayaan.');
                    }
                    for (var i in $scope.chart) {
                        if (($scope.trans.method !== $scope.$parent.C_INVOICE && $scope.trans.total <= 0) || ($scope.trans.method === $scope.$parent.C_INVOICE && (!$scope.chart[i].amount || ($scope.chart[i].amount && !$scope.$parent.isRetur($scope.chart[i].docOrder) && $scope.chart[i].amount <= 0)))) {
                            return $scope.$parent.showAlert('Jumlah pembayaran atau pembiayaan tidak boleh kosong.');
                        }
                    }
                    $scope.$parent.showLoading();
                    $ws.createPayment($scope.trans, function (respon) {
                        $scope.$parent.hideLoading();
                        $scope.$parent.showNotif($scope.$parent.CREATE, function () {
                            $scope.trans = {details: []};
                            return $state.transitionTo("app.payment");
                        });
                    }, $scope.$parent.errorWS);
                } else {
                    $scope.$parent.showAlertEmpty();
                }
            };
            $scope.cancelPayment = function () {
                $scope.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.$parent.showLoading();
                        $ws.cancelPayment({id: $scope.trans.idPayment}, function (respon) {
                            $scope.$parent.hideLoading();
                            $scope.$parent.showNotif($scope.$parent.UPDATE, function () {
                                return $state.transitionTo("app.paymenthistory", {id: $scope.trans.id});
                            });
                        }, $scope.$parent.errorWS);
                    }
                });
            };

            $scope.searchInvoice = function () {
                $scope.filter.pageInvoice = 0;
                $scope.filter.maxpageInvoice = 0;
                $scope.result = [];
                $scope.pool = [];
                $scope.$parent.showLoading();
                var onRespon = function (respon, maxpage) {
                    $scope.result = respon;
                    $scope.filter.pageInvoice++;
                    $scope.filter.maxpageInvoice = maxpage;
                    $scope.$parent.hideLoading();
                };
                if ($scope.trans.method === $scope.$parent.C_INVOICE) {
                    $ws.getInvoices(onRespon, $scope.$parent.errorWS, processFilter());
                } else {
                    $ws.getCharges(onRespon, $scope.$parent.errorWS, processFilter());
                }
            };
            $scope.addInvoice = function (trans) {
                if (trans.idCharge) {
                    $scope.clearChart();
                    trans.total = 0;
                    $scope.pool.push(trans);
                    $scope.addInvoices();
                    return;
                }
                if (trans.selected) {
                    trans.selected = false;
                    $scope.pool.splice($scope.pool.indexOf(trans), 1);
                } else {
                    trans.selected = true;
                    $scope.pool.push(trans);
                }
            };
            $scope.addInvoices = function () {
                var tmp = [];
                var add = false;
                for (var i in $scope.pool) {
                    add = true;
                    for (var j in $scope.chart) {
                        if ($scope.pool[i].id === $scope.chart[j].id) {
                            add = false;
                            break;
                        }
                    }
                    if (add) {
                        if ($scope.$parent.isRetur($scope.pool[i].docOrder)) {
                            $scope.pool[i].total = $scope.pool[i].total * -1;
                            $scope.pool[i].amount = $scope.pool[i].total;
                        } else {
                            $scope.pool[i].amount = 0;
                        }

                        tmp.push($scope.pool[i]);
                    }
                }
                $scope.hideInvoice();
                $scope.chart = $scope.chart.concat(tmp);
                $scope.calculateChart();
            };
            $scope.showInvoice = function () {
                if (!$scope.trans.idType || !$scope.trans.idPartner) {
                    return $scope.$parent.showNotif('Pilih partner terlebih dahulu.');
                }
                $scope.invoiceModal.show();
                $scope.searchInvoice();
            };
            $scope.hideInvoice = function () {
                $scope.invoiceModal.hide();
            };
            $scope.hasMoreInvoice = function () {
                return $scope.filter.pageInvoice < $scope.filter.maxpageInvoice;
            };
            $scope.loadMoreInvoice = function () {
                var onRespon = function (respon, maxpage) {
                    $scope.result = $scope.result.concat(respon);
                    $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                    $scope.filter.pageInvoice++;
                    $scope.filter.maxpageInvoice = maxpage;
                };
                if ($scope.trans.method === $scope.$parent.C_INVOICE) {
                    $ws.getInvoices(onRespon, $scope.$parent.errorWS, processFilter());
                } else {
                    $ws.getCharges(onRespon, $scope.$parent.errorWS, processFilter());
                }
            };

            $scope.init();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.$parent.useSearch = false;
                $scope.initWs();
            });

        })

        .controller('PartnerCtrl', function ($scope, $ws) {
            var getBpGroupByName = function (name) {
                for (var i in $scope.bpGroups) {
                    if ($scope.bpGroups[i].name === name) {
                        return $scope.bpGroups[i].id;
                    }
                }
                return null;
            };
            $scope.init = function () {
                $scope.$parent.useSearch = false;
                $scope.bpGroups = [];
                $scope.partners = [];
                $scope.readySearch = false;
                $scope.filter = {
                    status: true,
                    page: 0,
                    maxpage: 0
                };
            };
            $scope.initWs = function () {
                $scope.$parent.showLoading();
                $ws.getBPGroups(function (respon) {
                    $scope.$parent.hideLoading();
                    $scope.bpGroups = respon;
                    $scope.readySearch = true;
                    $scope.searchPartner();
                }, $scope.$parent.errorWS);
            };
            $scope.searchPartner = function () {
                if ($scope.$parent.isOperator()) {
                    $scope.filter.idBpGroup = getBpGroupByName($scope.$parent.CUSTOMER);
                } else if ($scope.$parent.isInventor()) {
                    $scope.filter.idBpGroup = getBpGroupByName($scope.$parent.VENDOR);
                }
                $scope.partners = [];
                $scope.filter.page = 0;
                $scope.filter.maxpage = 0;
                $scope.$parent.showLoading();
                $ws.getPartners(function (respon, maxpage) {
                    $scope.partners = respon;
                    $scope.filter.page = 1;
                    $scope.filter.maxpage = maxpage;
                    $scope.$parent.hideLoading();
                }, $scope.$parent.errorWS, $scope.filter);
            };
            $scope.hasMore = function () {
                return $scope.readySearch ? $scope.filter.page < $scope.filter.maxpage : false;
            };
            $scope.loadMore = function () {
                $ws.getPartners(function (respon, maxpage) {
                    $scope.partners = $scope.partners.concat(respon);
                    $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                    $scope.filter.page++;
                    $scope.filter.maxpage = maxpage;
                }, $scope.$parent.errorWS, $scope.filter);
            };

            $scope.init();
            $scope.initWs();
            $scope.$on('$ionicView.enter', function (e) {
                if ($scope.readySearch) {
                    $scope.searchPartner();
                }
                $scope.$parent.useSearch = false;
            });
        })

        .controller('PartnerFormCtrl', function ($scope, $state, $stateParams, $ws) {
            var getBpGroup = function (type) {
                for (var i in $scope.bpGroups) {
                    if (type === $scope.$parent.SALES && $scope.bpGroups[i].name === $scope.$parent.CUSTOMER) {
                        return $scope.bpGroups[i].id;
                    }
                    if (type === $scope.$parent.PURCHASE && $scope.bpGroups[i].name === $scope.$parent.VENDOR) {
                        return $scope.bpGroups[i].id;
                    }
                }
                return null;
            };
            var getBpGroupByName = function (name) {
                for (var i in $scope.bpGroups) {
                    if ($scope.bpGroups[i].name === name) {
                        return $scope.bpGroups[i].id;
                    }
                }
                return null;
            };
            var validateType = function () {
                if ($scope.$parent.isOperator()) {
                    $scope.partner.idBpGroup = getBpGroupByName($scope.$parent.CUSTOMER);
                    $scope.partner.bpGroup = $scope.$parent.CUSTOMER;
                    return true;
                } else if ($scope.$parent.isInventor()) {
                    $scope.partner.idBpGroup = getBpGroupByName($scope.$parent.VENDOR);
                    $scope.partner.bpGroup = $scope.$parent.VENDOR;
                    return true;
                }
                return false;
            };
            $scope.init = function () {
                $scope.bpGroups = [];
                $scope.params = $stateParams;
                $scope.transactions = [];
                $scope.title = $stateParams.act === $scope.$parent.CREATE ? 'Partner Baru' : 'Data Partner';
                $scope.partner = $stateParams.act === $scope.$parent.CREATE ? {} : false;
                $scope.search = {
                    isForm: $stateParams.act === $scope.$parent.UPDATE || $stateParams.act === $scope.$parent.CREATE
                };
                $scope.$parent.initImage('partner-image', $scope.imageReady);
            };
            $scope.initWs = function () {
                $scope.init();
                $scope.$parent.showLoading();
                $ws.getBPGroups(function (respon) {
                    $scope.bpGroups = respon;
                    if ($stateParams.act !== $scope.$parent.CREATE) {
                        $ws.getPartner(function (respon) {
                            respon.status = respon.isActive || respon.isActive === 'Y';
                            $scope.$parent.hideLoading();
                            if (!respon) {
                                return $scope.$parent.showAlert('Data tidak ditemukan.', function () {
                                    $state.transitionTo("app.partner");
                                });
                            }
                            if ($scope.$parent.isOperator() && respon.idBpGroup !== getBpGroupByName($scope.$parent.CUSTOMER)) {
                                return $scope.$parent.goDenied();
                            } else if ($scope.$parent.isInventor() && respon.idBpGroup !== getBpGroupByName($scope.$parent.VENDOR)) {
                                return $scope.$parent.goDenied();
                            }
                            $scope.partner = respon;
                            $ws.getTransPartners(function (respon) {
                                $scope.transactions = respon;
                            }, $scope.$parent.errorWS, {idPartner: $stateParams.id});
                        }, $scope.$parent.errorWS, {id: $stateParams.id});
                    } else {
                        $scope.$parent.delaySet(function () {
                            if (!validateType()) {
                                $scope.partner.idBpGroup = getBpGroup($stateParams.id);
                            }
                        });
                        $scope.$parent.hideLoading();
                    }
                }, $scope.$parent.errorWS);
            };
            $scope.submitPartner = function (form) {
                $scope.hassubmit = true;
                if (form.$valid) {
                    $scope.$parent.showLoading();
                    for (var i in $scope.bpGroups) {
                        if ($scope.bpGroups[i].id === $scope.partner.idBpGroup) {
                            $scope.partner.bpGroup = $scope.bpGroups[i].name;
                            break;
                        }
                    }
                    validateType();
                    if ($stateParams.act === $scope.$parent.CREATE) {
                        $scope.createPartner();
                    } else {
                        $scope.updatePartner();
                    }
                } else {
                    $scope.$parent.showAlertEmpty();
                }
            };
            $scope.submitSuccess = function (act, respon) {
                $scope.$parent.hideLoading();
                $scope.$parent.showNotif(act, function () {
                    if (act === $scope.$parent.UPDATE || act === $scope.$parent.VIEW) {
                        $scope.initWs();
                    } else if (act === $scope.$parent.DELETE) {
                        $scope.$parent.showNotif($scope.DELETE, $scope.$parent.goBack);
                    } else {
                        if ($stateParams.id === $scope.$parent.SALES || $stateParams.id === $scope.$parent.PURCHASE) {
                            $ws.setCache({name: $scope.$parent.PARTNER, data: $scope.partner});
                            return $state.transitionTo("app.transform", {type: $stateParams.id, act: $scope.$parent.CREATE, id: 0});
                        } else {
                            return $state.transitionTo("app.partner");
                        }
                    }
                });
            };
            $scope.createPartner = function () {
                $ws.createPartner($scope.partner, function (respon) {
                    return $scope.submitSuccess($scope.$parent.CREATE, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.updatePartner = function () {
                $ws.updatePartner($scope.partner, function (respon) {
                    return $scope.submitSuccess($scope.$parent.UPDATE, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.deletePartner = function () {
                $scope.$parent.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.$parent.showLoading();
                        $ws.deletePartner($scope.partner, function (respon) {
                            return $scope.submitSuccess($scope.$parent.DELETE, respon);
                        }, $scope.$parent.errorWS);
                    }
                });
            };
            $scope.imageReady = function (data) {
                $scope.partner.imageData = false;
                $scope.$parent.delaySet(function () {
                    $scope.partner.imageData = data;
                });
            };
            $scope.init();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.initWs();
            });
        })

        .controller('ProductCtrl', function ($scope, $ws) {
            $scope.init = function () {
                $scope.products = [];
                $scope.categories = [];
                $scope.warehouses = [];
                $scope.uoms = [];
                $scope.readySearch = false;
                $scope.filter = {
                    page: 0,
                    maxpage: 0,
//                    idWarehouse : $scope.$parent.user.WarehouseID
                };
            };
            $scope.initWs = function () {
                $scope.$parent.showLoading();
                $ws.getCategories(function (respon) {
                    $scope.categories = respon;
//                    $ws.getWarehouses(function (respon) {
//                        $scope.warehouses = respon;
                    $ws.getUOMType(function (respon) {
                        $scope.uoms = respon;
                        $scope.initAllWarehousesUser($scope, 0, function () {
                            $scope.$parent.delaySet(function () {
                                $scope.filter.warehouses = $scope.warehouses;
                                $scope.filter.idWarehouse = $scope.$parent.user.WarehouseID;
                                $scope.filter.idCategory = $scope.categories.length > 0 ? $scope.categories[0].id : null;
                                $scope.readySearch = true;
                                $scope.searchProduct();
                            });
//                        $scope.$parent.hideLoading();
                        });

                    }, $scope.$parent.errorWS);
//                    }, $scope.$parent.errorWS);
                }, $scope.$parent.errorWS);
            };
            $scope.searchProduct = function () {
                $scope.products = [];
                $scope.filter.page = 0;
                $scope.filter.maxpage = 0;
                $scope.$parent.showLoading();
                $ws.getProducts(function (respon, maxpage) {
                    $scope.products = respon;
                    $scope.filter.page = 1;
                    $scope.filter.maxpage = maxpage;
                    $scope.$parent.hideLoading();
                }, $scope.$parent.errorWS, $scope.filter);
            };
            $scope.hasMore = function () {
                return $scope.readySearch && $scope.filter.page < $scope.filter.maxpage;
            };
            $scope.loadMore = function () {
                $ws.getProducts(function (respon, maxpage) {
                    $scope.products = $scope.products.concat(respon);
                    $scope.$parent.$broadcast('scroll.infiniteScrollComplete');
                    $scope.filter.page++;
                    $scope.filter.maxpage = maxpage;
                }, $scope.$parent.errorWS, $scope.filter);
            };

            $scope.init();
            $scope.initWs();
            $scope.$on('$ionicView.enter', function (e) {
                if ($scope.readySearch) {
                    $scope.searchProduct();
                }
                $scope.$parent.useSearch = false;
            });
        })

        .controller('ProductFormCtrl', function ($scope, $state, $stateParams, $ws, $q, CONFIG) {
            $scope.init = function () {
                $scope.categories = [];
                $scope.uoms = [];
                $scope.transactions = [];
                $scope.product = $stateParams.act === $scope.$parent.CREATE ? {isStocked: true, isSold: true, isPurchased: true} : false;
                $scope.search = {
                    isForm: $stateParams.act === $scope.$parent.UPDATE || $stateParams.act === $scope.$parent.CREATE
                };
                $scope.params = $stateParams;
                $scope.title = $stateParams.act === $scope.$parent.CREATE ? 'Produk Baru' : 'Data Produk';
                $scope.$parent.initImage('product-image', $scope.imageReady);
            };
            $scope.initWs = function () {
                $scope.init();
                $scope.$parent.showLoading();
                $ws.getCategories(function (respon) {
                    $scope.categories = respon;
                    if (respon.length > 0) {
                        $scope.$parent.delaySet(function () {
                            $scope.product.idCategory = respon[0].id;
                        });
                    }
                    $ws.getUOMType(function (respon) {
                        $scope.uoms = respon;
                        if ($stateParams.act !== $scope.$parent.CREATE) {
                            $ws.getProduct(function (respon) {
                                $scope.product = respon;
                                $scope.$parent.hideLoading();
                                if (!$scope.product) {
                                    return $scope.$parent.showAlert('Data tidak ditemukan.', function () {
                                        $state.transitionTo("app.product");
                                    });
                                }
                                $ws.getTransProducts(function (respon) {
                                    $scope.transactions = respon;
                                }, $scope.$parent.errorWS, {id: $stateParams.id});
                            }, $scope.$parent.errorWS, {id: $stateParams.id});
                        } else {
                            $scope.$parent.hideLoading();
                        }
                    }, $scope.$parent.errorWS)
                }, $scope.$parent.errorWS);
            };
            $scope.submitProduct = function (form) {
                if (!$scope.$parent.isOwner() && !$scope.$parent.isInventor()) {
                    return $scope.$parent.goDenied();
                }
                if (form.$valid) {
                    $scope.$parent.showLoading();
                    if ($stateParams.act === $scope.$parent.CREATE) {
                        $scope.createProduct();
                    } else {
                        $scope.updateProduct();
                    }
                } else {
                    $scope.$parent.showAlertEmpty();
                }
            };
            $scope.submitSuccess = function (act, respon) {
                $scope.$parent.hideLoading();
                $scope.$parent.showNotif(act, function () {
                    if (act === $scope.$parent.UPDATE || act === $scope.$parent.VIEW) {
                        $scope.initWs();
                    } else if (act === $scope.$parent.DELETE) {
                        $scope.$parent.showNotif($scope.DELETE, $scope.$parent.goBack);
                    } else {
                        return $state.transitionTo("app.product");
                    }
                });
            };
            $scope.createProduct = function () {
                for (var i in $scope.categories) {
                    if ($scope.categories[i].id === $scope.product.idCategory) {
                        $scope.product.category = $scope.categories[i].name;
                    }
                }
                $ws.createProduct($scope.product, function (respon) {
                    return $scope.submitSuccess($scope.$parent.CREATE, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.updateProduct = function () {
                $ws.updateProduct($scope.product, function (respon) {
                    return $scope.submitSuccess($scope.$parent.UPDATE, respon);
                }, $scope.$parent.errorWS);
            };
            $scope.deleteProduct = function () {
                $scope.$parent.showConfirm('Anda yakin?', function (res) {
                    if (res) {
                        $scope.$parent.showLoading();
                        $ws.deleteProduct($scope.product, function (respon) {
                            return $scope.submitSuccess($scope.$parent.DELETE, respon);
                        }, $scope.$parent.errorWS);
                    }
                });
            };
            $scope.imageReady = function (data) {
                $scope.product.imageData = false;
                $scope.$parent.delaySet(function () {
                    $scope.product.imageData = data;
                });
            };
            $scope.printCode = function (product) {
                $scope.popUp = {};
                $scope.$parent.showInput($scope, 'Masukkan jumlah yang akan dicetak.', function (res) {
                    if (res) {
                        var url = $scope.$parent.BASEPATH + 'ws/printcode/' + $scope.$parent.user.setting.printerBarcode + '/' + product.code + '/' + res + '/' + product.name;
                        $ws.HTTP({
                            method: 'POST',
                            url: url,
                            transformResponse: function (data, headersGetter, status) {
                                return data;
                            }
                        }).then(
                                function (respon) {

                                    qz.api.setSha256Type(sha256);
                                    qz.api.setPromiseType($q);
//                                    qz.security.setCertificatePromise(function (resolve, reject) {
//                                        //Preferred method - from server
//                                        //        $.ajax("assets/signing/public-key.txt").then(resolve, reject);
//
//                                        //Alternate method 1 - anonymous
//                                        //        resolve();
//                                    });

                                    qz.websocket.connect().then(function () {
                                        return qz.printers.find($scope.$parent.user.setting.printerBarcodeName);
                                    }).then(function (printer) {
                                        var config = qz.configs.create(printer);
                                        var data = [respon.data];
                                        return qz.print(config, data).then(function () {
                                            qz.websocket.disconnect();
                                        });
                                    }).catch(function (respon) {
                                        qz.websocket.disconnect();
                                        $scope.showAlert("Printer " + $scope.$parent.user.setting.printerBarcodeName + " tidak ditemukan.", function () {
                                            var tab = window.open(url, '_blank');
                                            if (tab) {
                                                tab.focus();
                                                tab.print();
                                            }
                                        })
                                    });

                                },
                                function (respon) {
                                    $scope.$parent.errorWS('Data tidak tersedia.');
                                }
                        );
                    }
                })
            };

            $scope.init();
            $scope.$on('$ionicView.enter', function (e) {
                $scope.initWs();
            });
        })

        .controller('SettingCtrl', function ($scope, $ws) {

            $scope.init = function () {
                $scope.printers = [];
                $scope.device = $scope.$parent.isNative() ? device : false;
            };
            $scope.initWs = function () {
                $scope.init();
                $ws.getPrinterBarcode(function (respon) {
                    $scope.printers = respon;
                    $scope.$parent.initPrinterBarcode(respon);
                    $scope.$parent.delaySet(function () {
                        $scope.setting = $scope.$parent.user.setting;
                        $scope.user = {
                            idUser: $scope.$parent.user.idUser
                        };
                        $scope.$parent.updateLogin(false, $scope.setting);
                    });
                }, $scope.$parent.errorWS);
            };
            $scope.submitPassword = function (form) {
                if (form.$valid) {
                    if ($scope.user.newPassword !== $scope.user.newPasswordConfirm) {
                        return;
                    }
                    if ($scope.user.oldPassword !== $scope.$parent.user.pass) {
                        return $scope.$parent.showAlert('Password lama salah.');
                    }
                    $scope.$parent.showLoading();
                    $ws.changePassword($scope.user, function (respon) {
                        $scope.$parent.hideLoading();
                        if (respon) {
                            $scope.$parent.showNotif('Password berhasil diperbaharui, silakan login kembali.', function () {
                                $scope.$parent.doLogout();
                            });
//                            $scope.$parent.updateLogin($scope.user, false);

                        } else {
                            $scope.$parent.showAlert('Tidak dapat merubah password.');
                        }
                        $scope.init();
                    }, $scope.$parent.errorWS);
                } else {
                    $scope.$parent.showAlertEmpty();
                }
            };
            $scope.changePrinter = function () {
                for (var i = 0; i < $scope.printers.length; i++) {
                    if ($scope.printers[i].id === $scope.setting.printerBarcode) {
                        $scope.setting.printerBarcodeName = $scope.printers[i].name;
                        break;
                    }
                }
                $scope.$parent.updateLogin(false, $scope.setting);
            };

            $scope.initWs();
        });
