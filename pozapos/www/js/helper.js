/* global angular */

angular.module('apclient-helper', [])

//        general helper
        .factory('$helper', function () {
            return {
                compressImage: function (data, opt, success) {
                    var def = {
                        w: 400,
                        h: 200,
                        x: 0,
                        y: 0,
                        tw: 400,
                        th: 200,
                        tx: 0,
                        ty: 0,
                        r: false,
                        q: 0.7
                    };
                    var canvas = document.getElementById(opt.id);
                    canvas.width = opt.cw || def.w;
                    canvas.height = opt.ch || def.h;

                    var image = new Image();
//                    FILE
//                    var r = new FileReader();
//                    r.onloadend = function (e) {
//                        image.src = e.target.result;
//                    };
//                    r.readAsDataURL(file);
                    image.src = data;
                    image.onload = function () {
                        if (opt.r || def.r) {
                            var rw = image.width / opt.tw;
                            var rh = image.height / opt.th;
                            var rr = (image.width > image.height) ? rh : rw;

                            opt.w = opt.tw * rr;
                            opt.h = opt.th * rr;
                        }
                        canvas.getContext('2d').drawImage(
                                image,
                                opt.x || def.x,
                                opt.y || def.y,
                                opt.w || def.w,
                                opt.h || def.h,
                                opt.tx || def.tx,
                                opt.ty || def.ty,
                                opt.tw || def.tw,
                                opt.th || def.th
                                );
                        success(canvas.toDataURL('image/jpeg', opt.q || def.q), image);
                    };
                }
            };
        });

        