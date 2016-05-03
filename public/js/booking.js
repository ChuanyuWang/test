(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();
        
        $.getJSON("/bqsq/api/currentuser", function(data) {
            console.log("get user from server %j", data);

            if (data) {
                var infobar = $("#user");
                infobar.append("<div class='alter alert-info' role='alert'>" + data.nickname + "</div>");
            }
        }).fail(function() {
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
        
        $('#previous_week').click(function (event) {
            $("this").prop("disabled", true);
            currentMonday.subtract(7, 'days');
            updateWeekInfo(currentMonday);
            updateSchedule($("this"));
        });

        $('#next_week').click(function (event) {
            $("this").prop("disabled", true);
            currentMonday.add(7, 'days');
            updateWeekInfo(currentMonday);
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
        $.each(items, function(index, item) {
            var temp = moment(Monday).add(index, 'days');
            $(item).html(temp.format('dddd') + '<br>' + temp.format('MMMD'));
        });
    };
    
    // append a class for booking at the end of page
    function displayClass(item) {
        var list = $('#main');
        console.log('display class: ', item);
        var date = moment(item.date);
        
        var tmp = date.format('MMMDo');
        var lastRow = list.find('div.class-row:last-child');
        if (!lastRow || lastRow.find('.date-col p').text().indexOf(tmp) == -1) {
            // TODO, add separator bar
            
            // append a new class row
            lastRow = list.append('<div class="row class-row">' + 
            '<div class="col-xs-2 date-col"><p>' + tmp + '<br>' + 
            date.format('dddd') + '</p></div><div class="col-xs-10 content-col"></div></div>');
        }

        // insert a class at this row
        lastRow.find('.content-col').append('<div><div class="cls-col"><p>' + 
            item.name + '</p><p class="cls-tip">' + date.format() + 
            '</p></div><div class="book-col"><button class="btn btn-primary btn-md book-btn">预订</button><button class="btn btn-primary btn-md remain-btn">剩余<span class="badge remain-span">4</span></button></div></div>');
            
        /*
        // day is 0 if it's Sunday
        var rowIndex = (date.day() == 0) ? 7 : date.day();
        if (date.hour() < 12) {
            var colIndex = 1;
        } else if (date.hour() < 18) {
            var colIndex = 2;
        } else {
            var colIndex = 3;
        }

        colIndex = colIndex + 1; // append the first column
        var cell = $('#book_table tbody tr:nth-child(' + rowIndex + ') td:nth-child(' + colIndex + ')');
        cell.data('id', item._id);
        cell.text(item.name);
        if (item.reservation > 0) {
            cell.addClass('success');
        } else {
            cell.addClass('info');
        }
        */
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
                for (var i=0; i<data.length; i++) {
                    displayClass(data[i]);
                }
            },
            error : function (jqXHR, status, err) {
                console.error(jqXHR.responseText);
            },
            complete : function(jqXHR, status) {
                if (control) {
                    control.prop("disabled", false);
                }
            },
            dataType : "json"
        });
    };
    
    function clearSchedule() {
        // replace all the table cell in tbody except the first column
        $('<td></td>').replaceAll("#book_table tbody td+td");
    };

    // Functions =============================================================
    function getParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var param = window.location.search.substr(1).match(reg);
        return param ? param[2] : undefined;
    };
})(jQuery);
