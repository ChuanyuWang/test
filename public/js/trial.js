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
 * trial.js
 * --------------------------------------------------------------------------
 */

var common = require('./common');

// DOM Ready =============================================================
$(document).ready(function () {
    init();
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    //moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
    $('#reg_btn').click(handleSubmit);
};

function handleSubmit(event) {
    var form = $('#opportunity');
    var user_info = {
        since : new Date(),
        status : "open"
    };
    
    var hasError = false;

    user_info.name = form.find('input[name=name]').val();
    if (!user_info.name || user_info.name.length == 0) {
        form.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        form.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }
    
    user_info.contact = form.find('input[name=contact]').val();
    if (!user_info.contact || user_info.contact.length == 0) {
        form.find('input[name=contact]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        form.find('input[name=contact]').closest(".form-group").removeClass("has-error");
    }
    
    // get birth date
    user_info.birthday = form.find('input[name=birth]').val();
    if (!user_info.birthday || user_info.birthday.length == 0) {
        form.find('input[name=birth]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        form.find('input[name=birth]').closest(".form-group").removeClass("has-error");
        user_info.birthday = new Date(user_info.birthday);
    }
    user_info.remark = form.find('textarea[name=remark]').val().trim();
    
    if (!hasError) {
        user_info.source = getParam('source');
        addOpportunity(user_info);
    }
};

function addOpportunity(opportunity) {
    opportunity.tenant = common.getTenantName();
    $.ajax("/api/opportunities", {
        type : "POST",
        contentType : "application/json; charset=utf-8",
        data : JSON.stringify(opportunity),
        success : function (data) {
            //show successful message
            $('#success_dlg').modal('show');
        },
        error : function (jqXHR, status, err) {
            $('#error_dlg').find("p#message").text(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            $('#error_dlg').modal('show');
            //console.error(jqXHR);
        },
        dataType : "json"
    });
};

function getParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var param = window.location.search.substr(1).match(reg);
    return param ? decodeURI(param[2]) : null;
};
},{"./common":1}]},{},[2]);
