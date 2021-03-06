/**
 * --------------------------------------------------------------------------
 * mybooking.js
 * --------------------------------------------------------------------------
 */
var common = require('./common');
// local cache for class or event
var cls_cache = {};
// open id of Weichat user
//var _openid = undefined;

var memberid = undefined;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    $('.nav-tabs a').click(function(e) {
        // delay the update until DOM tree status refresh
        setTimeout(function() {
            showMyBooking();
        });
        //e.preventDefault();
        //$(this).tab('show');
    });

    $('#user_info .btn-danger').click(function(e) {
        clearSchedule();
        try {
            localStorage._memberid = memberid = undefined;
        } catch (oException) {
            // the private browsing is on, access to localStorage cause exception on iOS
        }
        toggleLoginForm(true);
    });

    $('#login .btn').click(handleLoginOK);
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
    //$('#currentWeekRange').text(moment().format('[今天] MMMDo'));

    toggleLoginForm(true);
}

function handleLoginOK(event) {
    event.preventDefault();

    var loginForm = $(this).closest('form');
    var hasError = false;
    // validate the input
    var userInfo = {
        tenant: common.getTenantName()
    };
    userInfo.name = loginForm.find('input[name=name]').val().trim();
    if (!userInfo.name || userInfo.name.length == 0) {
        loginForm.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        loginForm.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }
    // get contact
    userInfo.contact = loginForm.find('input[name=contact]').val().trim();
    if (!userInfo.contact || userInfo.contact.length == 0) {
        loginForm.find('input[name=contact]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        loginForm.find('input[name=contact]').closest(".form-group").removeClass("has-error");
    }

    if (!hasError) {
        $.ajax("/api/members/validate", {
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(userInfo),
            success: function(data) {
                if (data) {
                    try {
                        // cache the member id in global variable before access localStorage
                        localStorage._memberid = memberid = data._id;
                        localStorage._name = data.name;
                        localStorage._contact = data.contact;
                    } catch (oException) {
                        if (oException.name == 'QuotaExceededError') {
                            console.error('超出本地存储限额！');
                            //clear the local storage
                            localStorage.clear();
                        }
                    }
                    toggleLoginForm(false);
                    updateUserInfo(data);
                    showMyBooking();
                } else {
                    // handle login fail
                    $('#error_dlg').find("h4").text('登录失败');
                    $('#error_dlg').find("p#message").text('没有找到会员信息，请核对您的姓名和联系方式，如有问题请联系客服');
                    $('#error_dlg').modal('show');
                }
            },
            error: function(jqXHR, status, err) {
                // handle login error
                console.error(jqXHR.responseText);
            },
            complete: function(jqXHR, status) {
                //TODO
            },
            dataType: "json"
        });
    }
}

// append a class for booking at the end of page
function displayClass(item) {
    // append the content to current active panel
    var list = $('.tab-content .active');
    var date = moment(item.date);

    // get the last class row
    var lastRow = list.find('div.class-row:last-child');
    // check if it's the first row or the next class is in the same day
    if (lastRow.length === 0 || lastRow.data('timestamp') !== date.valueOf()) {
        // add separator bar
        list.append('<div class="class-separator"></div>');
        // append a new class row
        list.append('<div class="row class-row">' +
            '<div class="col-xs-2 date-col">' +
            '<p>' + date.format('M/D') + '<br><small>' + date.format('ddd') + '</small></p>' +
            '</div>' +
            '<div class="col-xs-10 content-col"></div>' +
            '</div>');
    }

    // insert a class in last row
    var cls_col = '<p>' + item.name + '</p>';
    var cls_cost = '';
    if (item.cost && item.cost > 0) {
        cls_cost = '<span class="cls-tip"><span class="glyphicon glyphicon-bell"></span>' + item.cost + '课时</span>';
    } else if (item.courseID) {
        cls_cost = '';
    } else {
        cls_cost = '<span class="cls-free">公益活动</span>';
    }

    var cls_tip = ['<p class="cls-tip"><span class="glyphicon glyphicon-time"></span>',
        date.format('HH:mm') + ' ',
        cls_cost + ' ',
        getClassroomName(item.classroom),
        '</p>'].join('');

    if (date > moment()) {
        var btn_cancel = '<button class="btn btn-danger cancel-btn">取消</button>';
        var btn_tip = '<p class="cls-status text-danger">(未上)</p>';
    } else {
        var btn_cancel = '';
        if (isAbsent(item)) {
            var btn_tip = '<p class="cls-status text-danger">(缺席)</p>';
        } else {
            var btn_tip = '<p class="cls-status text-info">(已上)</p>';
        }
    }

    lastRow = list.find('div.class-row:last-child');
    // Add the timestamp to class-row element for later comparing
    lastRow.data('timestamp', date.valueOf());
    lastRow.find('.content-col').append(
        '<div>' +
        '<div class="cls-col">' +
        cls_col +
        cls_tip +
        '</div>' +
        '<div class="book-col" data-id="' + item._id + '">' +
        btn_cancel +
        btn_tip +
        '</div>' +
        '<div style="clear:both"></div>' + // add a empty div with clear:both style to make parent div has real height
        '</div>');
}

function isAbsent(cls) {
    var bookings = cls && cls.booking || [];
    for (var i = 0; i < bookings.length; i++) {
        if (bookings[i].member === memberid) {
            return bookings[i].status === 'absent';
        }
    }
    return false;
}

function updateUserInfo(user) {
    var credit = 0;
    //TODO, support multi membership card
    if (user.membership && user.membership.length > 0) {
        credit = user.membership[0].credit;
    }
    // A better way of 'toFixed(1)'
    if (typeof (credit) == 'number') {
        credit = Math.round(credit * 10) / 10;
    }
    $('#user_info p b').text(user.name);
    $('#user_info p small span.remain-total').text(credit);
}

function updateUserBookedTotal(value) {
    // A better way of 'toFixed(1)'
    if (typeof (value) == 'number') {
        value = Math.round(value * 10) / 10;
    }
    $('#user_info p small span.booked-total').text(value);
}

function toggleLoginForm(isShow) {
    // display the login form for user to input name and contact
    if (isShow) {
        $('#user_info').hide();
        $('#main .nav-tabs').hide();
        $('#main .tab-content').hide();
        // initialize the default value from local storage
        $('#main form input[name=name]').val(localStorage._name);
        $('#main form input[name=contact]').val(localStorage._contact);
        $('#main form').fadeIn(400);
        $('#main form input[name=name]').focus();
    } else {
        $('#main form').hide();
        $('#user_info').show();
        $('#main .nav-tabs a[href="#future"]').tab('show'); // display future class by default
        $('#main .nav-tabs').fadeIn(600);
        $('#main .tab-content').fadeIn(600);
    }
}

function showMyBooking(isHistory, tab_id) {
    var type = $('.nav-tabs .active a').attr('href');
    if (type == '#future') {
        updateSchedule(memberid, false);
    } else if (type == '#history') {
        updateSchedule(memberid, true);
    }
}

function updateSchedule(memberid, isHistory) {
    clearSchedule();
    var query = {
        memberid: memberid,
        tenant: common.getTenantName()
    }
    if (isHistory) {
        query.from = moment(0).toISOString();
        query.to = moment().toISOString();
        query.order = 'desc';
    } else { // show the booking in one year
        query.from = moment().toISOString();
        query.to = moment().add(1, 'years').toISOString();
    }
    $.ajax("/api/classes", {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        data: query,
        success: function(data) {
            // no classes found
            if (!data.length) {
                displayNoClassWarning();
            }

            var total = 0;
            // display classes
            for (var i = 0; i < data.length; i++) {
                //cache every displayed class or event
                cls_cache[data[i]._id] = data[i];
                // TODO, calculate by 'quantity' field
                total += data[i].cost || 0;
                displayClass(data[i]);
            }
            if (!isHistory) {
                // update the total booked classes cost
                updateUserBookedTotal(total);
            }
            // add the cancel listener
            $('#future div.book-col .btn-danger').click(function(event) {
                var class_id = $(this).closest('div.book-col').data('id');
                cancelBooking(class_id, memberid, this);
            });
        },
        error: function(jqXHR, status, err) {
            console.error(jqXHR.responseText);
        },
        complete: function(jqXHR, status) {
            //TODO
        },
        dataType: "json"
    });
}

function displayNoClassWarning() {
    var list = $('#main');

    // append a warning bar
    list.append("<div class='alert alert-warning' role='alert' style='margin-top:7px'><strong>提示：</strong>没有预约课程</div>");
}

function cancelBooking(class_id, member_id, button_div) {
    if (!class_id || !member_id || !button_div) {
        console.error("fail to cancel booking due to missing parameter");
        return;
    }

    // don't allow member to cancel the booking if it's less than 24 hours before begin
    var cls_item = cls_cache[class_id];
    var begin_date = moment(cls_item.date);

    if (moment() > begin_date.subtract(24, 'hours')) {
        $('#error_dlg').find("h4").text('取消失败');
        $('#error_dlg').find("p#message").text('不能在课程开始前24小时取消预约，如有问题请联系客服');
        $('#error_dlg').modal('show');
        return;
    }

    // remove previous attached 'click' event listener!
    $('#cancel_ok').off("click");
    $('#cancel_ok').click(function(event) {
        $.ajax("/api/booking/" + class_id, {
            type: "DELETE",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ memberid: member_id, tenant: common.getTenantName() }),
            success: function(data) {
                // check if it's the only class in this day
                var count = $(button_div).closest('div.class-row').find('div.content-col > div').length;
                if (count == 1) { // the only class in this day
                    $(button_div).closest('div.class-row').hide(600, function() {
                        $(button_div).closest('div.class-row').prev('div.class-separator').remove();
                        $(button_div).closest('div.class-row').remove();
                    });
                } else if (count > 1) {
                    $(button_div).closest('div.content-col > div').hide(600, function() {
                        $(button_div).closest('div.content-col > div').remove();
                    });
                } else {
                    console.error("are you kidding me?");
                }
            },
            error: function(jqXHR, status, err) {
                console.error(jqXHR.responseJSON);
                $('#error_dlg').find("h4").text('取消失败');
                $('#error_dlg').find("p#message").text(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
                $('#error_dlg').modal('show');
            },
            complete: function(jqXHR, status) {
                $('#confirm_dlg').modal('hide');
            },
            dataType: "json"
        });
    });

    $('#confirm_dlg').modal('show');
}

function getClassroomName(roomID) {
    var roomList = getClassroomList(); /*global getClassroomList*/
    for (var i = 0; i < roomList.length; i++) {
        if (roomID == roomList[i].id) {
            return roomList[i].name;
        }
    }
    return "";
}

function clearSchedule() {
    // remove all classes and separators
    $('.class-row,.class-separator').remove();
    $('.alert-warning').remove();
}
