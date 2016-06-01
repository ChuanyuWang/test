(function ($) {
    // local cache for class or event
    window.cls_cache = {};
    
    var TYPE_NAME = {
        story : '故事会',
        event : '主题活动'
    }

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();

        // reset dialog status when add a new class or event
        $('#cls_dlg').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget); // Button that triggered the modal
            if (button.text() == "+") {
                // create a new class
                var rowIndex = $("#cls_table tr").index(button.closest('tr'));
                var colIndex = $("#cls_table td").index(button.closest('td')) % 8;
            }
            var modal = $(this);
            modal.find('#cls_name').val("");
            modal.find('#cls_capacity').val(8);
            modal.find('#cls_date').text(generateDate(rowIndex, colIndex, currentMonday).format('lll'));
        });

        $('#cls_dlg').on('shown.bs.modal', function (event) {
            $(this).find('#cls_name').focus(); // focus on the class name input control
        });

        // listen to the action button on modal dialogs
        $('#create_cls').click(handleAddNewClass);
        $('#modify_cls').click(handleModifyClass);

        // listen to the previous week and next week button
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

        $('#current_week').click(function (event) {
            $("this").prop("disabled", true);
            currentMonday = getMonday(moment());
            updateWeekInfo(currentMonday);
            updateSchedule($("this"));
        });
    });

    // Functions =============================================================

    function init() {
        console.log("welcome~~~");
        moment.locale('zh-CN');
        bootbox.setLocale('zh_CN');
        currentMonday = getMonday(moment());
        updateWeekInfo(currentMonday);
        updateSchedule();
    };

    // Get the Monday of specific date, each week starts from Monday
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
        // add the date info in header
        var items = $('#cls_table thead tr th+th');
        $.each(items, function(index, item) {
            var temp = moment(Monday).add(index, 'days');
            $(item).html(temp.format('dddd') + '<br>' + temp.format('MMMDo'));
        });
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
    
    function handleAddNewClass(event) {
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
        classItem.capacity = parseInt(modal.find('#cls_capacity').val());
        if (isNaN(classItem.capacity) || classItem.capacity <= 0) {
            modal.find('#cls_capacity').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('#cls_capacity').closest(".form-group").removeClass("has-error");
        }

        if (!hasError) {
            modal.modal('hide');
            addNewClass(classItem);
        }
    };

    function addNewClass(classItem) {
        $.ajax("api/classes", {
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(classItem),
            success : function (data) {
                // update the cache
                cls_cache[data._id] = data;
                displayClass(data);
            },
            error : function (jqXHR, status, err) {
                console.error(jqXHR.responseText);
            },
            dataType : "json"
        });
    };

    function displayClass(item) {
        var date = moment(item.date);
        // day is 0 if it's Sunday
        var colIndex = (date.day() == 0) ? 7 : date.day();
        if (date.hour() < 12) {
            var rowIndex = 1;
        } else if (date.hour() < 18) {
            var rowIndex = 2;
        } else {
            var rowIndex = 3;
        }

        colIndex = colIndex + 1; // append the first column
        var cell = $('#cls_table tbody tr:nth-child(' + rowIndex + ') td:nth-child(' + colIndex + ')');
        cell.data('id', item._id);
        cell.find('p').text(item.name);
        cell.find('.btn-group').empty();
        cell.find('.btn-group').append('<button class="btn btn-primary">查看 </button>');
        cell.find('.btn-primary').click(handleViewClass);
        cell.find('.btn-primary').append('<span class="badge">' + item.reservation + '</span>');
        cell.find('.btn-group').append('<button class="btn btn-danger">删除</button>');
        cell.find('.btn-danger').click(handleRemoveClass);
        if (item.reservation > 0) {
            cell.addClass('success');
        } else {
            cell.addClass('info');
        }
    };
    
    function handleViewClass(event) {
        var cell = $(this).closest('td');
        var class_id = cell.data('id');
        var class_item = cls_cache[class_id];
        
        if (!class_item) {
            console.error("Can't find the class info with id: " + class_id);
            return;
        }
        
        var modal = $('#view_dlg');
        modal.find('#cls_name').val(class_item.name);
        modal.find('#cls_type').text(TYPE_NAME[class_item.type]);
        modal.find('#cls_date').text(moment(class_item.date).format('lll'));
        modal.find('#cls_capacity').val(class_item.capacity);

        // cache the class ID on member table
        modal.find('#member_table').data('classid', class_id);
        modal.find('#member_table').bootstrapTable('removeAll');
        modal.find('#member_table').bootstrapTable('refresh', {url:'api/booking', query:{classid:class_id}});
        $('#view_dlg').modal('show');
    };
    
    function handleModifyClass(event) {
        var modal = $(this).closest('.modal');
        var hasError = false;
        // validate the input
        var classItem = {};
        classItem.name = modal.find('#cls_name').val();
        if (!classItem.name || classItem.name.length == 0) {
            modal.find('#cls_name').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('#cls_name').closest(".form-group").removeClass("has-error");
        }
        // get capacity
        classItem.capacity = parseInt(modal.find('#cls_capacity').val());
        if (isNaN(classItem.capacity) || classItem.capacity <= 0) {
            modal.find('#cls_capacity').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('#cls_capacity').closest(".form-group").removeClass("has-error");
        }

        if (!hasError) {
            var class_id = modal.find('#member_table').data('classid');
            $.ajax("api/classes/" + class_id, {
                type : "PUT",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify(classItem),
                success : function (data) {
                    //close the dialog
                    modal.modal('hide');
                    // update the cache
                    var class_item = cls_cache[class_id];
                    class_item.name = classItem.name;
                    class_item.capacity = classItem.capacity;
                    // update the class schedule
                    displayClass(class_item);
                },
                error : function (jqXHR, status, err) {
                    console.error(jqXHR.responseJSON);
                },
                complete : function(jqXHR, status) {
                    //TODO
                },
                dataType : "json"
            });
        }
    };

    // event handler defined in home.jade file for removing booking item
    window.handleDeleteBook = {
        'click .remove' : function (e, value, row, index) {
            var class_id = $(e.target).closest('table').data('classid');
            
            $.ajax("api/booking/" + class_id, {
                type : "DELETE",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify({memberid:row.member}),
                success : function (data) {
                    // update the cache
                    var class_item = cls_cache[class_id];
                    class_item.reservation -= row.quantity;
                    // update the class schedule
                    displayClass(class_item);
                    $('#member_table').bootstrapTable('removeByUniqueId', row.member);
                },
                error : function (jqXHR, status, err) {
                    console.error(jqXHR.responseJSON);
                },
                complete : function(jqXHR, status) {
                    //TODO
                },
                dataType : "json"
            });
        }
    };

    function handleRemoveClass(event) {
        var cell = $(this).closest('td');
        var item_id = cell.data('id');

        bootbox.confirm("删除此课程吗？", function(result) {
            if (!result) { // user cancel
                return ;
            }

            $.ajax("api/classes/" + item_id, {
                type : "DELETE",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify({dummy:1}),
                success : function (data) {
                    // update the cache
                    cls_cache[item_id] = undefined;
                    cell.data('id', undefined);
                    cell.find('p').empty();
                    cell.find('.btn-group').empty();
                    cell.find('.btn-group').append('<button class="btn btn-default" data-toggle="modal" data-target="#cls_dlg">+</button>');
                    cell.removeClass('success');
                    cell.removeClass('info');
                },
                error : function (jqXHR, status, err) {
                    bootbox.dialog({
                        message : jqXHR.responseJSON.message,
                        title : "删除失败",
                        buttons : {
                            danger : {
                                label : "确定",
                                className : "btn-danger",
                            }
                        }
                    });
                },
                complete : function(jqXHR, status) {
                    //TODO
                },
                dataType : "json"
            });
        });
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
                    // update the cache
                    cls_cache[data[i]._id] = data[i];
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
        $('<td>\
          <p></p>\
          <div class="btn-group btn-group-xs pull-right">\
             <button class="btn btn-default" data-toggle="modal" data-target="#cls_dlg">+</button>\
           </div>\
         </td>').replaceAll("#cls_table tbody td+td");
    };

    function getParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var param = window.location.search.substr(1).match(reg);
        return param ? param[2] : undefined;
    };
})(jQuery);
