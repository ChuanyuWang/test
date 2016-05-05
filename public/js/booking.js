(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();

        $.getJSON("/bqsq/api/currentuser", function (data) {
            console.log("get user from server %j", data);

            if (data) {
                var infobar = $("#user");
                infobar.append("<div class='alter alert-info' role='alert'>" + data.nickname + "</div>");
            }
        }).fail(function () {
            var infobar = $("#user");
            infobar.append("<div class='alter alert-info' role='alert'>no user</div>");
        });

        $('#book').click(function (event) {
            $.post("api/sendText", {
                foo : "hello world"
            }, function (data) {
                console.log("booking successfully");
                var infobar = $("#info");
                infobar.append("<div class='alter alert-success' role='alert'>预定成功</div>")
            }).fail(function (err) {
                console.error(err);
                var infobar = $("#info");
                infobar.append("<div class='alter alert-danger' role='alert'>预定失败</div>")
            });
        });
        
        $('#book_dlg').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget); // Button that triggered the modal
            
            if (button.text() == "+") {
                // create a new class
                var rowIndex = $("#cls_table tr").index(button.closest('tr'));
                var colIndex = $("#cls_table td").index(button.closest('td')) % 8;
            }
            // var recipient = button.data('whatever'); // Extract info from data-* attributes
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            var modal = $(this);
            //modal.find('#name').val("");
            //modal.find('#contact').val("");
            modal.find('#quantity').val(1);
        });
        
        $('#book_ok').click(handleBookOK);

        $('#previous_week').click(function (event) {
            $("this").prop("disabled", true);
            currentMonday.subtract(7, 'days');
            //updateWeekInfo(currentMonday);
            updateSchedule($("this"));
        });

        $('#next_week').click(function (event) {
            $("this").prop("disabled", true);
            currentMonday.add(7, 'days');
            //updateWeekInfo(currentMonday);
            updateSchedule($("this"));
        });
        
        $('#current_week').click(function (event) {
            $("this").prop("disabled", true);
            currentMonday = getMonday(moment());
            //updateWeekInfo(currentMonday);
            updateSchedule($("this"));
        });
    });

    function init() {
        console.log("welcome~~~");
        moment.locale('zh-CN');
        bootbox.setLocale('zh_CN');
        $('#currentWeekRange').text(moment().format('[今天] MMMDo'));
        currentMonday = getMonday(moment());
        updateWeekInfo(currentMonday);
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

    function updateWeekInfo(Monday) {
        // update the date in the first column
        var items = $('#book_table tbody tr td:nth-child(1)');
        $.each(items, function (index, item) {
            var temp = moment(Monday).add(index, 'days');
            $(item).html(temp.format('dddd') + '<br>' + temp.format('MMMD'));
        });
    };
    
    function handleBookOK(event) {
        var modal = $(this).closest('.modal');
        var hasError = false;
        // validate the input
        var classItem = {
            reservation : 0
        };
        classItem.name = modal.find('#cls_name').val();
        if (!classItem.name || classItem.name.length == 0) {
            modal.find('#cls_name').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('#cls_name').closest(".form-group").removeClass("has-error");
        }
        // get date
        classItem.date = moment(modal.find('#cls_date').text(), 'lll');
        // get type
        classItem.type = modal.find('.active input').val();
        // get capacity
        classItem.capacity = Number.parseInt(modal.find('#cls_capacity').val());

        if (!hasError) {
            modal.modal('hide');
            addNewClass(classItem);
        }
    };

    // append a class for booking at the end of page
    function displayClass(item) {
        var list = $('#main');
        var date = moment(item.date);

        var tmp = date.format('MMMDo');
        var lastRow = list.find('div.class-row:last-child');
        if (!lastRow || lastRow.find('.date-col p').text().indexOf(tmp) == -1) {
            // add separator bar
            list.append('<div class="class-separator"></div>');
            // append a new class row
            list.append('<div class="row class-row">' +
                            '<div class="col-xs-2 date-col">' + 
                                '<p>' + tmp + '<br>' + date.format('dddd') + '</p>' + 
                            '</div>' + 
                            '<div class="col-xs-10 content-col"></div>' + 
                        '</div>');
        }

        // insert a class in last row
        var cls_col = '<p>' + item.name + '</p>';
        if (item.type == "story") {
            var cls_tip = '<p class="cls-tip">' + date.format('HH:mm') + '开始<span class="cls-story">故事会</span></p>';
        } else if (item.type == "event") {
            var cls_tip = '<p class="cls-tip">' + date.format('HH:mm') + '开始<span class="cls-event">主题活动</span></p>';
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
          '<div data-id="' + item._id + '">' +
            '<div class="cls-col">' + 
                cls_col + 
                cls_tip + 
            '</div>' + 
            '<div class="book-col">' + 
                btn_book + 
                btn_tip + 
            '</div>' +
          '</div>');
    };

    function updateSchedule(control) {
        clearSchedule();
        var begin = moment(currentMonday);
        var end = moment(currentMonday).add(7, 'days');
        $.ajax("api/classes", {
            type : "GET",
            //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
            data : {
                from : begin.toISOString(),
                to : end.toISOString()
            },
            success : function (data) {
                for (var i = 0; i < data.length; i++) {
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
        list.append("<div class='alert alert-warning' role='alert' style='margin-top:7px'><strong>提示：</strong>本周没有课程，请查看下一周</div>");
    };

    function clearSchedule() {
        // remove all classes and separators
        $('.class-row,.class-separator').remove();
        $('.alert-warning').remove();
    };

    // Functions =============================================================
    function getParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var param = window.location.search.substr(1).match(reg);
        return param ? param[2] : undefined;
    };
})(jQuery);
