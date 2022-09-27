/**
 * --------------------------------------------------------------------------
 * common.js
 * --------------------------------------------------------------------------
 */

module.exports = {
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
     * get the tenant setting, e.g. {feature: 'book'}
     */
    getTenantSetting: function() {
        var settings = {};
        var el = $('tenant-setting');
        if (el.length > 0) {
            settings.feature = el.attr('feature') || 'common' // default is 'common'
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
     * Data fomatter function of bootstrap-table to format date localized string by 'll'
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
                    reservation += (val.quantity || 0);
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
    }
};
