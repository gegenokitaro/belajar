/* global angular */

angular.module('apclient-service', ['apclient-parser', 'angular-soap'])

//        local storage
        .factory('$ls', function ($window) {
            return {
                set: function (key, value) {
                    $window.localStorage.setItem(key, value);
                },
                get: function (key, defaultValue) {
                    return $window.localStorage.getItem(key) || defaultValue;
                },
                remove: function (key) {
                    $window.localStorage.removeItem(key);
                },
                setObject: function (key, value) {
                    $window.localStorage.setItem(key, JSON.stringify(value));
                },
                getObject: function (key, defaultValue) {
                    return JSON.parse($window.localStorage.getItem(key) || defaultValue);
                }
            };
        })
//        web services
        .factory('$ws', function ($ls, $mp, $http, $soap, CONFIG) {
            var C_SESSION = CONFIG.APP_ID + '.session';
            var C_CACHE = CONFIG.APP_ID + '.cache';
            var C_SERVER = CONFIG.APP_ID + '.server';
            var C_SERVERNAME = CONFIG.APP_ID + '.servername';
            var C_SOAP;
            var C_WS;
            var getServer = function (path) {
                path = path || '';
                return $ls.get(C_SERVER, CONFIG.SERVER) + path;
            };
            var initServer = function () {
                C_SOAP = getServer(CONFIG.API_SOAP);
                C_WS = getServer(CONFIG.API_PHP);
            };
            var setServer = function (url) {
                $ls.set(C_SERVER, url);
                initServer();
            };
            var setServerName = function (name) {
                $ls.set(C_SERVERNAME, name);
            };
            var getServerName = function () {
                return $ls.get(C_SERVERNAME);
            };

            initServer();

            var loginParam = function () {
                var user = $ls.getObject(C_SESSION, null);
                delete user.warehouse;
                delete user.client;
                delete user.rolename;
                delete user.idUser;
                delete user.address;
                delete user.setting;
                return user;
            };
            var getCRUDParam = function (param, login) {
                return {
                    ModelCRUDRequest: {
                        ModelCRUD: param,
                        ADLoginRequest: login || loginParam()
                    }
                };
            };
            var getListParam = function (param) {
                return  {
                    ModelGetListRequest: {
                        ModelGetList: param,
                        ADLoginRequest: loginParam()
                    }
                };
            };
            var getDocParam = function (param) {
                return  {
                    ModelSetDocActionRequest: {
                        ModelSetDocAction: param,
                        ADLoginRequest: loginParam()
                    }
                };
            };
            var getProcessParam = function (param, attr) {
                return  {
                    ModelRunProcessRequest: {
                        ModelRunProcess_ATTR: [
                            attr,
                            param
                        ],
                        ADLoginRequest: loginParam()
                    }
                };
            };
            var prepareFilter = function (filter, map, opr) {
                if (filter) {
                    var filters = [];
                    var ors = [];
                    for (var i in map) {
                        var p = map[i].split(':');
                        var pp = p[1].split('-');
                        if (filter[p[1]] && filter[p[1]].length > 0) {
                            if (p.length > 2) {
                                if (p[2] === 'or') {
                                    ors.push("LOWER(" + p[0] + ") LIKE '%" + filter[p[1]].toLowerCase().replace(' ', '%') + "%'");
                                } else {
                                    filters.push(p[0] + p[2] + "'" + filter[p[1]] + "'");
                                }
                            } else {
                                filters.push("LOWER(" + p[0] + ") LIKE '%" + filter[p[1]].toLowerCase().replace(' ', '%') + "%'");
                            }
                        } else if (pp.length > 1) {
                            if (p.length > 2 && p[2].toLowerCase() === 'between') {
                                if (filter[pp[0]] && filter[pp[1]]) {
                                    filters.push(p[0] + " BETWEEN '" + $mp.toSQLDatetime(filter[pp[0]], true) + "' AND '" + $mp.toSQLDatetime(filter[pp[1]], true) + "'");
                                } else if (filter[pp[0]]) {
                                    filters.push(p[0] + " >= '" + $mp.toSQLDatetime(filter[pp[0]], true) + "'");
                                } else if (filter[pp[1]]) {
                                    filters.push(p[0] + " <= '" + $mp.toSQLDatetime(filter[pp[1]], true) + "'");
                                }
                            }
                        }
                    }
                    var tmp1 = filters.join(opr ? ' ' + opr + ' ' : ' AND ');
                    var tmp2 = ors.join(' OR ');
                    return ors.length > 0 && filters.length > 0 ? "(" + tmp1 + ") AND (" + tmp2 + ")" : filters.length > 0 ? tmp1 : tmp2;
                } else {
                    return "";
                }
            };
            var prepareSplitFilter = function (filter, field, def) {
                var tmp = filter[field] ? filter[field].split(' ') : [];
                var allows = '< > <= >= !=';
                if (tmp.length > 1 && allows.indexOf(tmp[0]) > -1) {
                    return [tmp[0], tmp[1]];
                } else {
                    return [def || '=', filter[field]];
                }
            };
            var prepareFieldParam = function (param) {
                var params = [];
                if (param) {
                    for (var i in param) {
                        params.push({
                            field_ATTR: [
                                "column='" + i + "'",
                                {val: param[i]}
                            ]
                        });
                    }
                }
                return params;

            };

            var getTrans = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'C_Order_ID:id:=',
                    'C_BPartner_ID:idPartner:=',
                    'DateOrdered:dateFrom-dateTo:between',
                    'DocumentNo:code',
                    'M_Warehouse_ID:idWarehouse:=',
                    'Status:status'
                ]);
                return $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryOrder', TableName: 'C_Order_V_WS', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        },
                        {
                            field_ATTR: [
                                "column='IsSOTrx'",
                                {
                                    val: filter.isSales
                                }
                            ]
                        }
                    ]
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTrans), respon.WindowTabData.QtyPages);
                }, error);
            };
            var getTransDetails = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'C_Order_ID:idTrans:='
                ]);
                return $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryOrderDetail', TableName: 'C_OrderLine_V_WS', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    ]
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTransDetail), respon.WindowTabData.QtyPages);
                }, error);
            };
            var getTransPartners = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'C_BPartner_ID:idPartner:=',
                    'IsSOTrx:isSales'
                ]);
                return $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'query_OrderByPartner', TableName: 'order_by_partner_v', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: {
                        field_ATTR: [
                            "column='IsActive'",
                            {
                                val: 'Y'
                            }
                        ]
                    }
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTransPartner), respon.WindowTabData.QtyPages);
                }, error);
            };
            var getTransProducts = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'M_Product_ID:id:='
                ]);
                return $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'querySalesbyProduct', TableName: 'sales_by_product', Filter: filterSql, Action: 'Read',
                    DataRow: {
                        field_ATTR: [
                            "column='IsActive'",
                            {
                                val: 'Y'
                            }
                        ]
                    }
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseSalesProduct));
                }, error);
            };

            var getTransType = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'Name:name'
                ]);
                $soap.post(C_SOAP, 'getList', getListParam({
                    serviceType: 'listDoctypeOrder', AD_Reference_ID: 1000011, Filter: filterSql
                })).then(function (respon) {
                    var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTransType);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };
            var getSalesType = function (success, error) {
                getTransType(success, error, {name: 'Penjualan Order'});
            };
            var getPOSType = function (success, error) {
                getTransType(success, error, {name: 'POS Order'});
            };
            var getPurchaseType = function (success, error) {
                getTransType(success, error, {name: 'Purchase Order'});
            };
            var getAccType = function (success, error) {
                var filter = {name: 'MM Receipt'};
                var filterSql = prepareFilter(filter, [
                    'Name:name'
                ]);
                $soap.post(C_SOAP, 'getList', getListParam({
                    serviceType: 'listDocTypeMaterialReceipt', AD_Reference_ID: 1000012, Filter: filterSql
                })).then(function (respon) {
                    var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTransType);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };
            var getRMAType = function (success, error) {
                return $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryRMAType', TableName: 'M_RMAType', Action: 'Read', PageNo: 0,
                    DataRow: {
                        field_ATTR: [
                            "column='IsActive'",
                            {
                                val: 'Y'
                            }
                        ]
                    }
                })).then(function (respon) {
                    var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parseRMAType);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };
            var getRMADocType = function (success, error, filter) {
                var filterSql = prepareFilter(
                        {
                            name: filter ? 'Customer' : 'Vendor'
                        }, [
                    'Name:name'
                ]);
                $soap.post(C_SOAP, 'getList', getListParam({
                    serviceType: 'listDocTypeRMA', AD_Reference_ID: 321, Filter: filterSql
                })).then(function (respon) {
                    var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTransType);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };
            var getRMASalesType = function (success, error) {
                getRMADocType({name: 'Customer'}, success, error)
            };
            var getRMAPurchaseType = function (success, error) {
                getRMADocType({name: 'Vendor'}, success, error)
            };

            var createTrans = function (trans, success, error) {
                var doCreate = function () {
                    $soap.post(C_SOAP, 'createData', getCRUDParam({
                        serviceType: 'createOrder', TableName: 'C_Order', Action: 'Create', RecordID: 0,
                        DataRow: prepareFieldParam($mp.parseTransForm(trans, true, trans.ex))
                    })).then(function (respon) {
                        trans.id = $mp.parseStandard(respon).id;
                        if (trans.details && trans.details.length === 0) {
                            return success(trans);
                        }
                        createTransDetail(trans, 0, function (respon) {
                            if (!trans.code || trans.code === '') {
                                getTrans(function (respon) {
                                    if (respon.length > 0) {
                                        trans.code = respon[0].code;
                                        trans.partner = respon[0].partner;
                                    }
                                    success(trans);
                                }, error, {id: trans.id, isSales: trans.isSales});
                            } else {
                                success(trans);
                            }
                        }, function (msg) {
                            deleteTrans(trans, function () {
                                error(msg);
                            }, error);
                        });
                    }, error);
                };
//                POS transaction
                if (trans.method) {
                    trans.ex = ['DocumentNo'];
                    doCreate();
                } else {
                    trans.ex = ['PaymentRule'];
                    if (!trans.code || trans.code === '') {
                        trans.ex.push('DocumentNo');
                        doCreate();
                    } else {
                        getTrans(function (respon) {
                            if (respon.length > 0) {
//                                getNextTrans(trans.isSales === 'Y' ? 'sales' : 'purchase', function (respon) {
//                                    trans.code = respon.data;
//                                    doCreate();
//                                }, error);
                                error('Nomor dokumen sudah ada, silahkan buat nomor dokumen baru.');
                            } else {
                                doCreate();
                            }
                        }, error, {code: trans.code, isSales: trans.isSales});
                    }

                }
            };
            var createTransDetail = function (trans, i, success, error) {
                var item = trans.details[i];
                if (item) {
                    item.idTrans = trans.id;
                    item.idTax = trans.tax.id;
                    $soap.post(C_SOAP, 'createData', getCRUDParam({
                        serviceType: 'createOrderLine', TableName: 'C_OrderLine', Action: 'Create', RecordID: 0,
                        DataRow: prepareFieldParam($mp.parseTransDetailForm(item, true))
                    })).then(function (respon) {
                        i++;
                        item.idDet = $mp.parseStandard(respon).id;
                        if (i >= trans.details.length) {
                            success(trans);
                        } else {
                            createTransDetail(trans, i, success, error);
                        }
                    }, error);
                } else {
                    success(trans);
                }
            };
            var updateTrans = function (trans, success, error) {
                var onRespon = function (respon) {
                    if (trans.details && trans.details.length === 0) {
                        return success(respon);
                    }
                    createTransDetail(trans, 0, success, error);
                };
                $soap.post(C_SOAP, 'updateData', getCRUDParam({
                    serviceType: 'updateSOdanPO', TableName: 'C_Order', Action: 'Update', RecordID: trans.id,
                    DataRow: prepareFieldParam($mp.parseTransForm(trans, true, ['DocumentNo', 'DateAcct', 'C_DocType_ID', 'IsSOTrx', 'GrandTotal', 'PaymentRule']))
                })).then(function (respon) {
                    if (trans.oldDetails && trans.oldDetails.length === 0) {
                        return onRespon(respon);
                    }
                    deleteTransDetail(trans, 0, true, onRespon, error);
                }, error);
            };
            var deleteTrans = function (trans, success, error) {
                var total = trans.details ? trans.details.length : 0;
                var onDelete = function () {
                    $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                        serviceType: 'deleteOrder(SO/PO)', TableName: 'C_Order', Action: 'Delete', RecordID: trans.id
                    })).then(function (respon) {
                        success(respon);
                    }, error);
                };
                if (total === 0) {
                    return onDelete();
                }
                deleteTransDetail(trans, 0, false, onDelete, error);
            };
            var deleteTransDetail = function (trans, i, isUpdate, success, error) {
                var item = isUpdate ? trans.oldDetails[i] : trans.details[i];
                if (!(item && item.idDet)) {
                    i++;
                    if (i >= trans.details.length) {
                        return success(trans);
                    } else {
                        return deleteTransDetail(trans, i, isUpdate, success, error);
                    }
                }
                $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                    serviceType: 'deleteOrderLine', TableName: 'C_OrderLine', Action: 'Delete', RecordID: item.idDet
                })).then(function (respon) {
                    i++;
                    if (i >= trans.details.length) {
                        success(trans);
                    } else {
                        deleteTransDetail(trans, i, isUpdate, success, error);
                    }
                }, error);
            };
            var completeTrans = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'ActionCompleteOrder', TableName: 'C_Order', docAction: 'CO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var cancelTrans = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'actionCancelOrder', TableName: 'C_Order', docAction: 'VO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var getPricelist = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'Name:name'
                ]);
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryListPrice', TableName: 'M_PriceList_Version', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: {
                        field_ATTR: [
                            "column='IsActive'",
                            {
                                val: 'Y'
                            }
                        ]
                    }
                })).then(function (respon) {
                    var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePricelist);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };
            var createPricelist = function (product, success, error) {
                $soap.post(C_SOAP, 'createData', getCRUDParam({
                    serviceType: 'insertPriceList', TableName: 'M_ProductPrice', Action: 'Create', RecordID: 0,
                    DataRow: prepareFieldParam($mp.parseProductPrice(product, true))
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var getPaymentTypes = function (success, error, filter) {
                $soap.post(C_SOAP, 'getList', getListParam({
                    serviceType: 'listDoctypePayment', AD_Reference_ID: 1000008
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePaymentType));
                }, error);
            };
            var getPaymentAllocates = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'C_Invoice_ID:idInvoice:='
                ]);
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryListPaymentAllocate', TableName: 'C_PaymentAllocate', Filter: filterSql, Action: 'Read',
                    DataRow: {
                        field_ATTR: [
                            "column='IsActive'",
                            {
                                val: 'Y'
                            }
                        ]
                    }
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePaymentAllocate));
                }, error);
            };
            var createPayment = function (trans, success, error) {
                $soap.post(C_SOAP, 'createData', getCRUDParam({
                    serviceType: 'insertPayment', TableName: 'C_Payment', Action: 'Create', RecordID: 0,
                    DataRow: prepareFieldParam($mp.parsePaymentForm(trans, true, trans.ex || []))
                })).then(function (respon) {
                    success($mp.parseStandard(respon));
                }, error);
            };
            var createPaymentAllocate = function (trans, success, error) {
                $soap.post(C_SOAP, 'createData', getCRUDParam({
                    serviceType: 'insertPaymentAllocate', TableName: 'C_PaymentAllocate', Action: 'Create', RecordID: 0,
                    DataRow: prepareFieldParam($mp.parsePaymentAllocateForm(trans, true))
                })).then(function (respon) {
                    success($mp.parseStandard(respon));
                }, error);
            };
            var completePayment = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'actionCompletePayment', TableName: 'C_Payment', docAction: 'CO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var cancelPayment = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'actionCancelPayment', TableName: 'C_Payment', docAction: 'VO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var getPaymentDetails = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'C_Payment_ID:idPayment:=',
                    'C_Order_ID:idTrans:=',
                    'C_Invoice_ID:idInvoice:='
                ]);
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'query_c_paymentallocate_v_ws', TableName: 'c_paymentallocate_v_ws', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    ]
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePaymentAllocate), respon.WindowTabData.QtyPages);
                }, error);
            };
            var createAcc = function (trans, success, error) {
                getAccType(function (respon) {
                    if (!respon) {
                        return error('C_DocType_ID tidak ditemukan.');
                    }
                    trans.idType = respon.id;
                    trans.idMovement = 'V+';
                    $soap.post(C_SOAP, 'createData', getCRUDParam({
                        serviceType: 'insertInOut', TableName: 'M_InOut', Action: 'Create', RecordID: 0,
                        DataRow: prepareFieldParam($mp.parseAccForm(trans, true))
                    })).then(function (respon) {
                        var count = 0;
                        var total = trans.details.length;
                        trans.idAcc = $mp.parseStandard(respon).id;
                        for (var i in trans.details) {
                            var item = trans.details[i];
                            if (item.amountAcc && item.amountAcc > 0) {
                                item.idAcc = trans.idAcc;
                                item.idLocation = trans.idLocation;
                                $soap.post(C_SOAP, 'createData', getCRUDParam({
                                    serviceType: 'insertInOutLine', TableName: 'M_InOUtLine', Action: 'Create', RecordID: 0,
                                    DataRow: prepareFieldParam($mp.parseAccDetailForm(item, true))
                                })).then(function (respon) {
                                    count++;
                                    if (count >= total) {
                                        success(trans);
                                    }
                                }, error);
                            } else {
                                count++;
                                if (count >= total) {
                                    success(trans);
                                }
                            }
                        }
                    }, error);
                }, error);
            };
            var completeAcc = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'actionCompleteInOut', TableName: 'M_InOut', docAction: 'CO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var cancelAcc = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'actionCancelInOut', TableName: 'M_InOut', docAction: 'VO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var getInvoices = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'AD_Org_ID:idOrg:=',
                    'C_BPartner_ID:idPartner:=',
                    'C_Invoice_ID:id:=',
                    'C_Order_ID:idTrans:=',
                    'IsSOTrx:isSales',
                    'M_InOut_ID:idAcc:=',
                    'DateOrdered:dateFrom-dateTo:between',
                    'Document_Order:code',
                    'business_partner:partner',
                    'document_invoice:docInv'
                ]);
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryInvoice', TableName: 'list_invoice_view', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: {
                        field_ATTR: [
                            "column='IsActive'",
                            {
                                val: 'Y'
                            }
                        ]
                    }
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseInvoice), respon.WindowTabData.QtyPages);
                }, error);
            };
            var getInvoice = function (success, error, filter) {
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryInvoiceList', TableName: 'C_Invoice', Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        },
                        {
                            field_ATTR: [
                                "column='DocumentNo'",
                                {
                                    val: filter.code
                                }
                            ]
                        }
                    ]
                })).then(function (respon) {
                    var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parseInvoiceOnly);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };
            var createInvoice = function (trans, success, error) {
                $soap.post(C_SOAP, 'runProcess', getProcessParam({
                    serviceType: 'processCreateInvoice',
                    ParamValues: {
                        field_ATTR: [
                            'column="M_PriceList_ID"',
                            {val: trans.idPrice}
                        ]
                    }
                }, 'AD_Process_ID="154" AD_Menu_ID="204" AD_Record_ID="' + trans.idAcc + '"')).then(function (respon) {
                    success(respon);
                }, error);
            };
            var completeInvoice = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'ActionCompleteInvoice', TableName: 'C_Invoice', docAction: 'CO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var cancelInvoice = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'actionCancelInvoice', TableName: 'C_Invoice', docAction: 'VO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var createOpnameDetails = function (trans, success, error) {
                $soap.post(C_SOAP, 'runProcess', getProcessParam({
                    serviceType: 'processInventoryCreateLines',
                    ParamValues: [
                        {
                            field_ATTR: [
                                'column="QtyRange"',
                                {val: 'N'}
                            ]
                        },
                        {
                            field_ATTR: [
                                'column="InventoryCountSet"',
                                {val: 'O'}
                            ]
                        },
                        {
                            field_ATTR: [
                                'column="DeleteOld"',
                                {val: 'Y'}
                            ]
                        }
                    ]
                }, 'AD_Process_ID="105" AD_Menu_ID="179" AD_Record_ID="' + trans.id + '"')).then(function (respon) {
                    success(respon);
                }, error);
            };
            var createInventoryDetails = function (trans, i, success, error) {
                var item = trans.details[i];
                if (item) {
                    item.idTrans = trans.id;
                    item.type = 'D';
                    item.idWarehouse = trans.idWarehouse;
                    if (trans.type && trans.type.toLowerCase().indexOf('opname') < 0) {
                        item.amountInternal = (trans.type.toLowerCase().indexOf('masuk') > -1) ? -Math.abs(Number(item.amount)) : item.amount;
                        item.amount = 0;
                        item.idCharge = trans.idCharge || 1000003;
                    } else {
                        item.qtyBook = item.qtyBook || 0;
                    }
                    $soap.post(C_SOAP, 'createData', getCRUDParam({
                        serviceType: 'insertInventoryLine', TableName: 'M_InventoryLine', Action: 'Create', RecordID: 0,
                        DataRow: prepareFieldParam($mp.parseInvDetailForm(item, true, (trans.type && trans.type.toLowerCase().indexOf('opname') < 0) ? ['QtyBook'] : []))
                    })).then(function (respon) {
                        i++;
                        item.idDet = $mp.parseStandard(respon).id;
                        if (i >= trans.details.length) {
                            success(trans);
                        } else {
                            createInventoryDetails(trans, i, success, error);
                        }
                    }, error);
                } else {
                    success(trans);
                }
            };
            var getInventoryDetails = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'M_Inventory_ID:idTrans:='
                ]);
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryDetailInventory', TableName: 'detail_inventory', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: {
                        field_ATTR: [
                            "column='IsActive'",
                            {
                                val: 'Y'
                            }
                        ]
                    }
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseInvDetail), respon.WindowTabData.QtyPages);
                }, error);
            };
            var createRMA = function (trans, accs, success, error) {
                var rma = {
                    details: accs
                };
                getRMAType(function (respon) {
                    var user = $ls.getObject(C_SESSION, null);
                    rma.idRMAType = respon.id;
                    rma.name = trans.isSales ? 'Pengembalian Barang dari Pelanggan ' + trans.partner : 'Pengembalian Barang ke Pemasok ' + trans.partner;
                    rma.isSales = trans.isSales ? 'Y' : 'N';
                    rma.idUser = user.idUser;
                    rma.idPartner = trans.idPartner;
                    rma.idAcc = accs[0].id;
                    rma.idInvoice = accs[0].idInvoice;
                    getRMADocType(function (respon) {
                        rma.idType = respon.id;
                        $soap.post(C_SOAP, 'createData', getCRUDParam({
                            serviceType: 'insertRMA', TableName: 'M_RMA', Action: 'Create', RecordID: 0,
                            DataRow: prepareFieldParam($mp.parseRMAForm(rma, true))
                        })).then(function (respon) {
                            rma.id = $mp.parseStandard(respon).id;
                            createRMADetail(rma, 0, function (respon) {
                                completeRMA(respon, function () {
                                    var rmaAcc = {
                                        details: accs,
                                        id: rma.id,
                                        idPartner: trans.idPartner,
                                        date: new Date(),
                                        idWarehouse: trans.idWarehouse,
                                        idLocation: trans.idLocation,
                                        idBpLocation: trans.idBpLocation,
                                        isSales: trans.isSales
                                    };
                                    createRMAAcc(rmaAcc, function (respon) {
                                        completeAcc({id: rmaAcc.idAcc}, function (respon) {
                                            createRMAInvoice(trans, rmaAcc, success, error);
//                                            if (rma.idInvoice) {
//                                                getPaymentDetails(function (respon) {
//                                                    if (respon.length > 0) {
//                                                        trans.idBank = respon[0].idBank;
//                                                        createRMAInvoice(trans, rmaAcc, success, error);
//                                                    } else {
//                                                        success(rmaAcc);
//                                                    }
//                                                }, error, {idInvoice: rma.idInvoice});
//                                            } else {
//                                                success(rmaAcc);
//                                            }
                                        }, error);
                                    }, error);
                                }, error)
                            }, error);
                        }, error);
                    }, error, trans.isSales);
                }, error);
            };
            var createRMADetail = function (trans, i, success, error) {
                if (trans.details[i]) {
                    var item = {
                        idTrans: trans.id,
                        idDetAcc: trans.details[i].idDet,
                        amount: trans.details[i].amountRma
                    };
                    $soap.post(C_SOAP, 'createData', getCRUDParam({
                        serviceType: 'insertRMALine', TableName: 'M_RMALine', Action: 'Create', RecordID: 0,
                        DataRow: prepareFieldParam($mp.parseRMADetailForm(item, true))
                    })).then(function (respon) {
                        item.idDet = $mp.parseStandard(respon).id;
                        trans.details[i].idDetRma = item.idDet;
                        i++;
                        if (i >= trans.details.length) {
                            success(trans);
                        } else {
                            createRMADetail(trans, i, success, error);
                        }
                    }, error);
                } else {
                    success(trans);
                }
            };
            var completeRMA = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'actionCompleteRMA', TableName: 'M_RMA', docAction: 'CO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var cancelRMA = function (trans, success, error) {
                $soap.post(C_SOAP, 'setDocAction', getDocParam({
                    serviceType: 'actionCompleteRMA', TableName: 'M_RMA', docAction: 'VO', recordID: trans.id
                })).then(function (respon) {
                    success(respon);
                }, error);
            };
            var createRMAAcc = function (trans, success, error) {
                getRMAList(function (respon) {
                    if (!respon) {
                        return error('C_DocType_ID tidak ditemukan.');
                    }
                    trans.idType = respon.id;
                    trans.idMovement = trans.isSales ? 'C+' : 'V-';
                    $soap.post(C_SOAP, 'createData', getCRUDParam({
                        serviceType: 'insertInOut', TableName: 'M_InOut', Action: 'Create', RecordID: 0,
                        DataRow: prepareFieldParam($mp.parseRMAAccForm(trans, true))
                    })).then(function (respon) {
                        var count = 0;
                        var total = trans.details.length;
                        trans.idAcc = $mp.parseStandard(respon).id;
                        for (var i in trans.details) {
                            var item = trans.details[i];
                            if (item.amountRma && item.amountRma > 0) {
                                item.idAcc = trans.idAcc;
                                item.idLocation = trans.idLocation;
                                $soap.post(C_SOAP, 'createData', getCRUDParam({
                                    serviceType: 'insertInOutLine', TableName: 'M_InOUtLine', Action: 'Create', RecordID: 0,
                                    DataRow: prepareFieldParam($mp.parseRMAAccDetailForm(item, true))
                                })).then(function (respon) {
                                    count++;
                                    if (count >= total) {
                                        success(trans);
                                    }
                                }, error);
                            } else {
                                count++;
                                if (count >= total) {
                                    success(trans);
                                }
                            }
                        }
                    }, error);
                }, error, trans.isSales);
            };
            var getRMAList = function (success, error, filter) {
                var filterSql = prepareFilter(
                        {
                            isSales: filter ? 'Y' : 'N'
                        }, ['IsSOTrx:isSales']);
                $soap.post(C_SOAP, 'getList', getListParam({
                    serviceType: 'listReturn', AD_Reference_ID: 1000000, Filter: filterSql
                })).then(function (respon) {
                    var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTransType);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            }
            var getRMADetails = function (success, error, filter) {
                var filterSql = prepareFilter(filter, [
                    'M_RMA_ID:idTrans:='
                ]);
                return $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryRMALine', TableName: 'M_RMALine', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    ]
                })).then(function (respon) {
                    success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTransDetail), respon.WindowTabData.QtyPages);
                }, error);
            };
            var createRMAInvoice = function (trans, acc, success, error) {
                createInvoice({
                    idPrice: trans.idPrice,
                    idAcc: acc.idAcc
                }, function (respon) {
                    var tmp = $mp.parseProcess(respon);
                    if (tmp.isError) {
                        return error(tmp.log);
                    } else {
                        getInvoice(function (invoiceDoc) {
                            if (invoiceDoc) {
                                completeInvoice(invoiceDoc, function (respon) {
                                    return success(acc);
//                                    getInvoices(function (respon) {
//                                        if (respon.length === 0) {
//                                            return success();
//                                        }
//                                        var invoice = respon[0];
//                                        var pay = {};
//                                        pay.idPartner = trans.idPartner;
//                                        pay.idBank = trans.idBank;
//                                        pay.idType = '1000008'; // fallback
//                                        pay.isReceipt = trans.isSales ? 'Y' : 'N';
//                                        pay.idCurrency = 303;
//                                        pay.date = new Date();
//                                        getPaymentTypes(function (respon) {
//                                            for (var i in respon) {
//                                                if (respon[i].name === (trans.isSales ? 'AR Receipt' : 'AP Payment')) {
//                                                    pay.idType = respon[i].id;
//                                                    break;
//                                                }
//                                            }
//                                            pay.ex = ['DocumentNo', 'C_Charge_ID'];
//                                            pay.total = invoice.total;
//                                            createPayment(pay, function (respon) {
//                                                pay.id = respon.id;
//                                                createPaymentAllocate({
//                                                    idPayment: pay.id,
//                                                    idInvoice: invoice.id,
//                                                    total: pay.total,
//                                                    disc: 0,
//                                                    sale: 0,
//                                                    rest: 0,
//                                                    amount: pay.total
//                                                }, function (respon) {
//                                                    completePayment(pay, success, error);
//                                                }, error);
//                                            }, function (respon) {
//                                                return error(respon);
//                                            });
//                                        }, error);
//                                    }, error, {id: invoiceDoc.id})
                                }, error);
                            } else {
                                console.log('Invoice tidak ditemukan. DocumentNo : ' + tmp.id);
                                return success(acc);
                            }
                        }, error, {code: tmp.id});
                    }
                }, error);
            };
            var getAddress = function (success, error, user) {
                $http.post(C_WS + 'getaddress/' + user.ClientID + '/' + user.WarehouseID).then(success, error);
            };

            var getNextID = function (filter, success, error) {
                success({data: null});
//                $http.get(C_WS + 'getnextid/' + filter.id + '/' + filter.table).then(function (respon) {
//                    success({data: (filter.prefix || "") + $mp.toSQLDatetime(new Date(), true).replace(/-/g, "").substr(2, 6) + "-" + respon.data});
//                }, error);
            };
            var getNextIDNoStamp = function (filter, success, error) {
                $http.get(C_WS + 'getnextid/' + filter.id + '/' + filter.table).then(function (respon) {
                    success({data: (filter.prefix || "") + respon.data});
                }, error);
            };
            var getNextTrans = function (type, success, error) {
                var mapper = {
                    sales: 'PJ-',
                    purchase: 'PB-'
                };
                getNextID({id: 'c_order_id', table: 'c_order', prefix: mapper[type] || null}, success, error);
            };
            var getNextInv = function (types, success, error) {
                var type = types ? types.replace('Stok ', '') : "Opname";
                var mapper = {
                    Opname: 'SO-',
                    Keluar: 'SK-',
                    Masuk: 'SM-',
                    Pindah: 'SP-'
                };
                if (error) {
                    return getNextID({id: 'm_inventory_id', table: 'm_inventory', prefix: mapper[type] || null}, success, error);
                } else {
                    return success;//success.length > 9 ? mapper[type] + success.substr(3, success.length - 1) : mapper[type] + success;
                }
            };
            var getNextPayment = function (types, success, error) {
                var type = types ? types.split(' ')[0] : "AR";
                var mapper = {
                    AR: 'KM-',
                    AP: 'KK-'
                };
                if (error) {
                    return getNextID({id: 'c_payment_id', table: 'c_payment', prefix: mapper[type] || null}, success, error);
                } else {
                    return success;//success.length > 9 ? mapper[type] + success.substr(3, success.length - 1) : mapper[type] + success;
                }
            };
            var getNextPartner = function (type, success, error) {
                var mapper = {
                    Vendor: 'V-',
                    Customer: 'C-',
                    Employee: 'E-'
                };
                if (error) {
                    return getNextIDNoStamp({id: 'c_bpartner_id', table: 'c_bpartner', prefix: mapper[type] || null}, success, error);
                } else {
                    return success;//success.length > 9 ? mapper[type] + success.substr(3, success.length - 1) : mapper[type] + success;
                }
            };
            var getNextProduct = function (types, success, error) {
                var type = types && types.indexOf(' ') > -1 ? types.split(' ')[1] : 'Dagang';
                var mapper = {
                    Dagang: 'D-',
                    Manufaktur: 'M-'
                };
                if (error) {
                    return getNextIDNoStamp({id: 'm_product_id', table: 'm_product', prefix: mapper[type] || null}, success, error);
                } else {
                    return success;//success.length > 9 ? mapper[type] + success.substr(3, success.length - 1) : mapper[type] + success;
                }
            };
            var getUOMType = function (success, error) {
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryUOM', TableName: 'C_UOM', Filter: '', Action: 'Read', PageNo: 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
//                        ,
//                        {
//                            field_ATTR: [
//                                "column='UOMSymbol'",
//                                {
//                                    val: 'PCS'
//                                }
//                            ]
//                        }
                    ]
                })).then(function (respon) {
                    success($mp.parseArrayObject(respon.WindowTabData.DataSet, ['C_UOM_ID:id', 'UOMSymbol:name']));
                }, error);
            };
            var getTaxType = function (success, error) {
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryTaxCategory', TableName: 'C_TaxCategory', Filter: "Name='Standard'", Action: 'Read', PageNo: 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    ]
                })).then(function (respon) {
                    var tmp = $mp.parseArrayObject(respon.WindowTabData.DataSet, ['C_TaxCategory_ID:id']);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };
            var getChargeType = function (success, error) {
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryCharge', TableName: 'C_Charge', Filter: "Name='Penyesuaian Persediaan'", Action: 'Read', PageNo: 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    ]
                })).then(function (respon) {
                    var tmp = $mp.parseArrayObject(respon.WindowTabData.DataSet, ['C_Charge_ID:id']);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };
            var getPartnerPOS = function (success, error) {
                $soap.post(C_SOAP, 'queryData', getCRUDParam({
                    serviceType: 'queryBPartner', TableName: 'c_bpartner_view', Filter: "Name= 'Standard'", Action: 'Read', PageNo: 0,
                    DataRow: [
                        {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    ]
                })).then(function (respon) {
                    var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePartner);
                    success(tmp.length > 0 ? tmp[0] : false);
                }, error);
            };


            return {
                getCRUDParam: getCRUDParam,
                getListParam: getListParam,
                SOAP: function (action, params) {
                    return $soap.post(C_SOAP, action, params);
                },
                HTTP: function (opt) {
                    return $http(opt)
                },
                POST: function (url, data) {
                    return $http.post(url, data);
                },
                GET: function (url) {
                    return $http.get(url);
                },
                setCache: function (item) {
                    $ls.setObject(C_CACHE, item);
                },
                getCache: function () {
                    var item = $ls.getObject(C_CACHE, null);
                    $ls.setObject(C_CACHE, null);
                    return item;
                },
                setServer: setServer,
                getServer: getServer,
                setServerName: setServerName,
                getServerName: getServerName,
                testing: getRMAType,
//                user
                login: function (user, success, error) {
                    var tmps = user.idWarehouse.split('-');
                    var loginParam = {
                        user: user.username,
                        pass: user.password,
                        lang: 192,
                        ClientID: user.idClient,
                        RoleID: user.role.idrole,
                        OrgID: tmps[1],
                        WarehouseID: tmps[0],
                        stage: 9
                    };
                    return $soap.post(C_SOAP, 'readData', getCRUDParam({
                        serviceType: 'ReadUserLogin', TableName: 'AD_User', RecordID: user.role.iduser
                    }, loginParam)).then(function (respon) {
                        var isLogged = respon.WindowTabData.Success;
                        if (isLogged) {
                            getAddress(function (respon) {
                                loginParam.client = user.client;
                                loginParam.warehouse = user.warehouse;
                                loginParam.idUser = user.role.iduser;
                                loginParam.rolename = "owner operasional inventory".indexOf(user.role.rolename.toLowerCase()) > -1 ? user.role.rolename : 'Owner';
                                loginParam.address = respon.data ? respon.data.address : "";
                                $ls.setObject(C_SESSION, loginParam);

                                success(isLogged);
                            }, error, loginParam);
                        } else {
                            success(isLogged);
                        }
                    }, error);
                },
                updateLogin: function (user, setting) {
                    var loginUser = $ls.getObject(C_SESSION, null);
                    if (user) {
                        loginUser.pass = user.newPassword;
                    }
                    if (setting) {
                        loginUser.setting = setting;
                    }
                    $ls.setObject(C_SESSION, loginUser);
                    return  $ls.getObject(C_SESSION, null);
                },
                isLogin: function () {
                    return ($ls.getObject(C_SESSION, null) !== null);
                },
                loginUser: function () {
                    return $ls.getObject(C_SESSION, null);
                },
                logout: function () {
                    $ls.remove(C_SESSION);
                },
                getClients: function (success, error) {
                    $http.get(C_WS + 'getclients').then(success, error);
                },
                getWarehousesLogin: function (success, error, id) {
                    $http.get(C_WS + 'getwarehouses/' + id).then(success, error);
                },
                getRole: function (success, error, data) {
                    $http.post(C_WS + 'getrole/', data).then(success, error);
                },
                getAddress: getAddress,
                getUOMType: getUOMType,
                getTaxType: getTaxType,
                getChargeType: getChargeType,
                getPartnerPOS: getPartnerPOS,
                changePassword: function (user, success, error) {
                    $soap.post(C_SOAP, 'updateData', getCRUDParam({
                        serviceType: 'updateUser', TableName: 'AD_User', Action: 'Update', RecordID: user.idUser,
                        DataRow: prepareFieldParam({Password: user.newPassword})
                    })).then(function (respon) {
                        success($mp.parseStandard(respon).id);
                    }, error);
                },
//                static
                getCategories: function (success, error, filter) {
                    $soap.post(C_SOAP, 'getList', getListParam({
                        serviceType: 'listProductCategory', AD_Reference_ID: 163
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseCategory));
                    }, error);
                },
                getWarehouses: function (success, error, filter) {
                    $soap.post(C_SOAP, 'getList', getListParam({
                        serviceType: 'listWarehouse', AD_Reference_ID: 1000002
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseWarehouse));
                    }, error);
                },
                getWarehousesUser: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'AD_User_ID:idUser:=',
                        'M_Warehouse_ID:idWarehouse:='
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryOrgAccess', TableName: 'c_bporgaccess_v', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: [
                            {
                                field_ATTR: [
                                    "column='IsActive'",
                                    {
                                        val: 'Y'
                                    }
                                ]
                            }
                        ]
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseWarehouseUser), respon.WindowTabData.QtyPages);
                    }, error);
                },
                getBPGroups: function (success, error, filter) {
                    $soap.post(C_SOAP, 'getList', getListParam({
                        serviceType: 'listBPGroup', AD_Reference_ID: 1000002
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseBPGroup));
                    }, error);
                },
                getInvTypes: function (success, error, filter) {
                    $soap.post(C_SOAP, 'getList', getListParam({
                        serviceType: 'listDocumentInventory', AD_Reference_ID: 1000006
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseInvCategory));
                    }, error);
                },
                getInvWarehouses: function (success, error, filter) {
                    $soap.post(C_SOAP, 'getList', getListParam({
                        serviceType: 'listLocator', AD_Reference_ID: 191
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseInvWarehouse));
                    }, error);
                },
                getPOSBanks: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'AD_Org_ID:OrgID:='
                    ]);
                    $soap.post(C_SOAP, 'getList', getListParam({
                        serviceType: 'listBankAccount', AD_Reference_ID: 1000010, Filter: filterSql
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePOSBank));
                    }, error);
                },
                getTaxes: function (success, error, filter) {
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryListTax', TableName: 'C_Tax', Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseTax));
                    }, error);
                },
                getNextTrans: getNextTrans,
                getNextInv: getNextInv,
                getNextPayment: getNextPayment,
                getMoveType: getAccType,
                getPrinterBarcode: function (success, error) {
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryPrinterFormat', TableName: 'AD_Printer_Format', Action: 'Read',
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePrinterBarcode));
                    }, error);
                },
//                product
                getProducts: function (success, error, filter) {
                    var tmpFilter = JSON.parse(JSON.stringify(filter));
                    var qty = prepareSplitFilter(tmpFilter, 'qty');
                    tmpFilter.qty = qty[1];
                    var sal = prepareSplitFilter(tmpFilter, 'salesprice');
                    tmpFilter.salesprice = sal[1];
                    var pur = prepareSplitFilter(tmpFilter, 'purchaseprice');
                    tmpFilter.purchaseprice = pur[1];

                    var filterSql = prepareFilter(tmpFilter, [
                        'Product:name:or',
                        'Value:code:or',
                        'M_Product_Category_ID:idCategory:=',
                        'M_Warehouse_ID:idWarehouse:=',
                        'C_UOM_ID:idUOM:=',
                        'IsSold:isSold:=',
                        'IsStocked:isStocked:=',
                        'IsPurchased:isPurchased:=',
                        'QtyOnHand:qty:' + qty[0],
                        'PriceList:salesprice:' + sal[0],
                        'CurrentCostPrice:purchaseprice:' + pur[0]
                    ]);
//                    if ((!filter.idWarehouse || filter.idWarehouse === '') && filter.warehouses && filter.warehouses.length > 0) {
//                        filterSql += filterSql.length > 0 ? " AND " : "";
//                        var wh = [];
//                        for (var j in filter.warehouses) {
//                            wh.push(filter.warehouses[j].id)
//                        }
//                        filterSql += " M_Warehouse_ID in (" + wh.join(',') + ") ";
//                    }
                    if (filter.stocked) {
                        var tmp = "(isStocked='N' AND isSold='Y') OR (isStocked='Y' AND isSold='Y')";
                        var filterProd = prepareFilter(tmpFilter, [
                            'Product:name:or',
                            'Value:code:or'
                        ]);
                        filterSql = filterSql && filterSql.length > 0 ? "(isStocked='N' AND isSold='Y' " + (filterProd && filterProd.length > 0 ? ' AND '+filterProd: '') + ") OR (isStocked='Y' AND isSold='Y' AND " + filterSql + ")" : tmp;
                    }
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryProduct', TableName: 'm_product_view', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseProduct), respon.WindowTabData.QtyPages);
                    }, error);
                },
                getProductsMaster: function (success, error, filter) {
                    var tmpFilter = JSON.parse(JSON.stringify(filter));
                    var qty = prepareSplitFilter(tmpFilter, 'qty');
                    tmpFilter.qty = qty[1];
                    var sal = prepareSplitFilter(tmpFilter, 'salesprice');
                    tmpFilter.salesprice = sal[1];
                    var pur = prepareSplitFilter(tmpFilter, 'purchaseprice');
                    tmpFilter.purchaseprice = pur[1];

                    var filterSql = prepareFilter(tmpFilter, [
                        'Product:name:or',
                        'Value:code:or',
                        'M_Product_Category_ID:idCategory:=',
                        'M_Warehouse_ID:idWarehouse:=',
                        'QtyOnHand:qty:' + qty[0],
                        'PriceList:salesprice:' + sal[0],
                        'CurrentCostPrice:purchaseprice:' + pur[0]
                    ]);
                    if (filter.idWarehouse) {
                        filterSql += filterSql.length > 0 ? " AND " : "";
                        filterSql += "(M_Warehouse_ID IS NULL OR M_Warehouse_ID=" + filter.idWarehouse + ")";
                    }
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryProduct', TableName: 'm_product_view', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseProduct), respon.WindowTabData.QtyPages);
                    }, error);
                },
                getProduct: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'M_Product_ID:id:=',
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryProduct', TableName: 'm_product_view', Filter: filterSql, Action: 'Read',
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parseProduct);
                        success(tmp.length > 0 ? tmp[0] : false);
                    }, error);
                },
                createProduct: function (product, success, error) {
                    var doCreate = function () {
                        $soap.post(C_SOAP, 'createData', getCRUDParam({
                            serviceType: 'insertProduct', TableName: 'M_Product', Action: 'Create', RecordID: 0,
                            DataRow: prepareFieldParam($mp.parseProductForm(product, true, product.ex))
                        })).then(function (respon) {
                            product.id = $mp.parseStandard(respon).id;
                            getPricelist(function (respon) {
                                product.idVersion = respon.idVersion;
                                product.idPrice = respon.idPrice;
                                createPricelist(product, function (respon) {
                                    getPricelist(function (respon) {
                                        product.idVersion = respon.idVersion;
                                        product.idPrice = respon.idPrice;
                                        product.salesprice = 0;
                                        createPricelist(product, success, error);
                                    }, error, {name: 'PP'});
                                }, error);
                            }, error, {name: 'SP'});
                        }, error);
                    };
                    var afterCheck = function () {
                        if (product.imageData) {
                            return $http.post(C_WS + 'postimage', product).then(function (respon) {
                                if (parseInt(respon.data.code) !== 200) {
                                    return error(respon.data.message);
                                }
                                product.image = respon.data.message;
                                doCreate();
                            }, error);
                        } else {
                            return doCreate();
                        }
                    };
//                    getUOMType(function (respon) {
//                        if (!respon) {
//                            return error('C_UOM_ID tidak ditemukan.');
//                        }
//                        product.idUOM = respon.id;
//                        
//                    }, error);
                    getTaxType(function (respon) {
                        if (!respon) {
                            return error('C_TaxCategory_ID tidak ditemukan.');
                        }
                        product.idTaxCategory = respon.id;
                        product.idOrg = 0;
                        product.ex = [];
                        if (!product.code || product.code === '') {
//                                product.ex.push('Value');
                            getNextProduct(product.category, function (respon) {
                                product.code = respon.data;
                                afterCheck();
                            }, error);
                        } else {
                            afterCheck();
                        }
                    }, error);

                },
                updateProduct: function (product, success, error) {
                    var doUpdate = function () {
                        $soap.post(C_SOAP, 'updateData', getCRUDParam({
                            serviceType: 'updateProduct', TableName: 'M_Product', Action: 'Update', RecordID: product.id,
                            DataRow: prepareFieldParam($mp.parseProductForm(product, true, product.ex))
                        })).then(function (respon) {
                            getPricelist(function (respon) {
                                product.idVersion = respon.idVersion;
                                product.idPrice = respon.idPrice;
                                $http.post(C_WS + 'updateproductprice', product).then(function (respon) {
                                    success(respon);
                                }, error);
                            }, error, {name: 'SP'});
                        }, error);
                    };
                    product.ex = ['C_TaxCategory_ID', 'AD_Org_ID'];
                    if (!product.code || product.code === '') {
                        product.ex.push('Value');
                    }
                    if (product.imageData) {
                        return $http.post(C_WS + 'postimage', product).then(function (respon) {
                            if (parseInt(respon.data.code) !== 200) {
                                return error(respon.data.message);
                            }
                            product.image = respon.data.message;
                            doUpdate();
                        }, error);
                    } else {
                        return doUpdate();
                    }
                },
                deleteProduct: function (product, success, error) {
                    $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                        serviceType: 'deleteProduct', TableName: 'M_Product', Action: 'Delete', RecordID: product.id
                    })).then(function (respon) {
                        success(respon);
                    }, error);
                },
//                partner
                getPartners: function (success, error, filter) {
                    if (filter) {
                        filter.isActive = filter.status ? 'Y' : 'N';
                    } else {
                        filter = {
                            isActive: 'Y'
                        };
                    }

                    var filterSql = prepareFilter(filter, [
                        'C_BP_Group_ID:idBpGroup:=',
                        'Name:name',
                        'bp_value:code',
                        'Description:desc',
                        'Address1:address',
                        'City:city',
                        'Phone:phone',
                        'groupname:bpGroup'
                    ]);
                    console.log(filter);
                    if (filter.bpGroup && filter.bpGroup.toString().toLowerCase() === 'vendor_aff') {
                        filterSql = filterSql.replace("LOWER(groupname) LIKE '%vendor_aff%'", "(LOWER(groupname) LIKE '%vendor%' OR LOWER(groupname) LIKE '%afiliasi%')");
                    } else if (filter.bpGroup && filter.bpGroup.toString().toLowerCase() === 'customer_aff') {
                        filterSql = filterSql.replace("LOWER(groupname) LIKE '%customer_aff%'", "(LOWER(groupname) LIKE '%customer%' OR LOWER(groupname) LIKE '%afiliasi%')");
                    }
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryBPartner', TableName: 'c_bpartner_view', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: filter.isActive
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePartner), respon.WindowTabData.QtyPages);
                    }, error);
                },
                getPartner: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'C_BPartner_ID:id:='
                    ]);
                    var doGet = function (act, suc, err) {
                        $soap.post(C_SOAP, 'queryData', getCRUDParam({
                            serviceType: 'queryBPartner', TableName: 'c_bpartner_view', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                            DataRow: {
                                field_ATTR: [
                                    "column='IsActive'",
                                    {
                                        val: act
                                    }
                                ]
                            }
                        })).then(function (respon) {
                            var tmp = $mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePartner);
                            suc(tmp);
                        }, err);
                    };
                    doGet('Y', function (respon) {
                        if (respon.length === 0) {
                            doGet('N', function (respon) {
                                success(respon.length > 0 ? respon[0] : false);
                            }, error);
                        } else {
                            success(respon[0]);
                        }
                    }, error);
                },
                createPartner: function (partner, success, error) {
                    var doCreate = function () {
                        $soap.post(C_SOAP, 'createData', getCRUDParam({
                            serviceType: 'insertBusinessPartner', TableName: 'C_BPartner', Action: 'Create', RecordID: 0,
                            DataRow: prepareFieldParam($mp.parsePartnerForm(partner, true, partner.ex))
                        })).then(function (respon) {
                            partner.id = $mp.parseStandard(respon).id;
                            $soap.post(C_SOAP, 'createData', getCRUDParam({
                                serviceType: 'insertBPAddress', TableName: 'C_Location', Action: 'Create', RecordID: 0,
                                DataRow: prepareFieldParam($mp.parsePartnerAddress(partner, true))
                            })).then(function (respon) {
                                partner.idAddress = $mp.parseStandard(respon).id;
                                $soap.post(C_SOAP, 'createData', getCRUDParam({
                                    serviceType: 'insertBPLocation', TableName: 'C_BPartner_Location', Action: 'Create', RecordID: 0,
                                    DataRow: prepareFieldParam($mp.parsePartnerLocation(partner, true))
                                })).then(function (respon) {
                                    success(respon);
                                }, error);
                            }, error);
                        }, error);
                    };
                    var afterCheck = function () {
                        if (partner.imageData) {
                            return $http.post(C_WS + 'postimage', partner).then(function (respon) {
                                if (parseInt(respon.data.code) !== 200) {
                                    return error(respon.data.message);
                                }
                                partner.image = respon.data.message;
                                doCreate();
                            }, error);
                        } else {
                            return doCreate();
                        }
                    };
                    partner.idOrg = 0;
                    partner.ex = ['IsActive'];
                    if (!partner.code || partner.code === '') {
//                        partner.ex.push('Value');
                        getNextPartner(partner.bpGroup, function (respon) {
                            partner.code = respon.data;
                            afterCheck();
                        }, error);
                    } else {
                        afterCheck();
                    }
                },
                updatePartner: function (partner, success, error) {
                    var doUpdate = function () {
                        $soap.post(C_SOAP, 'updateData', getCRUDParam({
                            serviceType: 'UpdateBP', TableName: 'C_BPartner', Action: 'Update', RecordID: partner.id,
                            DataRow: prepareFieldParam($mp.parsePartnerForm(partner, true, partner.ex))
                        })).then(function (respon) {
                            $soap.post(C_SOAP, 'updateData', getCRUDParam({
                                serviceType: 'updateBPAddress', TableName: 'C_Location', Action: 'Update', RecordID: partner.idAddress,
                                DataRow: prepareFieldParam($mp.parsePartnerAddress(partner, true, ['C_BPartner_ID']))
                            })).then(function (respon) {
                                $soap.post(C_SOAP, 'updateData', getCRUDParam({
                                    serviceType: 'updateBPLocation', TableName: 'C_BPartner_Location', Action: 'Update', RecordID: partner.idLocation,
                                    DataRow: prepareFieldParam($mp.parsePartnerLocation(partner, true, ['C_BPartner_ID', 'C_Location_ID']))
                                })).then(function (respon) {
                                    success(respon);
                                }, error);
                            }, error);
                        }, error);
                    };
                    partner.ex = ['C_BP_Group_ID', 'AD_Org_ID'];
                    if (!partner.code || partner.code === '') {
                        partner.ex.push('Value');
                    }
                    if (partner.imageData) {
                        return $http.post(C_WS + 'postimage', partner).then(function (respon) {
                            if (parseInt(respon.data.code) !== 200) {
                                return error(respon.data.message);
                            }
                            partner.image = respon.data.message;
                            doUpdate();
                        }, error);
                    } else {
                        return doUpdate();
                    }
                },
                deletePartner: function (partner, success, error) {
                    $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                        serviceType: 'deleteBPartner', TableName: 'C_BPartner', Action: 'Delete', RecordID: partner.id
                    })).then(function (respon) {
                        success(respon);
                    }, error);
                },
//                transaction
                getSales: function (success, error, filter) {
                    filter.isSales = 'Y';
                    getTrans(success, error, filter);
                },
                getSalesProducts: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'M_Product_ID:id:='
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'querySalesbyProduct', TableName: 'sales_by_product', Filter: filterSql, Action: 'Read',
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseSalesProduct));
                    }, error);
                },
                getSalesPartners: function (success, error, filter) {
                    filter.isSales = 'Y';
                    getTransPartners(success, error, filter);
                },
                getTransPartners: getTransPartners,
                getTransProducts: getTransProducts,
                getSalesDetails: getTransDetails,
                createSales: function (trans, success, error) {
                    getSalesType(function (respon) {
                        if (!respon) {
                            return error('C_DocType_ID tidak ditemukan.');
                        }
                        trans.idType = respon.id;
                        trans.isSales = 'Y';
                        return createTrans(trans, success, error);
                    }, error);
                },
                updateSales: function (trans, success, error) {
                    getSalesType(function (respon) {
                        if (!respon) {
                            return error('C_DocType_ID tidak ditemukan.');
                        }
                        trans.idType = respon.id;
                        trans.isSales = 'Y';
                        return updateTrans(trans, success, error);
                    }, error);
                },
                deleteSales: deleteTrans,
                getPurchase: function (success, error, filter) {
                    filter.isSales = 'N';
                    getTrans(success, error, filter);
                },
                getPurchaseProducts: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'M_Product_ID:id:='
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'query_purchase_by_product', TableName: 'purchase_by_product', Filter: filterSql, Action: 'Read',
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parsePurchaseProduct));
                    }, error);
                },
                getPurchasePartners: function (success, error, filter) {
                    filter.isSales = 'N';
                    getTransPartners(success, error, filter);
                },
                getPurchaseDetails: getTransDetails,
                createPurchase: function (trans, success, error) {
                    getPurchaseType(function (respon) {
                        if (!respon) {
                            return error('C_DocType_ID tidak ditemukan.');
                        }
                        trans.idType = respon.id;
                        trans.isSales = 'N';
                        return createTrans(trans, success, error);
                    }, error);
                },
                updatePurchase: function (trans, success, error) {
                    getPurchaseType(function (respon) {
                        if (!respon) {
                            return error('C_DocType_ID tidak ditemukan.');
                        }
                        trans.idType = respon.id;
                        trans.isSales = 'N';
                        return updateTrans(trans, success, error);
                    }, error);
                },
                deletePurchase: deleteTrans,
                deleteTrans: deleteTrans,
                completeTrans: completeTrans,
                cancelTrans: cancelTrans,
                createPOS: function (trans, success, error) {
                    getPOSType(function (respon) {
                        if (!respon) {
                            return error('C_DocType_ID tidak ditemukan.');
                        }
                        trans.idType = respon.id;
                        getPartnerPOS(function (respon) {
                            if (!respon) {
                                return error('C_BPartner_ID tidak ditemukan.');
                            }
                            trans.idPartner = respon.id;
                            trans.isSales = 'Y';
                            trans.date = new Date();
                            var tmpTotal = trans.total;
                            return createTrans(trans, function (respon) {
                                trans.id = respon.id;
                                completeTrans(trans, function (respon) {
                                    getInvoices(function (respon) {
                                        if (respon.length > 0) {
                                            var invoice = respon[0];
                                        } else {
                                            console.log('Invoice tidak ditemukan. ID Order : ' + trans.id);
                                            return error('Invoice tidak ditemukan.');
                                        }
                                        trans.idType = '1000008'; // fallback
                                        trans.isReceipt = 'Y';
                                        trans.idCurrency = 303;
                                        getPaymentTypes(function (respon) {
                                            for (var i in respon) {
                                                if (respon[i].name === 'AR Receipt') {
                                                    trans.idType = respon[i].id;
                                                    break;
                                                }
                                            }
                                            trans.ex = ['DocumentNo', 'C_Charge_ID'];
                                            trans.total = trans.total + (trans.tax.rate * trans.total / 100);
                                            createPayment(trans, function (respon) {
                                                var payment = respon;
                                                createPaymentAllocate({
                                                    idPayment: payment.id,
                                                    idInvoice: invoice.id,
                                                    total: trans.total,
                                                    disc: 0,
                                                    sale: 0,
                                                    rest: 0,
                                                    amount: trans.total
                                                }, function (respon) {
                                                    trans.total = tmpTotal;
                                                    completePayment(payment, success, error);
                                                }, error);
                                            }, function (respon) {
                                                trans.total = tmpTotal;
                                                return error(respon);
                                            });
                                        }, error);
                                    }, error, {idTrans: trans.id});
                                }, error);
                            }, error);
                        }, error);
                    }, error);
                },
                cancelPOS: function (trans, success, error) {
                    getInvoices(function (respon) {
                        if (respon.length > 0) {
                            var invoice = respon[0];
                        } else {
                            console.log('Invoice tidak ditemukan. ID Order : ' + trans.id);
                            return cancelTrans(trans, success, error);
                        }
                        getPaymentAllocates(function (respon) {
                            if (respon.length > 0) {
                                var payment = respon[0];
                            } else {
                                console.log('Payment Allocate tidak ditemukan. ID Invoice : ' + invoice.id);
                                return cancelTrans(trans, success, error);
                            }
                            cancelPayment({id: payment.idPayment}, function (respon) {
                                cancelTrans(trans, success, error);
                            }, error);
                        }, error, {idInvoice: invoice.id});
                    }, error, {idTrans: trans.id});
                },
                getInvoices: getInvoices,
                getInvoice: getInvoice,
                getPaymentAllocates: getPaymentAllocates,
                getPaymentTypes: getPaymentTypes,
                completePayment: completePayment,
                cancelPayment: cancelPayment,
                completeAcc: completeAcc,
                cancelAcc: function (trans, success, error) {
                    cancelAcc(trans, function () {
                        cancelInvoice({id: trans.idInvoice}, success, error);
                    }, error);
                },
                createAcc: function (trans, success, error) {
                    createAcc(trans, function (respon) {
                        trans.idAcc = respon.idAcc;
                        completeAcc({id: trans.idAcc}, function (respon) {
                            createInvoice(trans, function (respon) {
                                var tmp = $mp.parseProcess(respon);
                                if (tmp.isError) {
                                    return error(tmp.log);
                                } else {
                                    getInvoice(function (respon) {
                                        if (respon) {
                                            completeInvoice(respon, success, error);
                                        } else {
                                            console.log('Invoice tidak ditemukan. DocumentNo : ' + tmp.id);
                                            return success(trans);
                                        }
                                    }, error, {code: tmp.id});
                                }
                            }, error);
                        }, error);
                    }, error);
                },
                getAccs: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'C_Order_ID:idTrans:=',
                        'warehouse_name:warehouse:or',
                        'product_name:name:or',
                        'Status:status:or',
                        'document_receipt:docRcp:or'
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryInoutView', TableName: 'm_inout_view_ws', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseAcc), respon.WindowTabData.QtyPages);
                    }, error);
                },
                getTransType: getTransType,
                createRMA: createRMA,
//                inventory
                getInventories: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'transaction_id:id:=',
                        'MovementDate:dateFrom-dateTo:between',
                        'DocumentNo:code',
                        'M_Locator_ID:idWarehouse:=',
                        'M_LocatorTo_ID:idLocation:=',
                        'C_DocType_ID:idType:=',
                        'DocumentType:type',
                        'DocStatus:status'
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryInventory', TableName: 'inventory_view', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseInv), respon.WindowTabData.QtyPages);
                    }, error);
                },
                getInventoryDetails: getInventoryDetails,
                getMovementDetails: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'M_Movement_ID:idTrans:='
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'queryDetailMovement', TableName: 'detail_movement', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseMoveDetail), respon.WindowTabData.QtyPages);
                    }, error);
                },
                createInventory: function (trans, success, error) {
                    trans.ex = ['C_BPartner_ID'];
                    if (!trans.code || trans.code === '') {
                        trans.ex.push('DocumentNo');
                    }
//                    NOTE: v.1.0.0.RC-5 - by pass ID CHARGE
//                    getChargeType(function (respon) {
//                        if (!respon) {
//                            return error('C_Charge_ID tidak ditemukan.');
//                        }
//                        trans.idCharge = respon.id;
//
//                    }, error);
                    $soap.post(C_SOAP, 'createData', getCRUDParam({
                        serviceType: 'insertInventory', TableName: 'M_Inventory', Action: 'Create', RecordID: 0,
                        DataRow: prepareFieldParam($mp.parseInvForm(trans, true, trans.ex))
                    })).then(function (respon) {
                        trans.id = $mp.parseStandard(respon).id;
                        if (trans.type && trans.type.toLowerCase().indexOf('opname') < 0) {
                            createInventoryDetails(trans, 0, success, error);
                        } else {
                            createOpnameDetails(trans, function (respon) {
                                success(trans);
                            }, error);
                        }
                    }, error);

                },
                createOpnameDetails: createOpnameDetails,
                createMovement: function (trans, success, error) {
                    trans.ex = ['M_Warehouse_ID'];
                    if (!trans.code || trans.code === '') {
                        trans.ex.push('DocumentNo');
                    }
                    trans.idPartner = 1000000;
                    $soap.post(C_SOAP, 'createData', getCRUDParam({
                        serviceType: 'insertMovement', TableName: 'M_Movement', Action: 'Create', RecordID: 0,
                        DataRow: prepareFieldParam($mp.parseInvForm(trans, true, trans.ex))
                    })).then(function (respon) {
                        var count = 0;
                        var total = trans.details.length;
                        trans.id = $mp.parseStandard(respon).id;
                        for (var i in trans.details) {
                            var item = trans.details[i];
                            item.idTrans = trans.id;
                            item.idLocation = trans.idLocation;
                            item.idWarehouse = trans.idWarehouse;
                            $soap.post(C_SOAP, 'createData', getCRUDParam({
                                serviceType: 'insertMovementLine', TableName: 'M_MovementLine', Action: 'Create', RecordID: 0,
                                DataRow: prepareFieldParam($mp.parseMoveDetailForm(item, true))
                            })).then(function (respon) {
                                count++;
                                if (count >= total) {
                                    success(respon);
                                }
                            }, error);
                        }
                    }, error);
                },
                updateInventory: function (trans, success, error) {
                    var onRespon = function (respon) {
                        createInventoryDetails(trans, 0, success, error);
                    };
                    trans.ex = ['C_BPartner_ID', 'C_DocType_ID'];
                    if (!trans.code || trans.code === '') {
                        trans.ex.push('DocumentNo');
                    }
//                    NOTE: v.1.0.0.RC-5 - by pass ID CHARGE
//                    getChargeType(function (respon) {
//                        if (!respon) {
//                            return error('C_Charge_ID tidak ditemukan.');
//                        }
//                        trans.idCharge = respon.id;
//
//                    }, error);
                    $soap.post(C_SOAP, 'updateData', getCRUDParam({
                        serviceType: 'updateinventory', TableName: 'M_Inventory', Action: 'Update', RecordID: trans.id,
                        DataRow: prepareFieldParam($mp.parseInvForm(trans, true, trans.ex))
                    })).then(function (respon) {
                        var count = 0;
                        var total = trans.oldDetails.length;
                        if (total === 0) {
                            return onRespon(respon);
                        }
                        for (var i in trans.oldDetails) {
                            $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                                serviceType: 'deleteInventoryLine', TableName: 'M_InventoryLine', Action: 'Delete', RecordID: trans.oldDetails[i].idDet
                            })).then(function (respon) {
                                count++;
                                if (count >= total) {
                                    onRespon(respon);
                                }
                            }, error);
                        }
                    }, error);
                },
                updateMovement: function (trans, success, error) {
                    var onRespon = function (respon) {
                        var count = 0;
                        var total = trans.details.length;
                        if (total === 0) {
                            success(respon);
                        }
                        for (var i in trans.details) {
                            var item = trans.details[i];
                            item.idTrans = trans.id;
                            item.idLocation = trans.idLocation;
                            item.idWarehouse = trans.idWarehouse;
                            $soap.post(C_SOAP, 'createData', getCRUDParam({
                                serviceType: 'insertMovementLine', TableName: 'M_MovementLine', Action: 'Create', RecordID: 0,
                                DataRow: prepareFieldParam($mp.parseMoveDetailForm(item, true))
                            })).then(function (respon) {
                                count++;
                                if (count >= total) {
                                    success(respon);
                                }
                            }, error);
                        }
                    };
                    trans.ex = ['M_Warehouse_ID', 'C_DocType_ID'];
                    if (!trans.code || trans.code === '') {
                        trans.ex.push('DocumentNo');
                    }
                    trans.idPartner = 1000000;
                    $soap.post(C_SOAP, 'updateData', getCRUDParam({
                        serviceType: 'updateMovement', TableName: 'M_Movement', Action: 'Update', RecordID: trans.id,
                        DataRow: prepareFieldParam($mp.parseInvForm(trans, true, trans.ex))
                    })).then(function (respon) {
                        var count = 0;
                        var total = trans.oldDetails.length;
                        if (total === 0) {
                            return onRespon(respon);
                        }
                        for (var i in trans.oldDetails) {
                            $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                                serviceType: 'deleteMovementLine', TableName: 'M_MovementLine', Action: 'Delete', RecordID: trans.oldDetails[i].idDet
                            })).then(function (respon) {
                                count++;
                                if (count >= total) {
                                    onRespon(respon);
                                }
                            }, error);
                        }
                    }, error);
                },
                deleteInventory: function (trans, success, error) {
                    var count = 0;
                    var total = trans.details ? trans.details.length : 0;
                    var onDelete = function () {
                        $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                            serviceType: 'deleteInventory', TableName: 'M_Inventory', Action: 'Delete', RecordID: trans.id
                        })).then(function (respon) {
                            success(respon);
                        }, error);
                    };
                    if (total === 0) {
                        return onDelete();
                    }
                    for (var i in trans.details) {
                        $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                            serviceType: 'deleteInventoryLine', TableName: 'M_InventoryLine', Action: 'Delete', RecordID: trans.details[i].idDet
                        })).then(function (respon) {
                            count++;
                            if (count >= total) {
                                onDelete();
                            }
                        }, error);
                    }
                },
                deleteMovement: function (trans, success, error) {
                    var count = 0;
                    var total = trans.details ? trans.details.length : 0;
                    var onDelete = function () {
                        $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                            serviceType: 'deleteMovement', TableName: 'M_Movement', Action: 'Delete', RecordID: trans.id
                        })).then(function (respon) {
                            success(respon);
                        }, error);
                    };
                    if (total === 0) {
                        return onDelete();
                    }
                    for (var i in trans.details) {
                        $soap.post(C_SOAP, 'deleteData', getCRUDParam({
                            serviceType: 'deleteMovementLine', TableName: 'M_MovementLine', Action: 'Delete', RecordID: trans.details[i].idDet
                        })).then(function (respon) {
                            count++;
                            if (count >= total) {
                                onDelete();
                            }
                        }, error);
                    }
                },
                completeInventory: function (trans, success, error) {
                    $soap.post(C_SOAP, 'setDocAction', getDocParam({
                        serviceType: 'actionCompleteInventory', TableName: 'M_Inventory', docAction: 'CO', recordID: trans.id
                    })).then(function (respon) {
                        success(respon);
                    }, error);
                },
                cancelInventory: function (trans, success, error) {
                    $soap.post(C_SOAP, 'setDocAction', getDocParam({
                        serviceType: 'actionCancelInventory', TableName: 'M_Inventory', docAction: 'VO', recordID: trans.id
                    })).then(function (respon) {
                        success(respon);
                    }, error);
                },
                completeMovement: function (trans, success, error) {
                    $soap.post(C_SOAP, 'setDocAction', getDocParam({
                        serviceType: 'actionCompleteMovement', TableName: 'M_Movement', docAction: 'CO', recordID: trans.id
                    })).then(function (respon) {
                        success(respon);
                    }, error);
                },
                cancelMovement: function (trans, success, error) {
                    $soap.post(C_SOAP, 'setDocAction', getDocParam({
                        serviceType: 'actionCancelMovement', TableName: 'M_Movement', docAction: 'VO', recordID: trans.id
                    })).then(function (respon) {
                        success(respon);
                    }, error);
                },
//                payments
                getAccounts: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'C_BankAccount_ID:id:=',
                        'AD_Org_ID:idOrg:=',
                        'bank_account:keyword:or',
                        'bank_name:keyword:or'
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'query_c_bankaccount_sum_v_ws', TableName: 'c_bankaccount_sum_v_ws', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='bank_active'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseAccount), respon.WindowTabData.QtyPages);
                    }, error);
                },
                getCashOnHand: function (success, error) {
                    var loginUser = $ls.getObject(C_SESSION, null);
                    $http.post(C_WS + 'getcashonhand/' + loginUser.OrgID + "/" + loginUser.ClientID).then(success, error);
                },
                getAccountBalance: function (success, error, filter) {
                    $http.post(C_WS + 'getaccountbalance/' + filter.id + '/' + $mp.toSQLDatetime(filter.dateFrom, true)).then(success, error);
                },
                getAccountSum: function (success, error, filter) {
                    $http.post(C_WS + 'getaccountsum/' + filter.id + '/' + $mp.toSQLDatetime(filter.dateFrom, true) + '/' + $mp.toSQLDatetime(filter.dateTo, true)).then(success, error);
                },
                getAccountPayments: function (success, error, filter) {
                    var filterSql = prepareFilter(filter, [
                        'C_BankAccount_ID:id:=',
                        'C_Payment_ID:idPayment:=',
                        'DateTrx:dateFrom-dateTo:between'
                    ]);
                    $soap.post(C_SOAP, 'queryData', getCRUDParam({
                        serviceType: 'query_c_bankaccount_v_ws', TableName: 'c_bankaccount_v_ws', Filter: filterSql, Action: 'Read', PageNo: filter ? filter.page || 0 : 0,
                        DataRow: {
                            field_ATTR: [
                                "column='IsActive'",
                                {
                                    val: 'Y'
                                }
                            ]
                        }
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseAccountPayment), respon.WindowTabData.QtyPages);
                    }, error);
                },
                getPaymentDetails: getPaymentDetails,
                getCharges: function (success, error, filter) {
                    $soap.post(C_SOAP, 'getList', getListParam({
                        serviceType: 'listCharge', AD_Reference_ID: 1000009
                    })).then(function (respon) {
                        success($mp.parseArray(respon.WindowTabData.DataSet, $mp.parseCharge), 0);
                    }, error);
                },
                createPayment: function (trans, success, error) {
                    trans.ex = ['C_Charge_ID'];
                    trans.isReceipt = trans.type.name.indexOf('AR') > -1 ? 'Y' : 'N';
                    trans.idCurrency = 303;
                    trans.idBank = trans.id;
                    if (trans.method === 'C') {
                        if (trans.details.length > 0) {
                            trans.idCharge = trans.details[0].idCharge;
                            trans.ex = [];
                        }
                    }
                    if (!trans.code || trans.code === '') {
                        trans.ex.push('DocumentNo');
                    }
                    createPayment(trans, function (respon) {
                        var payment = respon;
                        if (trans.method === 'I') {
                            var count = 0;
                            var total = trans.details.length;
                            for (var i in trans.details) {
                                var item = trans.details[i];
                                createPaymentAllocate({
                                    idPayment: payment.id,
                                    idInvoice: item.id,
                                    total: item.total,
                                    disc: 0,
                                    sale: 0,
                                    rest: item.total - item.amount,
                                    amount: item.amount
                                }, function (respon) {
                                    count++;
                                    if (count >= total) {
                                        completePayment(payment, success, error);
                                    }
                                }, error);
                            }
                        } else {
                            completePayment(payment, success, error);
                        }
                    }, error);
                }
            };
        });