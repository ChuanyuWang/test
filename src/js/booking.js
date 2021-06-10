/**
 * --------------------------------------------------------------------------
 * booking.js main module for booking page
 * --------------------------------------------------------------------------
 */

var common = require('./common');
var i18nextplugin = require('./locales/i18nextplugin');
var booking_app = require('./components/booking.vue').default;

// open id of Weichat user
// eslint-disable-next-line
var _openid = undefined;

var ua = navigator.userAgent.toLowerCase();
if (ua.indexOf('micromessenger') > -1) { // we are within wechat
    var tenant = common.getTenantName();
    if (tenant === "test") {
        var code = common.getParam("code");
        if (!code) {
            // TODO, get appID from tenant if wechat integration is enabled
            var appID = "wxe4283737fc91496e";
            var localURL = location.href;
            location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + appID + "&redirect_uri=" + encodeURIComponent(localURL) + "&response_type=code&scope=snsapi_base&state=123#wechat_redirect";
        } else {
            getOpenId(code);
        }
    }
}

//getOpenId("071wHvFa1DEwVz00lsIa1XQYSn0wHvF6"); // testing only

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    new Vue({ el: '#app', extends: booking_app });
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
// eslint-disable-next-line
function scrollToToday() {
    var btns = $('div.class-row button[disabled!=disabled]');
    if (btns.length > 0) {
        var container = $('#main');
        var h = btns.height();
        var coordinate = btns.offset();
        if (coordinate.top - container.offset().top < h) {
            // it's the first element in the list, no need scroll
            return;
        }
        var position = coordinate.top - 7 - container.offset().top + container.scrollTop();
        container.animate({
            scrollTop: position
        }, 1000);
    }
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
            _openid = (data || {}).openid;
        },
        error: function(jqXHR, textStatus, errorThrown) {
            _openid = false;
        },
        dataType: "json"
    });
}
