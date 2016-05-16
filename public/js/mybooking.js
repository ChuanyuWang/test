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
        
        $('#login_ok').click(handleLoginOK);

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
        updateSchedule();
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

        if (!hasError) {
            modal.modal('hide');
            addNewBook(bookInfo);
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
        if (item.type == "story") {
            var cls_tip = '<p class="cls-tip">' + date.format('HH:mm') + '开始 <span class="cls-story">故事会</span></p>';
        } else if (item.type == "event") {
            var cls_tip = '<p class="cls-tip">' + date.format('HH:mm') + '开始 <span class="cls-event">主题活动</span></p>';
        } else {
            var cls_tip = '<p class="cls-tip">' + date.format('HH:mm') + '开始</p>';
        }
        
        var remaining = item.capacity - item.reservation;
        if (date < moment().subtract(1, 'hours')) {
            // the class or event is finished one hours ago
            var btn_book = '<button class="btn btn-default btn-md finish-btn" disabled="disabled">结束</button>';
            var btn_tip = '';
        } else if (remaining > 0) {
            var btn_book = '<button class="btn btn-primary btn-md book-btn" data-toggle="modal" data-target="#book_dlg">预约</button>';
            var btn_tip = '<button class="btn btn-primary btn-md remain-btn" disabled="disabled">剩余<span class="badge remain-span">' + remaining + '</span></button>';
        } else {
            var btn_book = '<button class="btn btn-danger btn-md book-btn">已满</button>';
            var btn_tip = '<button class="btn btn-danger btn-md remain-btn" disabled="disabled">剩余<span class="badge remain-span">0</span></button>';
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
    
    function showMyBooking() {
        getMemberID(function(memberid){
            if (!memberid) {
                //TODO, show the dialog to retrieve memberid
            }
        });
    };

    function updateSchedule(memberid, isHistory, control) {
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
                if (control) {
                    control.prop("disabled", false);
                }
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
