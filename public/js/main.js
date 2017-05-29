/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * common.js
 * --------------------------------------------------------------------------
 */

module.exports = {
    /**
     * get the tenat name of current page, e.g.
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
    }
};
},{}],2:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * class-cell.js component for home page
 * --------------------------------------------------------------------------
 */

module.exports = function() {
    // register the class list in table
    Vue.component('class-list', {
        template: '#classlist-template',
        props: {
            data: Array // array of class object
        },
        data: function() {
            return {};
        },
        computed: {},
        filters: {
            displayTime: function(date) {
                return moment(date).format('HH:mm');
            }
        },
        methods: {
            reservation: function(cItem) {
                if (cItem) {
                    var booking = cItem.booking || [];
                    if (booking.length === 0) return 0;
                    else {
                        var reservation = 0;
                        booking.forEach(function(val, index, array) {
                            reservation += (val.quantity || 0);
                        });
                        return reservation;
                    }
                } else {
                    return undefined;
                }
            },
            books: function(cItem) {
                var books = cItem.books || [];
                return books.length;
            }
        }
    });
};

},{}],3:[function(require,module,exports){
module.exports={
  "key": "value",
  "key_plural": "values",
  "keyDeep": {
    "inner": "value"
  },
  "keyNesting": "reuse $t(keyDeep.inner)",
  "keyInterpolate": "replace this {{value}}",
  "keyInterpolateUnescaped": "replace this {{- value}}",
  "keyInterpolateWithFormatting": "replace this {{value, format}}",
  "keyContext_male": "the male variant",
  "keyContext_female": "the female variant",
  "keyPluralSimple": "the singular",
  "keyPluralSimple_plural": "the plural",
  "keyPluralMultipleEgArabic_0": "the plural form 0",
  "keyPluralMultipleEgArabic_1": "the plural form 1",
  "keyPluralMultipleEgArabic_2": "the plural form 2",
  "keyPluralMultipleEgArabic_3": "the plural form 3",
  "keyPluralMultipleEgArabic_4": "the plural form 4",
  "keyPluralMultipleEgArabic_5": "the plural form 5"
}
},{}],4:[function(require,module,exports){
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.i18nextBrowserLanguageDetector=t()}(this,function(){"use strict";function e(e){return a.call(i.call(arguments,1),function(t){if(t)for(var o in t)void 0===e[o]&&(e[o]=t[o])}),e}function t(){return{order:["querystring","cookie","localStorage","navigator","htmlTag"],lookupQuerystring:"lng",lookupCookie:"i18next",lookupLocalStorage:"i18nextLng",caches:["localStorage"]}}var o={};o.classCallCheck=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},o.createClass=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}();var n=[],a=n.forEach,i=n.slice,r={create:function(e,t,o,n){var a=void 0;if(o){var i=new Date;i.setTime(i.getTime()+60*o*1e3),a="; expires="+i.toGMTString()}else a="";n=n?"domain="+n+";":"",document.cookie=e+"="+t+a+";"+n+"path=/"},read:function(e){for(var t=e+"=",o=document.cookie.split(";"),n=0;n<o.length;n++){for(var a=o[n];" "===a.charAt(0);)a=a.substring(1,a.length);if(0===a.indexOf(t))return a.substring(t.length,a.length)}return null},remove:function(e){this.create(e,"",-1)}},u={name:"cookie",lookup:function(e){var t=void 0;if(e.lookupCookie&&"undefined"!=typeof document){var o=r.read(e.lookupCookie);o&&(t=o)}return t},cacheUserLanguage:function(e,t){t.lookupCookie&&"undefined"!=typeof document&&r.create(t.lookupCookie,e,t.cookieMinutes,t.cookieDomain)}},c={name:"querystring",lookup:function(e){var t=void 0;if("undefined"!=typeof window)for(var o=window.location.search.substring(1),n=o.split("&"),a=0;a<n.length;a++){var i=n[a].indexOf("=");if(i>0){var r=n[a].substring(0,i);r===e.lookupQuerystring&&(t=n[a].substring(i+1))}}return t}},l=void 0;try{l="undefined"!==window&&null!==window.localStorage;var s="i18next.translate.boo";window.localStorage.setItem(s,"foo"),window.localStorage.removeItem(s)}catch(g){l=!1}var f={name:"localStorage",lookup:function(e){var t=void 0;if(e.lookupLocalStorage&&l){var o=window.localStorage.getItem(e.lookupLocalStorage);o&&(t=o)}return t},cacheUserLanguage:function(e,t){t.lookupLocalStorage&&l&&window.localStorage.setItem(t.lookupLocalStorage,e)}},d={name:"navigator",lookup:function(e){var t=[];if("undefined"!=typeof navigator){if(navigator.languages)for(var o=0;o<navigator.languages.length;o++)t.push(navigator.languages[o]);navigator.userLanguage&&t.push(navigator.userLanguage),navigator.language&&t.push(navigator.language)}return t.length>0?t:void 0}},v={name:"htmlTag",lookup:function(e){var t=void 0,o=e.htmlTag||("undefined"!=typeof document?document.documentElement:null);return o&&"function"==typeof o.getAttribute&&(t=o.getAttribute("lang")),t}},h=function(){function n(e){var t=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];o.classCallCheck(this,n),this.type="languageDetector",this.detectors={},this.init(e,t)}return o.createClass(n,[{key:"init",value:function(o){var n=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],a=arguments.length<=2||void 0===arguments[2]?{}:arguments[2];this.services=o,this.options=e(n,this.options||{},t()),this.i18nOptions=a,this.addDetector(u),this.addDetector(c),this.addDetector(f),this.addDetector(d),this.addDetector(v)}},{key:"addDetector",value:function(e){this.detectors[e.name]=e}},{key:"detect",value:function(e){var t=this;e||(e=this.options.order);var o=[];e.forEach(function(e){if(t.detectors[e]){var n=t.detectors[e].lookup(t.options);n&&"string"==typeof n&&(n=[n]),n&&(o=o.concat(n))}});var n=void 0;return o.forEach(function(e){if(!n){var o=t.services.languageUtils.formatLanguageCode(e);t.services.languageUtils.isWhitelisted(o)&&(n=o)}}),n||this.i18nOptions.fallbackLng[0]}},{key:"cacheUserLanguage",value:function(e,t){var o=this;t||(t=this.options.caches),t&&t.forEach(function(t){o.detectors[t]&&o.detectors[t].cacheUserLanguage(e,o.options)})}}]),n}();return h.type="languageDetector",h});
},{}],5:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * index.js provide all locale resources loaded by browser
 * --------------------------------------------------------------------------
 */

var resources = {
    'en': { translation: require('./en') },
    'zh': { translation: require('./zh_CN') }
};

module.exports = resources;

},{"./en":3,"./zh_CN":6}],6:[function(require,module,exports){
module.exports={
  "key": "值",
  "keyDeep": {
    "inner": "value"
  },
  "keyNesting": "reuse $t(keyDeep.inner)",
  "keyInterpolate": "replace this {{value}}",
  "keyInterpolateUnescaped": "replace this {{- value}}",
  "keyInterpolateWithFormatting": "replace this {{value, format}}",
  "keyContext_male": "the male variant",
  "keyContext_female": "the female variant",
  "keyPluralSimple": "the singular",
  "keyPluralSimple_plural": "the plural",
  "keyPluralMultipleEgArabic_0": "the plural form 0",
  "keyPluralMultipleEgArabic_1": "the plural form 1",
  "keyPluralMultipleEgArabic_2": "the plural form 2",
  "keyPluralMultipleEgArabic_3": "the plural form 3",
  "keyPluralMultipleEgArabic_4": "the plural form 4",
  "keyPluralMultipleEgArabic_5": "the plural form 5"
}
},{}],7:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var common = require('./common');
var locales = require('./locales');
var initClassCell = require('./components/class-cell');
var class_service = require('./services/classes');
var LngDetector = require('./locales/i18nextBrowserLanguageDetector.min');

var classTableData = {
    monday: null, // moment date object
    columns: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    sections: [{ name: "上午", startTime: 0, duration: 12 }, { name: "下午", startTime: 12, duration: 6 }, { name: "晚上", startTime: 18, duration: 6 }],
    classes: []
};

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    initClassCell();
    // bootstrap the class table
    var clsTable = new Vue({
        el: '#cls_table',
        data: classTableData,
        computed: {
            sortedClasses: function() {
                return this.classes.sort(function(a, b) {
                    if (moment(a.date).isSameOrBefore(b.date)) return -1;
                    else return 1;
                });
            }
        },
        filters: {
            displayWeekDay: function(dayOffset, monday) {
                return moment(monday).add(dayOffset, 'days').format('MMMDo');
            }
        },
        methods: {
            getClassess: function(dayOffset, startTime, duration) {
                var result = [];
                var theDay = moment(this.monday).add(dayOffset, 'days').hours(startTime);
                for (var i = 0; i < this.sortedClasses.length; i++) {
                    var classItem = this.classes[i];
                    if (moment(classItem.date).isSameOrAfter(theDay)) {
                        if (moment(classItem.date).diff(theDay, 'hours') >= duration) break;
                        else result.push(classItem);
                    }
                }
                return result;
            },
            viewClass: function(classItem) {
                window.location.href = './class/' + classItem._id;
            },
            deleteClass: function(classItem) {
                var vm = this;
                if (classItem.courseID) {
                    return bootbox.confirm({
                        title: "确定删除班级中的课程吗？",
                        message: "课程<strong>" + classItem.name + "</strong>是固定班的课程<br/>请先查看班级，并从班级管理界面中删除相关课程",
                        buttons: {
                            confirm: {
                                label: '查看班级',
                                className: "btn-success"
                            }
                        },
                        callback: function(ok) {
                            if (ok) {
                                window.location.href = './course/' + classItem.courseID;
                            }
                        }
                    });
                }
                bootbox.confirm({
                    title: "确定删除课程吗？",
                    message: "只能删除没有会员预约的课程，如果有预约，请先取消预约",
                    buttons: {
                        confirm: {
                            className: "btn-danger"
                        }
                    },
                    callback: function(ok) {
                        if (ok) {
                            var request = class_service.removeClass(classItem._id);
                            request.done(function(data, textStatus, jqXHR) {
                                vm.removeClasses(classItem);
                                showSuccessMsg("删除成功");
                            });
                        }
                    }
                });
            },
            removeClasses: function(oldClass) {
                var found = false;
                for (var i = 0; i < this.classes.length; i++) {
                    if (this.classes[i]._id == oldClass._id) {
                        // remove the old one
                        this.classes.splice(i, 1);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.error("can't find the oldClass");
                }
            },
            addClass: function(dayOffset, startTime) {
                // the first class should start from 8:00 in the morning
                showAddNewClassDlg(moment(this.monday).add(dayOffset, 'days').hours(startTime == 0 ? 8 : startTime));
            }
        }
    });

    $('#cls_dlg').on('shown.bs.modal', function(event) {
        $(this).find('#cls_name').focus(); // focus on the class name input control
    });

    // listen to the action button on modal dialogs
    $('#create_cls').click(handleAddNewClass);

    // listen to the previous week and next week button
    $('#previous_week').click(function(event) {
        classTableData.monday.subtract(7, 'days');
        // update the datetimepicker control
        $('#weekPicker').data('DateTimePicker').date(classTableData.monday);
    });

    $('#next_week').click(function(event) {
        classTableData.monday.add(7, 'days');
        // update the datetimepicker control
        $('#weekPicker').data('DateTimePicker').date(classTableData.monday);
    });

    $('#current_week').click(function(event) {
        classTableData.monday = getMonday(moment());
        // update the datetimepicker control
        $('#weekPicker').data('DateTimePicker').date(classTableData.monday);
    });

    // handle user change the classroom
    $('#chooseRoom').change(function(event) {
        updateSchedule();
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    // initialize the i18n module
    if (i18next) {
        i18next.use(LngDetector).init({
            fallbackLng: "en",
            resources: locales
        });
    }

    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
    $('#cls_time').datetimepicker({
        locale: 'zh-CN',
        format: 'LT'
    });
    $('#weekPicker').datetimepicker({
        showTodayButton: false,
        locale: 'zh-CN',
        format: 'll',
        defaultDate: moment()
    });
    classTableData.monday = getMonday(moment());
    $('#weekPicker').data('DateTimePicker').date(classTableData.monday);
    // listen to the date change event after setting date !!!
    $('#weekPicker').on('dp.change', function(e) {
        // when user clears the input box, the 'e.date' is false value
        if (e.date && e.date.isValid()) {
            classTableData.monday = getMonday(e.date);
            updateSchedule();
        }
    });
    initClassRoomList();
    // manual update the page so that page is able to be updated in "back" case
    updateSchedule();
};

function initClassRoomList() {
    if (!getCurrentClassRoom()) {
        // show a single button to create class room
        $('#create_cls_panel').show();
    } else {
        // show class schedule according to the first classroom
        $('#cls_table').show();
    }
};

function getCurrentClassRoom() {
    var classroom = $('#chooseRoom option:selected');
    if (classroom.length == 1) {
        return classroom.val();
    }
    return null;
};

// Get the Monday of specific date, each week starts from Monday
function getMonday(date) {
    var _date = moment(date);
    var dayofweek = _date.day();
    // the Monday of this week
    if (dayofweek == 0) { // today is Sunday
        _date.day(-6);
    } else {
        _date.day(1);
    }
    //set the time to the very beginning of day
    _date.hours(0).minutes(0).seconds(0).milliseconds(0);
    return _date;
};

function showAddNewClassDlg(startDateTime) {
    // reset dialog status when add a new class
    var modal = $('#cls_dlg');

    modal.find('#cls_name').val("").closest(".form-group").removeClass("has-error");
    modal.find('input[name=cost]').val(1).closest(".form-group").removeClass("has-error");
    modal.find('#cls_capacity').val(8).closest(".form-group").removeClass("has-error");
    modal.find('input[name=age_min]').val(24).closest(".form-group").removeClass("has-error");
    modal.find('input[name=age_max]').val(48).closest(".form-group").removeClass("has-error");
    modal.find('#cls_date').text(startDateTime.format('ll'));
    modal.find('#cls_time').data('DateTimePicker').date(startDateTime);
    modal.modal('show');
}

function handleAddNewClass(event) {
    var modal = $(this).closest('.modal');
    var hasError = false;
    // validate the input
    var classItem = {};
    classItem.name = modal.find('#cls_name').val();
    if (!classItem.name || classItem.name.length == 0) {
        modal.find('#cls_name').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('#cls_name').closest(".form-group").removeClass("has-error");
    }
    // get date/time
    classItem.date = moment(modal.find('#cls_date').text(), 'll');
    var time = modal.find('#cls_time').data("DateTimePicker").date();
    classItem.date.hours(time.hours());
    classItem.date.minutes(time.minutes());
    // get cost
    classItem.cost = parseFloat(modal.find('input[name=cost]').val());;
    if (isNaN(classItem.cost) || classItem.cost < 0) {
        modal.find('input[name=cost]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=cost]').closest(".form-group").removeClass("has-error");
    }
    // get capacity
    classItem.capacity = parseInt(modal.find('#cls_capacity').val());
    if (isNaN(classItem.capacity) || classItem.capacity < 0) {
        modal.find('#cls_capacity').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('#cls_capacity').closest(".form-group").removeClass("has-error");
    }
    // get age limitation
    classItem.age = { min: null, max: null };
    var input = modal.find('input[name=age_min]');
    if (input.val()) {
        classItem.age.min = parseInt(input.val());
        if (isNaN(classItem.age.min) || classItem.age.min < 0) {
            input.closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            input.closest(".form-group").removeClass("has-error");
        }
    }

    var input = modal.find('input[name=age_max]');
    if (input.val()) {
        classItem.age.max = parseInt(input.val());
        if (isNaN(classItem.age.max) || classItem.age.max < 0) {
            input.closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            input.closest(".form-group").removeClass("has-error");
        }
    }

    // get classroom
    classItem.classroom = getCurrentClassRoom();

    if (!hasError) {
        // switch the age.min and age.max if min is bigger than max
        if (classItem.age.min != null && classItem.age.max != null && classItem.age.min > classItem.age.max) {
            var temp = classItem.age.max;
            classItem.age.max = classItem.age.min;
            classItem.age.min = temp;
        }
        $.ajax("/api/classes", {
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(classItem),
            success: function(data) {
                updateClasses(data);
                modal.modal('hide');
                // jump to new class page
                //window.location.href = './class/' + data._id;
            },
            error: function(jqXHR, status, err) {
                showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            dataType: "json"
        });
    }
};

function updateClasses(newClass) {
    var found = false;
    for (var i = 0; i < classTableData.classes.length; i++) {
        if (classTableData.classes[i]._id == newClass._id) {
            // remove existed and replace by update one
            classTableData.classes.splice(i, 1, newClass);
            var found = true;
            break;
        }
    }
    if (!found) {
        // add as a new class item
        classTableData.classes.push(newClass);
    }
};

function updateSchedule(control) {
    var begin = moment(classTableData.monday);
    var end = moment(classTableData.monday).add(7, 'days');
    $.ajax('/api/classes', {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        data: {
            from: begin.toISOString(),
            to: end.toISOString(),
            classroom: getCurrentClassRoom(),
            tenant: common.getTenantName()
        },
        success: function(data) {
            classTableData.classes = data || [];
        },
        error: function(jqXHR, status, err) {
            console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
        },
        complete: function(jqXHR, status) {
            if (control) {
                control.prop("disabled", false);
            }
        },
        dataType: "json"
    });
};

function showSuccessMsg(msg) {
    var alert_bar = $('#alert_bar').removeClass('alert-danger').addClass("alert-success");
    alert_bar.find('span').text(msg);
    alert_bar.finish().show().fadeOut(2000);
};

function showErrorMsg(msg) {
    var alert_bar = $('#alert_bar').removeClass('alert-success').addClass("alert-danger");
    alert_bar.find('span').text(msg);
    alert_bar.finish().show().fadeOut(2000);
};
},{"./common":1,"./components/class-cell":2,"./locales":5,"./locales/i18nextBrowserLanguageDetector.min":4,"./services/classes":8}],8:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * classes.js provide API for classes service
 * --------------------------------------------------------------------------
 */

var util = require('./util');

var service = {};

/**
 * Retrieve classID object according to ID
 * 
 * @param {String} classID 
 */
service.getClass = function(classID) {
    var request = $.ajax('/api/classes/' + classID, {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        data: '',
        cache: false // disable browser cache
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取课程失败', jqXHR);
    });
    return request;
};

service.updateClass = function(coureID, fields) {
    var request = $.ajax("/api/classes/" + coureID, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新课程失败", jqXHR);
    });
    return request;
};

service.addReservation = function(fields) {
    var request = $.ajax("/api/booking", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("预约失败", jqXHR);
    });
    return request;
};

service.deleteReservation = function(classID, fields) {
    var request = $.ajax("/api/booking/" + classID, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("取消会员预约失败", jqXHR);
    });
    return request;
};

service.addBooks = function(classID, fields) {
    var request = $.ajax("/api/classes/" + classID + '/books', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加绘本失败", jqXHR);
    });
    return request;
};

service.deleteBook = function(classID, fields) {
    var request = $.ajax("/api/classes/" + classID + '/books', {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除绘本失败", jqXHR);
    });
    return request;
};

service.removeClass = function(classID, fields) {
    var request = $.ajax("/api/classes/" + classID, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除课程失败", jqXHR);
    });
    return request;
};

service.getReservations = function(classID) {
    var request = $.ajax('/api/booking', {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        data: { 'classid': classID },
        cache: false // disable browser cache
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取课程预约失败', jqXHR);
    });
    return request;
};

module.exports = service;
},{"./util":9}],9:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * util.js provide common utils for all services
 * --------------------------------------------------------------------------
 */
 
var util = {};

/**
 * 
 * @param {String} title error dialog title
 * @param {Object} jqXHR XHR object of jQuery ajax call
 * @param {String} className default is 'btn-danger'
 */
util.showAlert = function(title, jqXHR, className) {
    //console.error(jqXHR);
    bootbox.alert({
        message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
        title: title || '错误',
        buttons: {
            ok: {
                label: "确定",
                // alert dialog with danger button by default
                className: className || "btn-danger"
            }
        }
    });
};

module.exports = util;

},{}]},{},[7]);
