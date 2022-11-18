/**
 * --------------------------------------------------------------------------
 * booking.js main module for booking page
 * --------------------------------------------------------------------------
 */

var common = require('../../common/common');
var i18nextplugin = require('../../locales/i18nextplugin');
var bookingApp = require('./booking.vue').default;

var ua = navigator.userAgent.toLowerCase();
if (ua.indexOf('micromessenger') > -1) { // we are within wechat
    // OAuth authentication refer to https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html
    var code = common.getParam("code");
    if (!code) {
        // TODO, get appID from tenant if wechat integration is enabled
        var appID = "wxe4283737fc91496e";
        var localURL = location.href;
        // parameter state will be appened to redirect_uri
        location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + appID + "&redirect_uri=" + encodeURIComponent(localURL) + "&response_type=code&scope=snsapi_base&state=123#wechat_redirect";
    } else {
        getOpenId(code);
    }
}

//getOpenId("071wHvFa1DEwVz00lsIa1XQYSn0wHvF6"); // testing only

var app = null;
// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    app = new Vue({
        el: '#app',
        components: { bookingApp },
        data: { openID: "" },
        template: '<booking-app :openID="openID"/>'
    });
    // Test only
    //app.openID = "o9lk5w_d08t3gW6KY9VkdWU5rnnU";
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');

    /* fix topbar at the top of screen when scroll down
    $(window).scroll(this, function (event) {
        //console.log(event);
        var position = $(event.currentTarget).scrollTop();
        if (position > 68) {
            $('#weekbtns').addClass('float-banner');
        } else {
            $('#weekbtns').removeClass('float-banner');
        }
    })
    */
    /* 去掉iphone手机滑动默认行为
    var handleMove = function (e) {
        if($(e.target).closest('.scrollable').length == 0) { e.preventDefault(); }
    }
    document.addEventListener('touchmove', handleMove, true);
    */
}

function getOpenId(code) {
    var tenant = common.getTenantName();
    $.ajax("/api/getOpenID", {
        type: "GET",
        data: {
            "code": code,
            "tenant": tenant
        },
        success: function(data) {
            app.openID = data.openid;
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(JSON.stringify(jqXHR.responseJSON));
        },
        dataType: "json"
    });
}
