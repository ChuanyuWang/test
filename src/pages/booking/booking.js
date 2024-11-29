/**
 * --------------------------------------------------------------------------
 * booking.js main module for booking page
 * --------------------------------------------------------------------------
 */

//var common = require('../../common/common');
//var i18nextplugin = require('../../locales/i18nextplugin');
import init from '../../common/init';
import bookingApp from './booking.vue';

/* Not able to get user openid as 订阅号
var ua = navigator.userAgent.toLowerCase();
if (ua.indexOf('micromessenger') > -1) { // we are within wechat
    // OAuth authentication refer to https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html
    var code = common.getParam("code");
    if (!code) {
        var tenantConfig = common.getTenantConfig();
        var appID = tenantConfig.wechat_appId || "wx72921c8e2fb1ad2c";
        var localURL = location.href;
        // parameter state will be appened to redirect_uri
        location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + appID + "&redirect_uri=" + encodeURIComponent(localURL) + "&response_type=code&scope=snsapi_base&state=123#wechat_redirect";
    } else {
        getOpenId(code);
    }
}
*/

//getOpenId("071wHvFa1DEwVz00lsIa1XQYSn0wHvF6"); // testing only

//var app = null;
// DOM Ready =============================================================
init(function() {
    fixScroll();

    new Vue({
        el: '#app',
        data: { openID: "" },
        render: function(h) { return h(bookingApp) }
    });
    // Test only
    //app.openID = "o9lk5w_d08t3gW6KY9VkdWU5rnnU";
});

// Functions =============================================================

function fixScroll() {
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
/*
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
            console.error("getOpenId fails", jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
        },
        dataType: "json"
    });
}
*/
