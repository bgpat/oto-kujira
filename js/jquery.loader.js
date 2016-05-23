/*! Copyright (c) 2014 bgpat (bgpat.tak@gmail.com)
 * Licensed under the MIT License.
 * Version: 0.1
 * Requires: jQuery 1.6.0+
 */

jQuery(function() {
    jQuery.extend({
        loader: function(data, complete, progress) {
            complete = complete ||
            function() {
            };
            progress = progress ||
            function() {
            };
            var xhrs = {};
            var datas = {};
            var res = {};
            var length = 0;
            var n = 0;
            for (var name in data) {
                length++;
                (function(a) {
                    res[name] = null;
                    $.ajax($.extend(data[a], {
                        success: function(data, status, xhr) {
                            xhrs[a] = xhr;
                            datas[a] = data;
                            res[a] = {
                                data: data,
                                xhr: xhr,
                                status: status
                            };
                            progress(res, ++n, length);
                            for (var _name in res) {
                                if ((function(name) {
                                    if (res[name] === null) {
                                        return true;
                                    }
                                    return false;
                                })(_name)) {
                                    return;
                                }
                            }
                            complete(datas, xhrs);
                        },
                        error: function(xhr, status, data) {
                            res[a] = {
                                data: data,
                                xhr: xhr,
                                status: status
                            };
                            xhrs[a] = xhr;
                            datas[a] = data;
                            progress(res, ++n, length);
                            for (var _name in res) {
                                if ((function(name) {
                                    if (res[name] === null) {
                                        return true;
                                    }
                                    return false;
                                })(_name)) {
                                    return;
                                }
                            }
                            complete(datas, xhrs);
                        }
                    }));
                })(name);
            }
            length || complete(null);
        }
    });
});
