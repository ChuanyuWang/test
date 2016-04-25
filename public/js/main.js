(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {

        // enable jQuery UI tooltip
        //$(document).tooltip();

        // populate task list & initialize table
        //require(['taskManager'], function (taskManager) {
        //    taskManager.populateList('#tasklist');
        //});

        init();

        $('#cls_dlg').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget); // Button that triggered the modal
            if (button.text() == "+") {
                // create a new class
                var rowIndex = $("#cls_table tr").index(button.closest('tr'));
                var colIndex = $("#cls_table td").index(button.closest('td')) % 8;
            }
            var recipient = button.data('whatever'); // Extract info from data-* attributes
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            var modal = $(this);
            modal.find('#cls_name').val("");
            modal.find('#cls_capacity').val(8);
            modal.find('#cls_date').text(generateDate(rowIndex, colIndex, currentMonday).format('lll'));
        });

        $('#create_cls').click(function (event) {
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
            classItem.type = modal.find('.active input').data('value');
            // get capacity
            classItem.capacity = Number.parseInt(modal.find('#cls_capacity').val());

            if (!hasError) {
                modal.modal('hide');
                addNewClass(classItem);
            }
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
        currentMonday = getMonday(moment());
        updateWeekInfo(currentMonday);
        //clearSchedule();
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
        var Sunday = moment(Monday).add(6, "days");
        var info = Monday.format('ll') + ' 至 ' + Sunday.format('ll');
        $('#currentWeekRange').text(info);
    };

    function generateDate(rowIndex, colIndex, currentMonday) {
        var temp = moment(currentMonday);
        temp.add(colIndex - 1, 'days');
        temp.seconds(0);
        temp.milliseconds(0);
        switch (rowIndex) {
        case 1: // morning
            temp.hours(10);
            temp.minutes(30);
            break;
        case 2: // afternoon
            temp.hours(16);
            temp.minutes(30);
            break;
        case 3: // evening
            temp.hours(19);
            temp.minutes(00);
            break;
        default:
            throw "Invalid time slot"
        }
        return temp;
    };

    function addNewClass(classItem) {
        $.ajax("api/classes", {
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(classItem),
            success : function (data) {
                console.log("add class successfully");
            },
            error : function (err) {
                console.error(err.responseText);
            },
            dataType : "json"
        });
    };

    function displayClass(item) {
        //TODO
    };

    function updateSchedule(control) {
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
                for (var item in data) {
                    displayClass(item);
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
        $('<td>\
          <p></p>\
          <div class="btn-group btn-group-xs pull-right">\
             <button class="btn btn-default" data-toggle="modal" data-target="#cls_dlg">+</button>\
           </div>\
         </td>').replaceAll("#cls_table tbody td+td");
    };

    // Functions =============================================================
    function getParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var param = window.location.search.substr(1).match(reg);
        return param ? param[2] : undefined;
    };
})(jQuery);
