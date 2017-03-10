/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * booking.js main module for booking page
 * --------------------------------------------------------------------------
 */

var common = require('./common');
// local cache for class or event
var cls_cache = {};
// open id of Weichat user
var _openid = undefined;

// DOM Ready =============================================================
$(document).ready(function () {
    init();
    
    // try to get the openid of weixin user
    window._openid = getCurrentUser();
    if (!_openid || _openid.length == 0) {
        $.ajax("api/currentuser", {
            type : "GET",
            data : {
                timeKey : getTimeKey()
            },
            success : function (data) {
                _openid = data.openid; // could be null
            },
            dataType : "json"
        });
    }

    $('#book_dlg').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        var item_id = button.closest('.book-col').data('id');
        var item = cls_cache[item_id];
        if (!item) {
            alert("网络异常，请刷新重试");
            event.preventDefault();
            console.error("Can't get the class or event item with id %s", item_id);
            return;
        }
        
        var modal = $(this);
        modal.find('#quantity').val(1);
        modal.find('#time').text(moment(item.date).format('MMMDoah:mm'));
        modal.find('#content').text(item.name);
        modal.find('#name').val(localStorage._name);
        modal.find('#contact').val(localStorage._contact);
        modal.find('#book_ok').data('id', item._id);
    });
    
    $('#book_ok').click(handleBookOK);

    $('#previous_week').click(function (event) {
        $("this").prop("disabled", true);
        currentMonday.subtract(7, 'days');
        updateSchedule($("this"));
    });

    $('#next_week').click(function (event) {
        $("this").prop("disabled", true);
        currentMonday.add(7, 'days');
        updateSchedule($("this"));
    });
    
    $('#current_week').click(function (event) {
        $("this").prop("disabled", true);
        currentMonday = getMonday(moment());
        updateSchedule($("this"));
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
    //$('#currentWeekRange').text(moment().format('[今天] MMMDo'));
    currentMonday = getMonday(moment());

    // set the height of #main div to enable div scroll bar instead of body scroll bar
    $('#main').height(window.innerHeight - $('#topbar').height() - 2);

    /*去掉iphone手机滑动默认行为
    $('body').on('touchmove', function (event) {
        event.preventDefault();
    });*/

    // select the specific classroom in the dropdown list
    var room = getParam('classroom');
    if (room) {
        var option_ele = $('#chooseRoom option[value=' + room.trim() + ']');
        if (option_ele.length == 1) {
            option_ele.prop('selected', true);
        }
    }
    document.title = '会员约课-' + $('#chooseRoom option:selected').text();
    // handle user change the classroom after set the selected option
    $('#chooseRoom').change(function (event) {
        // update the title
        document.title = '会员约课-' + $(this).find('option:selected').text();
        updateSchedule();
    });
    updateSchedule();
};

function getCurrentClassRoom() {
    var classroom = $('#chooseRoom option:selected');
    if (classroom.length == 1) {
        return classroom.val();
    }
    return null;
};

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

function handleBookOK(event) {
    var modal = $(this).closest('.modal');
    var item_id = $(this).data('id');
    var item = cls_cache[item_id];
    if (!item) {
        alert("网络异常，请刷新重试");
        event.preventDefault();
        console.error("Can't get the class or event item with id %s", item_id);
        return;
    }
    var hasError = false;
    // validate the input
    var bookInfo = {
        classid : item_id
    };
    bookInfo.name = modal.find('#name').val().trim();
    if (!bookInfo.name || bookInfo.name.length == 0) {
        modal.find('#name').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('#name').closest(".form-group").removeClass("has-error");
    }
    // get contact
    bookInfo.contact = modal.find('#contact').val().trim();
    if (!bookInfo.contact || bookInfo.contact.length == 0) {
        modal.find('#contact').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('#contact').closest(".form-group").removeClass("has-error");
    }
    // get quantity
    bookInfo.quantity = parseInt(modal.find('#quantity').val());
    if (isNaN(bookInfo.quantity) || bookInfo.quantity <= 0) {
        modal.find('#quantity').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('#quantity').closest(".form-group").removeClass("has-error");
    }

    if (!hasError) {
        modal.modal('hide');
        try {
            localStorage._name = bookInfo.name;
            localStorage._contact = bookInfo.contact;
        }catch (oException) {
            if(oException.name == 'QuotaExceededError'){
                console.error('超出本地存储限额！');
                //clear the local storage
                localStorage.clear();
            }
        }
        addNewBook(bookInfo);
    }
};

function addNewBook(bookInfo) {
    bookInfo.tenant = common.getTenantName();
    $.ajax("/api/booking", {
        type : "POST",
        contentType : "application/json; charset=utf-8",
        data : JSON.stringify(bookInfo),
        success : function (data) {
            //console.log("book successfully with ", bookInfo);
            // update cache
            var classInfo = data['class'];
            cls_cache[classInfo._id] = classInfo;
            // TODO, update the button status according to latest return data
            var remaining = classInfo.capacity - classInfo.reservation;
            var book_col = $(".book-col[data-id=" + bookInfo.classid + "]");
            book_col.find("span").text(remaining < 0 ? 0 : remaining);
            if (remaining <= 0) {
                book_col.find("button").removeClass('btn-primary').addClass('btn-danger');
                book_col.find(".book-btn").text("已满").attr('data-toggle', null).attr('data-target', null);
            }

            displaySuccess(data['member'], classInfo);
        },
        error : function (jqXHR, status, err) {
            displayError(jqXHR.responseJSON, bookInfo);
        },
        dataType : "json"
    });
};

function displayError(error, bookInfo) {
    $('#error_dlg').find("p#message").text(error.message);
    $('#error_dlg').modal('show');
};

function displaySuccess(member, classInfo) {
    var message = "您已预约" + moment(classInfo.date).format('MMMDoah:mm') + "活动，请准时参加";
    //TODO, support multi membership card
    var credit = 0;
    if (member.membership && member.membership.length > 0) {
        credit = member.membership[0].credit;
        message += '<br>您还剩余' + credit + '课时';
    }
    if (member.membership && member.membership.length > 0) {
        message += '，有效期至' + moment(member.membership[0].expire).format('ll');
    }
    
    $('#success_dlg').find("p#message").html(message);
    $('#success_dlg').modal('show');
    
    // send a message to user through weixin
    if (_openid) {
        var msg = {
            openid : _openid,
            message : "您已预约" + moment(classInfo.date).format('MMMDoah:mm') 
                + "的课程，请准时参加。\n您还剩余" + credit + "课时"
        };
        $.ajax("api/sendText", {
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(msg),
            success : function (data) {
                //TODO
            },
            error : function (jqXHR, status, err) {
                console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            dataType : "json"
        });
    }
};

// append a class for booking at the end of page
function displayClass(item) {
    var list = $('#main');
    var date = moment(item.date);

    var tmp = date.format('M/D');
    var lastRow = list.find('div.class-row:last-child');
    if (!lastRow || lastRow.find('.date-col p').text().indexOf(tmp) == -1) {
        // add separator bar
        list.append('<div class="class-separator"></div>');
        // append a new class row
        list.append('<div class="row class-row">' +
                        '<div class="col-xs-2 date-col">' + 
                            '<p>' + tmp + '<br><small>' + date.format('ddd') + '</small></p>' + 
                        '</div>' + 
                        '<div class="col-xs-10 content-col"></div>' + 
                    '</div>');
    }

    // insert a class in last row
    var cls_col = '<p>' + item.name + '</p>';
    
    if (item.cost && item.cost > 0) {
        var cls_cost = '<span class="cls-tip"><span class="glyphicon glyphicon-bell"></span>' + item.cost + '课时</span>';
    } else {
        //TODO, display 故事会 for martin tenant's free course
        if (location.pathname.indexOf("martin") == 1) {
            var cls_cost = '<span class="cls-free">故事会</span>';
        } else {
            var cls_cost = '<span class="cls-free">公益活动</span>';
        }
    }

    var cls_tip = ['<p class="cls-tip"><span class="glyphicon glyphicon-time"></span>',
                    date.format('HH:mm') + ' ',
                    cls_cost + ' ',
                    getAgeLimit(item),
                    '</p>'].join('');

    var remaining = item.capacity - item.reservation;
    if (date < moment().subtract(1, 'hours')) {
        // the class or event is finished one hours ago
        var btn_book = '<button class="btn btn-default finish-btn" disabled="disabled">结束</button>';
        var btn_tip = '';
    } else if (remaining > 0) {
        var btn_book = '<button class="btn btn-primary book-btn" data-toggle="modal" data-target="#book_dlg">预约</button>';
        var btn_tip = '<button class="btn btn-primary remain-btn" disabled="disabled">剩余<span class="badge remain-span">' + remaining + '</span></button>';
    } else {
        var btn_book = '<button class="btn btn-danger book-btn">已满</button>';
        var btn_tip = '<button class="btn btn-danger remain-btn" disabled="disabled">剩余<span class="badge remain-span">0</span></button>';
    }
    
    lastRow = list.find('div.class-row:last-child');
    lastRow.find('.content-col').append(
        '<div>' +
        '<div class="cls-col">' + 
            cls_col + 
            cls_tip + 
        '</div>' + 
        '<div class="book-col" data-id="' + item._id + '">' + 
            btn_book + 
            btn_tip + 
        '</div>' +
        '</div>');
};

function updateSchedule(control) {
    clearSchedule();
    var begin = moment(currentMonday);
    var end = moment(currentMonday).add(7, 'days');
    $.ajax("/api/classes", {
        type : "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        data : {
            from : begin.toISOString(),
            to : end.toISOString(),
            classroom : getCurrentClassRoom(),
            tenant : common.getTenantName()
        },
        success : function (data) {
            for (var i = 0; i < data.length; i++) {
                //cache every displayed class or event
                cls_cache[data[i]._id] = data[i];
                displayClass(data[i]);
            }
            if (!data.length) {
                displayNoClassWarning(begin);
            }
            scrollToToday();
        },
        error : function (jqXHR, status, err) {
            console.error(jqXHR.responseText);
        },
        complete : function (jqXHR, status) {
            if (control) {
                control.prop("disabled", false);
            }
        },
        dataType : "json"
    });
};

function scrollToToday() {
    var coordinate = $('div.class-row button[disabled!=disabled]').offset();
    if (coordinate) {
        var container = $('#main');
        var position = coordinate.top - container.offset().top + container.scrollTop();
        container.animate({
            scrollTop: position
        }, 1000);
    }
};

function displayNoClassWarning(Monday) {
    var list = $('#main');
    // add separator bar
    list.append('<div class="class-separator"></div>');
    // append a warning bar
    list.append("<div class='alert alert-warning' role='alert' style='margin-top:7px'><strong>提示：</strong>本周没有课程，请查看下一周</div>");
};

function clearSchedule() {
    // remove all classes and separators
    $('#main .class-separator').remove();
    $('#main .class-row').remove();
    $('#main .alert-warning').remove();
};

function getAgeLimit(cls) {
    if (cls.age && cls.age.min && cls.age.max) {
        return "年龄" + cls.age.min + "至" + cls.age.max + "月";
    } else if (cls.age && cls.age.min) {
        return "年龄大于" + cls.age.min + "月";
    } else if (cls.age && cls.age.max) {
        return "年龄小于" + cls.age.max + "月";
    }
    return "";
};

function getParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var param = window.location.search.substr(1).match(reg);
    return param ? decodeURI(param[2]) : null;
};
},{"./common":2}],2:[function(require,module,exports){
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
    getTenantName : function() {
        var pathname = window.location.pathname;
        if (pathname.length == 0) return "";
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        if (pathname.charAt(0) == 't') pathname = pathname.substring(1);
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        return pathname.split( '/' )[0];
    }
};
},{}]},{},[1]);
