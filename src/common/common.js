/**
 * --------------------------------------------------------------------------
 * common.js
 * --------------------------------------------------------------------------
 */

export default {
    /**
     * get the tenant name of current page, e.g.
     * return 'bqsq' from http://localhost:3000/t/bqsq/course/1/view
     */
    getTenantName: function() {
        var pathname = window.location.pathname;
        if (pathname.length == 0) return "";
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        if (pathname.charAt(0) == 't') pathname = pathname.substring(1);
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        return pathname.split('/')[0];
    },
    /**
     * [Deprecated] Get the tenant setting, e.g. {feature: 'book'}
     */
    getTenantSetting: function() {
        var settings = {};
        var el = document.querySelector('tenant-setting');
        if (el) {
            settings.feature = el.getAttribute('feature') || 'common' // default is 'common'
        }
        return settings;
    },
    getTenantConfig: function() {
        if (typeof _getTenantConfig === 'function') {
            return _getTenantConfig();
        }
        return {};
    },
    /**
     * Get the string of public classrooms' id
     * @returns {String} public classrooms' id concat by "," E.g. A,B,C
     */
    getPublicClassroom: function() {
        if (typeof _getTenantConfig === 'function') {
            var tenantConfig = _getTenantConfig()
            var publicRooms = [];
            tenantConfig.classrooms.forEach(function(value) {
                if (value.visibility !== "internal") {
                    publicRooms.push(value.id);
                }
            })
            return publicRooms.join(",");
        }
        return "";
    },
    /**
     * Data fomatter function of bootstrap-table to format date localized string by 'll', e.g. 2022年10月9日
     * 
     * @param {Object} value the field value
     * @param {Object} row the row record data
     * @param {Number} index the row index
     */
    dateFormatter: function(value, row, index) {
        if (value) {
            return moment(value).format('ll');
        } else {
            return undefined;
        }
    },
    /**
     * Data fomatter function of bootstrap-table to format date localized string by 'll', e.g. 2022-10-09
     * 
     * @param {Object} value the field value
     * @param {Object} row the row record data
     * @param {Number} index the row index
     */
    dateFormatter2: function(value, row, index) {
        if (value) {
            return moment(value).format('YYYY-MM-DD');
        } else {
            return undefined;
        }
    },
    /**
     * Datatime fomatter function of bootstrap-table to format date localized string by 'lll', e.g. 2022年10月11日 00:36
     * 
     * @param {Object} value the field value
     * @param {Object} row the row record data
     * @param {Number} index the row index
     */
    datetimeFormatter: function(value, row, index) {
        if (value) {
            return moment(value).format('lll');
        } else {
            return undefined;
        }
    },
    /**
     * CNY fomatter function of bootstrap-table to format money amount, e.g. 8000元
     * 
     * @param {Object} value the field value
     * @param {Object} row the row record data
     * @param {Number} index the row index
     */
    CNYFormatter: function(value, row, index) {
        if (value) {
            return Math.round(value) / 100 + "元";
        } else {
            return "0元";
        }
    },
    /**
     * Calculate the remaining capacity of class object
     * 
     * @cItem {Object} cItem class object
     */
    classRemaining: function(cItem) {
        if (cItem) {
            var booking = cItem.booking || [];
            if (booking.length === 0) return cItem.capacity || 0;
            else {
                var reservation = 0;
                booking.forEach(function(val, index, array) {
                    reservation += (val.quantity || 1);
                });
                return (cItem.capacity || 0) - reservation;
            }
        } else {
            return undefined;
        }
    },
    /**
     * Get the parameter from url
     */
    getParam: function(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var param = window.location.search.substring(1).match(reg);
        return param ? decodeURI(param[2]) : null;
    },
    loadScript: function(src) {
        return new Promise(function(resolve, reject) {
            var s;
            s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = src;
            // Dynamic scripts behave as "async" by default. Set it as false to respect the added order
            s.async = false;
            s.onload = resolve;
            s.onerror = reject;
            //s.addEventListener('load', resolve);
            //s.addEventListener('error', reject);
            document.head.appendChild(s);
        });
    }
};
