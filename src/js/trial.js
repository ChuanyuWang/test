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