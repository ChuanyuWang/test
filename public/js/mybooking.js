(function ($) {
    // local cache for class or event
    window.cls_cache = {};
    // open id of Weichat user
    window._openid = undefined;
    
    var TYPE_NAME = {
        story : '故事会',
        event : '主题活动'
    }

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
        
        $('.nav-tabs a').click(function (e) {
            var type = $(e.target).attr('href');
            if (type == '#future') {
                showMyBooking(false, type);
            } else if (type == '#history') {
                showMyBooking(true, type);
            }
            //e.preventDefault();
            //$(this).tab('show');
        });

        $('#login_dlg').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget); // Button that triggered the modal
            var item_id = button.closest('.book-col').data('id');
            var item = cls_cache[item_id];
            if (!item) {
                alert("网络异常，请刷新重试");
                event.preventDefault();
                console.error("Can't get the class or event item with id %s", item_id);
                return;
            }
            // var recipient = button.data('whatever'); // Extract info from data-* attributes
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            var modal = $(this);
            modal.find('#quantity').val(1);
            modal.find('#time').text(moment(item.date).format('MMMDoah:mm'));
            modal.find('#content').text(item.name);
            modal.find('#book_ok').data('id', item._id);
        });
        
        $('#login .btn').click(handleLoginOK);

        $('#show_reservation').click(function (event) {
            $("this").prop("disabled", true);
            currentMonday.subtract(7, 'days');
            updateSchedule($("this"));
        });

        $('#show_history').click(function (event) {
            $("this").prop("disabled", true);
            currentMonday.add(7, 'days');
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
        
        getMemberID(function(memberid){
            if (!memberid) {
                toggleLoginForm(true);
            } else {
                updateSchedule();
            }
        });
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

    function handleLoginOK(event) {
        event.preventDefault();
        var modal = $(this).closest('.form-horizontal');
        var hasError = false;
        // validate the input
        var userInfo = {};
        userInfo.name = modal.find('input[name=name]').val().trim();
        if (!userInfo.name || userInfo.name.length == 0) {
            modal.find('input[name=name]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
        }
        // get contact
        userInfo.contact = modal.find('input[name=contact]').val().trim();
        if (!userInfo.contact || userInfo.contact.length == 0) {
            modal.find('input[name=contact]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('input[name=contact]').closest(".form-group").removeClass("has-error");
        }

        if (!hasError) {
            addNewBook(userInfo);
        }
    };
    
    function displayError(error, bookInfo) {
        $('#error_dlg').find("p#message").text(error.message);
        $('#error_dlg').modal('show');
    };
    
    function displaySuccess(member, classInfo) {
        var message = "请于" + moment(classInfo.date).format('MMMDoah:mm') + "准时参加";
        message += '<br>会员' + TYPE_NAME[classInfo.type] + '剩余' + member.point[classInfo.type] + '次';
        $('#success_dlg').find("p#message").html(message);
        $('#success_dlg').modal('show');
        
        // send a message to user through weixin
        if (_openid) {
            var msg = {
                openid : _openid,
                message : "亲爱的会员，您已成功预约" + moment(classInfo.date).format('MMMDoah:mm') 
                    + "的" + TYPE_NAME[classInfo.type] + "，请准时参加。\n" + TYPE_NAME[classInfo.type] +
                    "剩余次数：" + member.point[classInfo.type]
            }
            $.ajax("api/sendText", {
                type : "POST",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify(msg),
                success : function (data) {
                    //TODO
                },
                error : function (jqXHR, status, err) {
                    console.error(jqXHR.responseText);
                },
                dataType : "json"
            });
        }
    };

    // append a class for booking at the end of page
    function displayClass(item) {
        var list = $('.tab-content .active');
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
        var cls_tip = '<p class="cls-tip"><span class="glyphicon glyphicon-time"></span>';
        if (item.type == "story") {
            cls_tip += date.format('HH:mm') + '开始 <span class="cls-story">故事会</span></p>';
        } else if (item.type == "event") {
            cls_tip += date.format('HH:mm') + '开始 <span class="cls-event">主题活动</span></p>';
        } else {
            cls_tip += date.format('HH:mm') + '开始</p>';
        }

        if (date > moment()) {
            var btn_tip = '<p class="cls-status text-danger">(未上)</p>';
        } else {
            var btn_tip = '<p class="cls-status text-info">(已上)</p>';
        }
        
        lastRow = list.find('div.class-row:last-child');
        lastRow.find('.content-col').append(
          '<div>' +
            '<div class="cls-col">' + 
                cls_col + 
                cls_tip + 
            '</div>' + 
            '<div class="book-col" data-id="' + item._id + '">' + 
                btn_tip + 
            '</div>' +
          '</div>');
    };
    
    // callback(memberid | null)
    function getMemberID(callback) {
        if (localStorage._memberid) {
            callback(memberid);
        } else if (localStorage._name && localStorage._contact) {
            $.ajax("api/members", {
                type : "GET",
                //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
                data : {
                    name : localStorage._name,
                    contact : localStorage._contact
                },
                success : function (data) {
                    if (data && data.length > 0) {
                        localStorage._memberid = data[0]._id;
                        callback(data[0]._id);
                    }
                    else {
                        callback(null);
                    }
                },
                error : function (jqXHR, status, err) {
                    console.error(jqXHR.responseText);
                    callback(null);
                },
                complete : function (jqXHR, status) {
                    if (control) {
                        control.prop("disabled", false);
                    }
                },
                dataType : "json"
            });
        } else {
            // can't retrieve the member id
            callback(null);
        }
    };
    
    function toggleLoginForm(isShow) {
        // display the login form for user to input name and contact
        if (isShow) {
            $('#user_info').hide();
            $('#main .nav-tabs').hide();
            $('#main .tab-content').hide();
            $('#main form').show();
        } else {
            $('#main form').hide();
            $('#user_info').show();
            $('#main .nav-tabs').show();
            $('#main .tab-content').show();
        }
    };
    
    function showMyBooking(isHistory, tab_id) {
        getMemberID(function(memberid){
            if (!memberid) {
                toggleLoginForm(true);
            } else {
                // query the booking info
                updateSchedule(memberid, isHistory, tab_id);
            }
        });
    };

    function updateSchedule(memberid, isHistory, tab_id) {
        clearSchedule();
        if (isHistory) {
            var begin = moment(0);
            var end = moment();
        } else { // show the booking in one year
            var begin = moment();
            var end = moment(begin).add(1, 'years');
        }
        $.ajax("api/classes", {
            type : "GET",
            //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
            data : {
                from : begin.toISOString(),
                to : end.toISOString(),
                memberid : memberid
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
            },
            error : function (jqXHR, status, err) {
                console.error(jqXHR.responseText);
            },
            complete : function (jqXHR, status) {
                //TODO
            },
            dataType : "json"
        });
    };
    
    function displayNoClassWarning(Monday) {
        var list = $('#main');
        // add separator bar
        list.append('<div class="class-separator"></div>');
        // append a warning bar
        list.append("<div class='alert alert-warning' role='alert' style='margin-top:7px'><strong>提示：</strong>没有找到预约课程</div>");
    };

    function clearSchedule() {
        // remove all classes and separators
        $('.class-row,.class-separator').remove();
        $('.alert-warning').remove();
    };
})(jQuery);
