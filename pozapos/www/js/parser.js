/* global angular */

angular.module('apclient-parser', [])

        .factory('$mp', function () {

            var parseObject = function (json, map, to, ex) {
                var obj = new Object();
                for (var i in map) {
                    var p = map[i].split(':');
                    var p1 = (to) ? p[0] : p[1];
                    var p2 = (to) ? p[1] : p[0];
                    var excluded = false;
                    if (ex) {
                        for (var j in ex) {
                            if (ex[j] === p1 || ex[j] === p2) {
                                excluded = true;
                                break;
                            }
                        }
                    }
                    if (!excluded) {
                        obj[p1] = (p.length > 2 && !json[p2]) ? parseValue(p[2]) : parseValue(json[p2], p2, to);
                    }
                }
                return obj;
            };
            var parseValue = function (val, key, to) {
                if (key && key.toLowerCase().indexOf('date') > -1) {
                    if (val && !to) {
                        var t = val.split(/[- : T]/);
                        if (t.length > 4) {
                            var d = new Date(parseInt(t[0]), parseInt(t[1]) - 1, parseInt(t[2]), parseInt(t[3]), parseInt(t[4]), parseInt(t[5]));
                            return new Date(d);
                        }
                    }
                    return to ? toSQLDatetime(val) : new Date(val);
                } else if (val === 'true') {
                    return true;
                } else if (val === 'false') {
                    return false;
                } else {
                    return val;
                }
            };
            var toSQLDatetime = function (date, only) {
                if (date) {
                    var mon = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
                    var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
                    return only ? date.getFullYear() + "-" + mon + "-" + day : date.getFullYear() + "-" + mon + "-" + day + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                }
                return null;
            };

            return {
                toSQLDatetime: toSQLDatetime,
                parseObject: parseObject,
                parseArrayObject: function (jsons, map, to, ex) {
                    var objs = [];
                    for (var i in jsons) {
                        objs.push(parseObject(jsons[i], map, to, ex));
                    }
                    return objs;
                },
                parseArray: function (jsons, parser, to, ex) {
                    var objs = [];
                    for (var i in jsons) {
                        objs.push(parser(jsons[i], to, ex));
                    }
                    return objs;
                },
                parseStandard: function (json, to, ex) {
                    return parseObject(json.StandardResponse, [
                        'RecordID:id'
                    ], to, ex);
                },
                parseProcess: function (json, to, ex) {
                    return parseObject(json.RunProcessResponse, [
                        'IsError:isError',
                        'LogInfo:log',
                        'Summary:id'
                    ], to, ex);
                },
                parsePrinterBarcode: function (json, to, ex) {
                    return parseObject(json, ['AD_Printer_Format_ID:id', 'IsDefault:isDefault', 'FormatType:format', 'PrinterName:name'], to, ex);
                },
                parseWarehouse: function (json, to, ex) {
                    return parseObject(json, ['M_Warehouse_ID:id', 'Name:name'], to, ex);
                },
                parseWarehouseUser: function (json, to, ex) {
                    return parseObject(json, ['M_Warehouse_ID:id', 'AD_User_ID:idUser', 'Name:name'], to, ex);
                },
                parseCategory: function (json, to, ex) {
                    return parseObject(json, ['M_Product_Category_ID:id', 'Name:name'], to, ex);
                },
                parseBPGroup: function (json, to, ex) {
                    return parseObject(json, ['C_BP_Group_ID:id', 'Name:name'], to, ex);
                },
                parseInvWarehouse: function (json, to, ex) {
                    return parseObject(json, ['M_Locator_ID:id', 'Value:name'], to, ex);
                },
                parseInvCategory: function (json, to, ex) {
                    return parseObject(json, ['C_DocType_ID:id', 'Name:name'], to, ex);
                },
                parsePOSBank: function (json, to, ex) {
                    return parseObject(json, ['C_BankAccount_ID:id', 'Name:name'], to, ex);
                },
                parsePricelist: function (json, to, ex) {
                    return parseObject(json, ['M_PriceList_Version_ID:idVersion', 'M_PriceList_ID:idPrice'], to, ex);
                },
                parseTax: function (json, to, ex) {
                    return parseObject(json, ['C_Tax_ID:id', 'Name:name', 'Rate:rate'], to, ex);
                },
//                product
                parseProduct: function (json, to, ex) {
                    return parseObject(json, [
                        'M_Product_ID:id',
                        'Product:name',
                        'Value:code',
                        'Description:desc',
                        'M_Product_Category_ID:idCategory',
                        'Category:category',
                        'M_Warehouse_ID:idWarehouse',
                        'warehouse:warehouse',
                        'PriceList:salesprice',
                        'CurrentCostPrice:purchaseprice',
                        'QtyOnHand:qty',
                        'C_UOM_ID:idUOM',
                        'C_TaxCategory_ID:idTaxCategory',
                        'ImageURL:image',
                        'UOMSymbol:unit',
                        'IsStocked:isStocked',
                        'IsSold:isSold',
                        'IsPurchased:isPurchased'
                    ], to, ex);
                },
                parseProductMaster: function (json, to, ex) {
                    return parseObject(json, [
                        'M_Product_ID:id',
                        'Name:name',
                        'Value:code',
                        'Description:desc',
                        'ImageURL:image',
                        'UOMSymbol:unit',
                        'IsStocked:isStocked',
                        'IsSold:isSold',
                        'IsPurchased:isPurchased'
                    ], to, ex);
                },
                parseProductForm: function (json, to, ex) {
                    if (to) {
                        json.isStocked = json.isStocked ? 'Y' : 'N';
                        json.isSold = json.isSold ? 'Y' : 'N';
                        json.isPurchased = json.isPurchased ? 'Y' : 'N';
                    }
                    return parseObject(json, [
                        'Name:name',
                        'Value:code',
                        'M_Product_Category_ID:idCategory',
                        'AD_Org_ID:idOrg',
                        'Description:desc',
                        'C_UOM_ID:idUOM',
                        'IsStocked:isStocked',
                        'IsSold:isSold',
                        'IsPurchased:isPurchased',
                        'C_TaxCategory_ID:idTaxCategory',
                        'ImageURL:image'
                    ], to, ex);
                },
                parseProductPrice: function (json, to, ex) {
                    return parseObject(json, [
                        'M_PriceList_Version_ID:idVersion',
//                        'M_PriceList_ID:idPrice',
                        'M_Product_ID:id',
                        'PriceList:salesprice',
                        'PriceLimit:salesprice',
                        'PriceStd:salesprice'
                    ], to, ex);
                },
//                partner
                parsePartner: function (json, to, ex) {
                    return parseObject(json, [
                        'C_BPartner_ID:id',
                        'C_BP_Group_ID:idBpGroup',
                        'C_BPartner_Location_ID:idLocation',
                        'C_Location_ID:idAddress',
                        'groupname:bpGroup',
                        'Name:name',
                        'bp_value:code',
                        'Description:desc',
                        'Address1:address',
                        'TotalOpenBalance:loan',
                        'City:city',
                        'Phone:phone',
                        'Phone2:phone2',
                        'IsActive:isActive',
                        'ImageURL:image'
                    ], to, ex);
                },
                parsePartnerForm: function (json, to, ex) {
                    if (to) {
                        json.isActive = json.status ? 'Y' : 'N';
                        json.isCustomer = 'N';
                        json.isVendor = 'N';
                        json.isEmployee = 'N';
                        if (json.bpGroup.indexOf('Customer') > -1) {
                            json.isCustomer = 'Y';
                        } else if (json.bpGroup.indexOf('Vendor') > -1) {
                            json.isVendor = 'Y';
                        } else {
                            json.isEmployee = 'Y';
                        }
                    }
                    return parseObject(json, [
                        'Name:name',
                        'Value:code',
                        'C_BP_Group_ID:idBpGroup',
                        'AD_Org_ID:idOrg',
                        'Description:desc',
                        'IsCustomer:isCustomer',
                        'IsEmployee:isEmployee',
                        'IsVendor:isVendor',
                        'IsActive:isActive',
                        'ImageURL:image'
                    ], to, ex);
                },
                parsePartnerAddress: function (json, to, ex) {
                    return parseObject(json, [
                        'Address1:address',
                        'City:city',
                    ], to, ex);
                },
                parsePartnerLocation: function (json, to, ex) {
                    return parseObject(json, [
                        'C_BPartner_ID:id',
                        'C_Location_ID:idAddress',
                        'Name:city',
                        'Phone:phone',
                        'Phone2:phone2',
                    ], to, ex);
                },
//                transactions
                parseTrans: function (json, to, ex) {
                    return parseObject(json, [
                        'C_Order_ID:id',
                        'AD_Client_ID:idClient',
                        'AD_Org_ID:idOrg',
                        'C_BPartner_ID:idPartner',
                        'BPName:partner',
                        'BPValue:codePartner',
                        'C_BPartner_Location_ID:idBpLocation',
                        'M_Warehouse_ID:idWarehouse',
                        'M_Locator_ID:idLocation',
                        'warehouse_name:warehouse',
                        'M_PriceList_ID:idPrice',
                        'DateOrdered:date',
                        'Description:desc',
                        'DocumentNo:code',
                        'GrandTotal:total',
                        'PayAmt:totalPaid',
                        'Status:status',
                        'status_bayar:statusPaid',
                        'IsSOTrx:isSales'
                    ], to, ex);
                },
                parseTransForm: function (json, to, ex) {
                    return parseObject(json, [
                        'DocumentNo:code',
                        'C_BPartner_ID:idPartner',
//                        'GrandTotal:total',
                        'Description:desc',
                        'DateOrdered:date',
                        'DateAcct:date',
                        'C_DocType_ID:idType',
                        'C_DocTypeTarget_ID:idType',
                        'IsSOTrx:isSales',
                        'PaymentRule:method'
                    ], to, ex);
                },
                parseTransDetail: function (json, to, ex) {
                    return parseObject(json, [
                        'M_Product_ID:id',
                        'C_OrderLine_ID:idDet',
                        'C_Tax_ID:idTax',
                        'Rate:rate',
                        'name_tax:tax',
                        'PriceList:price',
                        'ProductName:name',
                        'product_code:code',
                        'QtyOrdered:amount',
                        'QtyDelivered:amountDelivered',
                        'QtyOnHand:qty',
                        'whname:warehouse',
                        'ImageURL:image',
                        'UOMSymbol:unit'
                    ], to, ex);
                },
                parseTransDetailForm: function (json, to, ex) {
                    return parseObject(json, [
                        'C_Order_ID:idTrans',
                        'C_Tax_ID:idTax',
                        'QtyEntered:amount',
                        'QtyOrdered:amount',
                        'PriceEntered:price',
                        'PriceActual:price',
                        'M_Product_ID:id'
                    ], to, ex);
                },
                parseTransType: function (json, to, ex) {
                    return parseObject(json, [
                        'C_DocType_ID:id',
                        'Name:name'
                    ], to, ex);
                },
                parseTransPartner: function (json, to, ex) {
                    return parseObject(json, [
                        'C_Order_ID:id',
                        'AD_Client_ID:idClient',
                        'AD_Org_ID:idOrg',
                        'order_by_partner_v_ID:idView',
                        'C_BPartner_ID:idPartner',
                        'business_partner:partner',
                        'DateOrdered:date',
                        'Description:desc',
                        'DocumentNo:code',
                        'GrandTotal:total',
                        'DocStatus:status',
                        'IsSOTrx:isSales'
                    ], to, ex);
                },
                parseSalesProduct: function (json, to, ex) {
                    return parseObject(json, [
                        'AD_Client_ID:idClient',
                        'AD_Org_ID:idOrg',
                        'C_BPartner_ID:idPartner',
                        'business_partner:partner',
                        'C_Order_ID:id',
                        'DateOrdered:date',
                        'DocumentNo:code',
                        'IsActive:isActive',
                        'M_Product_ID:idProduct',
                        'Product:product',
                        'PriceActual:total',
                        'QtyOrdered:qty',
                        'QtyDelivered:acc',
                        'qtyretur:retur',
                        'Status:status',
                        'sales_by_product_ID:idView',
                        'IsSOTrx:isSales:true'
                    ], to, ex);
                },
                parsePurchaseProduct: function (json, to, ex) {
                    return parseObject(json, [
                        'AD_Client_ID:idClient',
                        'AD_Org_ID:idOrg',
                        'C_BPartner_ID:idPartner',
                        'business_partner:partner',
                        'C_Order_ID:id',
                        'DateOrdered:date',
                        'DocumentNo:code',
                        'IsActive:isActive',
                        'M_Product_ID:idProduct',
                        'Product:product',
                        'PriceActual:total',
                        'QtyOrdered:qty',
                        'QtyDelivered:acc',
                        'qtyretur:retur',
                        'Status:status',
                        'purchase_by_product_ID:idView',
                        'IsSOTrx:isSales:false'
                    ], to, ex);
                },
                parseInvoice: function (json, to, ex) {
                    return parseObject(json, [
                        'C_BPartner_ID:idPartner',
                        'C_Invoice_ID:id',
                        'C_Order_ID:idTrans',
                        'DateOrdered:date',
                        'GrandTotal:rest',
                        'total_invoice:total',
                        'IsActive:isActive',
                        'IsSOTrx:isSales',
                        'M_InOut_ID:idAcc',
                        'business_partner:partner',
                        'document_inout:docAcc',
                        'document_invoice:docInv',
                        'document_order:docOrder',
                        'document_receipt:docRcp',
                        'document_type:docType',
                        'list_invoice_view_ID:idView'
                    ], to, ex);
                },
                parseInvoiceOnly: function (json, to, ex) {
                    return parseObject(json, [
                        'C_Invoice_ID:id',
                        'C_Order_ID:idTrans',
                        'DateInvoiced:date',
                        'DocumentNo:code',
                        'M_PriceList_ID:idPrice'
                    ], to, ex);
                },
                parsePaymentType: function (json, to, ex) {
                    return parseObject(json, [
                        'C_DocType_ID:id',
                        'Name:name'
                    ], to, ex);
                },
                parsePaymentForm: function (json, to, ex) {
                    return parseObject(json, [
                        'C_BPartner_ID:idPartner',
                        'C_DocType_ID:idType',
                        'IsReceipt:isReceipt',
                        'Description:desc',
                        'DateTrx:date',
                        'PayAmt:total',
                        'C_BankAccount_ID:idBank',
                        'C_Currency_ID:idCurrency',
                        'C_Charge_ID:idCharge',
                        'DocumentNo:code'
                    ], to, ex);
                },
                parsePaymentAllocateForm: function (json, to, ex) {
                    return parseObject(json, [
                        'C_Payment_ID:idPayment',
                        'C_Invoice_ID:idInvoice',
                        'InvoiceAmt:total',
                        'DiscountAmt:disc',
                        'WriteOffAmt:sale',
                        'Amount:amount',
                        'OverUnderAmt:rest'
                    ], to, ex);
                },
                parsePaymentAllocate: function (json, to, ex) {
                    return parseObject(json, [
                        'AD_Client_ID:idClient',
                        'AD_Org_ID:idOrg',
                        'Amount:amount',
                        'C_BPartner_ID:idPartner',
                        'C_Invoice_ID:idInvoice',
                        'C_Order_ID:idTrans',
                        'C_PaymentAllocate_ID:id',
                        'C_Payment_ID:idPayment',
                        'C_BankAccount_ID:idBank',
                        'DateTrx:date',
                        'DiscountAmt:disc',
                        'DocumentNo:code',
                        'InvoiceAmt:total',
                        'IsActive:isActive',
                        'WriteOffAmt:sale',
                        'c_c_paymentallocate_v_ws_id:idView',
                        'invoice:invoice',
                        'name_partner:partner',
                        'order_no:codeTrans'
                    ], to, ex);
                },
                parseAcc: function (json, to, ex) {
                    return parseObject(json, [
                        'C_Invoice_ID:idInvoice',
                        'C_OrderLine_ID:idTrans',
                        'C_Order_ID:id',
                        'DocStatus:statusDoc',
                        'ImageURL:image',
                        'IsActive:isActive',
                        'M_InOutLine_ID:idDet',
                        'M_InOut_ID:id',
                        'M_Product_ID:idProduct',
                        'M_Warehouse_ID:idWarehouse',
                        'MovementDate:date',
                        'MovementQty:amount',
                        'Status:status',
                        'document_invoice:docInv',
                        'document_order:docOrder',
                        'document_receipt:docRcp',
                        'm_inout_v_ws_ID:idView',
                        'm_inout_view_ws_ID:idDetView',
                        'product_name:name',
                        'warehouse_name:warehouse',
                        'UOMSymbol:unit',
                        'qty_rma:rma',
                        'M_RMA_ID:idRMA',
                        'M_RMALine_ID:idDetRMA'
                    ], to, ex);
                },
                parseAccForm: function (json, to, ex) {
                    return parseObject(json, [
                        'C_BPartner_ID:idPartner',
                        'MovementDate:date',
                        'C_BPartner_Location_ID:idBpLocation',
                        'C_Order_ID:id',
                        'C_DocType_ID:idType',
                        'MovementType:idMovement',
                        'M_Warehouse_ID:idWarehouse'
                    ], to, ex);
                },
                parseAccDetailForm: function (json, to, ex) {
                    return parseObject(json, [
                        'M_InOut_ID:idAcc',
                        'M_Product_ID:id',
                        'C_OrderLine_ID:idDet',
                        'QtyEntered:amountAcc',
                        'MovementQty:amountAcc',
                        'M_Locator_ID:idLocation'
                    ], to, ex);
                },
                parseRMAType: function (json, to, ex) {
                    return parseObject(json, [
                        'M_RMAType_ID:id',
                        'Name:name'
                    ], to, ex);
                },
                parseRMAForm: function (json, to, ex) {
                    return parseObject(json, [
                        'C_BPartner_ID:idPartner',
                        'InOut_ID:idAcc',
                        'C_DocType_ID:idType',
                        'Name:name',
                        'SalesRep_ID:idUser',
                        'IsSOTrx:isSales',
                        'M_RMAType_ID:idRMAType'
                    ], to, ex);
                },
                parseRMADetailForm: function (json, to, ex) {
                    return parseObject(json, [
                        'M_RMA_ID:idTrans',
                        'M_InOutLine_ID:idDetAcc',
                        'Qty:amount'
                    ], to, ex);
                },
                parseRMAAccForm: function (json, to, ex) {
                    return parseObject(json, [
                        'C_BPartner_ID:idPartner',
                        'MovementDate:date',
                        'C_BPartner_Location_ID:idBpLocation',
                        'M_RMA_ID:id',
                        'C_DocType_ID:idType',
                        'MovementType:idMovement',
                        'M_Warehouse_ID:idWarehouse'
                    ], to, ex);
                },
                parseRMAAccDetailForm: function (json, to, ex) {
                    return parseObject(json, [
                        'M_InOut_ID:idAcc',
                        'M_Product_ID:idProduct',
                        'M_RMALine_ID:idDetRma',
                        'QtyEntered:amountRma',
                        'MovementQty:amountRma',
                        'M_Locator_ID:idLocation'
                    ], to, ex);
                },
//                inventory
                parseInv: function (json, to, ex) {
                    return parseObject(json, [
                        'inventory_view_ID:idView',
                        'transaction_id:id',
                        'DocumentNo:code',
                        'MovementDate:date',
                        'C_BPartner_ID:idPartner',
                        'partner_name:partner',
                        'C_DocType_ID:idType',
                        'DocumentType:type',
                        'DocStatus:status',
                        'M_Warehouse_ID:idWarehouse',
                        'warehouse:warehouse',
                        'locator:location',
                        'locatorto:locationTo',
                        'DocumentType:type',
                        'Description:desc'
                    ], to, ex);
                },
                parseInvForm: function (json, to, ex) {
                    return parseObject(json, [
                        'DocumentNo:code',
//                        'DocStatus:status',
                        'M_Warehouse_ID:idWarehouse',
                        'C_DocType_ID:idType',
                        'MovementDate:date',
                        'Description:desc',
                        'C_BPartner_ID:idPartner'
                    ], to, ex);
                },
                parseInvDetail: function (json, to, ex) {
                    var obj = parseObject(json, [
                        'M_Inventory_ID:idTrans',
                        'M_InventoryLine_ID:idDet',
                        'Product:name',
                        'product_code:code',
                        'QtyOnHand:qty',
                        'QtyBook:qtyBook',
                        'QtyInternalUse:amountInternal',
                        'QtyCount:amount',
                        'M_Product_ID:id',
                        'M_Locator_ID:idWarehouse',
                        'ImageURL:image',
                        'UOMSymbol:unit',
                        'C_Charge_ID:idCharge'
                    ], to, ex);
                    obj.amount = obj.amount === '0' ? obj.amountInternal : obj.amount;
                    return obj;
                },
                parseMoveDetail: function (json, to, ex) {
                    return parseObject(json, [
                        'M_Movement_ID:idTrans',
                        'M_MovementLine_ID:idDet',
                        'Product:name',
                        'product_code:code',
                        'QtyOnHand:qty',
                        'MovementQty:amount',
                        'M_Product_ID:id',
                        'locator:warehouse',
                        'M_Locator_ID:idWarehouse',
                        'locatorto:location',
                        'M_LocatorTo_ID:idLocation',
                        'ImageURL:image',
                        'UOMSymbol:unit'
                    ], to, ex);
                },
                parseInvDetailForm: function (json, to, ex) {
                    return parseObject(json, [
                        'M_Inventory_ID:idTrans',
                        'InventoryType:type',
                        'C_Charge_ID:idCharge',
                        'QtyInternalUse:amountInternal',
                        'QtyCount:amount',
                        'QtyBook:qtyBook',
                        'M_Product_ID:id',
                        'M_Locator_ID:idWarehouse'
                    ], to, ex);
                },
                parseMoveDetailForm: function (json, to, ex) {
                    return parseObject(json, [
                        'M_Movement_ID:idTrans',
                        'MovementQty:amount',
                        'M_Product_ID:id',
                        'M_Locator_ID:idWarehouse',
                        'M_LocatorTo_ID:idLocation'
                    ], to, ex);
                },
//                payment
                parseAccount: function (json, to, ex) {
                    return parseObject(json, [
                        'AD_Client_ID:idClient',
                        'AD_Org_ID:idOrg',
                        'C_BankAccount_ID:id',
                        'C_Bank_ID:idBank',
                        'bank_account:account',
                        'bank_name:name',
                        'currency:currency',
                        'PayAmt:balance',
                        'bank_account:isActive'
                    ], to, ex);
                },
                parseAccountPayment: function (json, to, ex) {
                    return parseObject(json, [
                        'C_BPartner_ID:idPartner',
                        'C_BankAccount_ID:id',
                        'C_Bank_ID:idBank',
                        'C_Payment_ID:idPayment',
                        'C_DocType_ID:idType',
                        'document_type:type',
                        'DateTrx:date',
                        'DocumentNo:code',
                        'PayAmt:total',
                        'bank:bank',
                        'AccountNo:account',
                        'business_partner:partner',
                        'charge_name:charge',
                        'C_Charge_ID:idCharge',
                        'Description:desc',
                        'Status:status'
                    ], to, ex);
                },
                parseCharge: function (json, to, ex) {
                    return parseObject(json, [
                        'Name:charge',
                        'C_Charge_ID:idCharge'
                    ], to, ex);
                }
            };
        });