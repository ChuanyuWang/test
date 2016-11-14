(function ($) {
    // local cache for class or event
    window.cls_cache = {};

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
            modal.find('#cls_name').val("").closest(".form-group").removeClass("has-error");
            modal.find('input[name=cost]').val(1).closest(".form-group").removeClass("has-error");
            modal.find('#cls_capacity').val(8).closest(".form-group").removeClass("has-error");
            modal.find('input[name=age_min]').val(24).closest(".form-group").removeClass("has-error");
            modal.find('input[name=age_max]').val(48).closest(".form-group").removeClass("has-error");
            var defaultDate = generateDate(rowIndex, colIndex, currentMonday)
            modal.find('#cls_date').text(defaultDate.format('ll'));
            var timePicker = modal.find('#cls_time').data('DateTimePicker').minDate(false).maxDate(false).date(defaultDate);
            // add the limitation of each slot
            if (rowIndex == 1 || rowIndex == 2) {// morning
                timePicker.minDate(defaultDate.hour(6).minute(0));
                timePicker.maxDate(defaultDate.hour(11).minute(59));
            } else if (rowIndex == 3 || rowIndex == 4) { // afternoon
                timePicker.minDate(defaultDate.hour(12).minute(0));
                timePicker.maxDate(defaultDate.hour(17).minute(59));
            } else if (rowIndex == 5 || rowIndex == 6) { // evening
                timePicker.minDate(defaultDate.hour(18).minute(0));
                timePicker.maxDate(defaultDate.hour(23).minute(59));
            }
        });

        $('#cls_dlg').on('shown.bs.modal', function (event) {
            $(this).find('#cls_name').focus(); // focus on the class name input control
        });

        // listen to the action button on modal dialogs
        $('#create_cls').click(handleAddNewClass);
        $('#modify_cls').click(handleModifyClass);
        $('#add_reservation').click(handleAddReservation);
        $('#add_books').click(handleAddBooks);

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
        
        // handle user change the classroom
        $('#chooseRoom').change(function (event) {
            updateSchedule();
        });
    });

    // Functions =============================================================

    function init() {
        console.log("welcome~~~");
        moment.locale('zh-CN');
        bootbox.setLocale('zh_CN');
        $('#cls_time').datetimepicker({
            locale : 'zh-CN',
            format: 'LT'
        });
        currentMonday = getMonday(moment());
        updateWeekInfo(currentMonday);
        initClassRoomList();
        updateSchedule();
    };
    
    function initClassRoomList() {
        if (!getCurrentClassRoom()) {
            // show a single button to create class room
            $('#create_cls_panel').show();
        } else {
            // show class schedule according to the first classroom
            $('#cls_table').show();
        }
    };
    
    function getCurrentClassRoom() {
        var classroom = $('#chooseRoom option:selected');
        if (classroom.length == 1) {
            return classroom.val();
        }
        return null;
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
        case 2: // morning
            temp.hours(10);
            temp.minutes(00);
            break;
        case 3: // afternoon
        case 4: // afternoon
            temp.hours(16);
            temp.minutes(40);
            break;
        case 5: // evening
        case 6: // evening
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
        // get date/time
        classItem.date = moment(modal.find('#cls_date').text(), 'll');
        var time = modal.find('#cls_time').data("DateTimePicker").date();
        classItem.date.hours(time.hours());
        classItem.date.minutes(time.minutes());
        // get cost
        classItem.cost = parseFloat(modal.find('input[name=cost]').val());;
        if (isNaN(classItem.cost) || classItem.cost < 0) {
            modal.find('input[name=cost]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('input[name=cost]').closest(".form-group").removeClass("has-error");
        }
        // get capacity
        classItem.capacity = parseInt(modal.find('#cls_capacity').val());
        if (isNaN(classItem.capacity) || classItem.capacity < 0) {
            modal.find('#cls_capacity').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('#cls_capacity').closest(".form-group").removeClass("has-error");
        }
        // get age limitation
        classItem.age = {min:null,max:null};
        var input = modal.find('input[name=age_min]');
        if (input.val()) {
            classItem.age.min = parseInt(input.val());
            if (isNaN(classItem.age.min) || classItem.age.min < 0) {
                input.closest(".form-group").addClass("has-error");
                hasError = true;
            } else {
                input.closest(".form-group").removeClass("has-error");
            }
        }
        
        var input = modal.find('input[name=age_max]');
        if (input.val()) {
            classItem.age.max = parseInt(input.val());
            if (isNaN(classItem.age.max) || classItem.age.max < 0) {
                input.closest(".form-group").addClass("has-error");
                hasError = true;
            } else {
                input.closest(".form-group").removeClass("has-error");
            }
        }
        
        // get classroom
        classItem.classroom = getCurrentClassRoom();

        if (!hasError) {
            // switch the age.min and age.max if min is bigger than max
            if (classItem.age.min!=null && classItem.age.max!=null && classItem.age.min > classItem.age.max) {
                var temp = classItem.age.max;
                classItem.age.max = classItem.age.min;
                classItem.age.min = temp;
            }
            $.ajax("api/classes", {
                type : "POST",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify(classItem),
                success : function (data) {
                    // update the cache
                    cls_cache[data._id] = data;
                    displayClass(data);
                    modal.modal('hide');
                },
                error : function (jqXHR, status, err) {
                    showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
                },
                dataType : "json"
            });
        }
    };

    function displayClass(item) {
        var date = moment(item.date);
        // day is 0 if it's Sunday
        var colIndex = (date.day() == 0) ? 7 : date.day();
        if (date.hour() < 12) {
            var min = 1;
            var max = 2;
        } else if (date.hour() < 18) {
            var min = 3;
            var max = 4;
        } else {
            var min = 5;
            var max = 6;
        }
        colIndex = colIndex + 1; // append the first column
        var firstEmptyRow = null;
        for (var i=min;i<=max;i++) {
            var cell = $('#cls_table tbody tr:nth-child(' + i + ') td:nth-child(' + colIndex + ')');
            // locate the cell by class's id
            if (cell.data('id') == item._id) {
                var rowIndex = i;
                break;
            }
            if (!firstEmptyRow && !cell.data('id')) {
                firstEmptyRow = i;
            }
        }
        var rowIndex = rowIndex || firstEmptyRow;
        if (!rowIndex) {
            console.error("can't find the empty cell to display the class item ", item);
            showErrorMsg("课表已满，无法显示该课程");
            return;
        }

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
            cell.removeClass("info");
            cell.addClass('success');
        } else {
            cell.removeClass("success");
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
        modal.find('#cls_name').val(class_item.name).closest(".form-group").removeClass("has-error");
        modal.find('#cls_cost').text(class_item.cost);
        modal.find('#cls_date').text(moment(class_item.date).format('lll'));
        modal.find('#cls_capacity').val(class_item.capacity).closest(".form-group").removeClass("has-error");
        if (class_item.age) {
            modal.find('input[name=age_min]').val(class_item.age.min).closest(".form-group").removeClass("has-error");
            modal.find('input[name=age_max]').val(class_item.age.max).closest(".form-group").removeClass("has-error");
        }

        // cache the class ID on member table
        modal.find('#member_table').data('classid', class_id);
        modal.find('#member_table').bootstrapTable('removeAll');
        modal.find('#member_table').bootstrapTable('refresh', {url:'api/booking', query:{classid:class_id}});
        $('#view_dlg').modal('show');
    };
    
    function handleAddReservation(event) {
        var view_dlg = $(this).closest('.modal');
        var class_id = view_dlg.find('#member_table').data('classid');
        view_dlg.modal('hide');
        
        var class_item = cls_cache[class_id];
        if (!class_item) {
            console.error("Can't find the class info with id: " + class_id);
            return;
        }
        
        // set the class id
        var book_dlg = $('#search_member');
        book_dlg.find('table').data('classid', class_id);
        book_dlg.find('#cls_name').text(class_item.name);
        book_dlg.find('#quantity').val(1).closest(".form-group").removeClass("has-error");;
		// refresh the member list
        book_dlg.find('table').bootstrapTable('refresh', {url:'api/members'});

        book_dlg.modal('show');
    };
    
    function handleAddBooks(event) {
        var view_dlg = $(this).closest('.modal');
        var class_id = view_dlg.find('#member_table').data('classid');
        view_dlg.modal('hide');
        
        var class_item = cls_cache[class_id];
        if (!class_item) {
            console.error("Can't find the class info with id: " + class_id);
            return;
        }
        
        // set the class id
        var dlg_books = $('#dlg_books');
        //dlg_books.find('table').data('classid', class_id);
        
        // clear the previous contents
        dlg_books.find("div input").each(function(){
            $(this).val(null);
        });
        
        // update the new contents from cache
        var books = class_item.books || [];
        var index = 0;
        dlg_books.find("div.book-item").each(function(){
            if (books[index]) {
                var item = books[index++];
                $(this).find("input[name=book_name]").val(item.title);
                $(this).find("input[name=book_teacher]").val(item.teacher);
                $(this).find("input[name=book_info]").val(item.info);
            }
        });
        
        // hook up the OK button click event
        $('#btn_modify_books').off("click");
        $('#btn_modify_books').click(function(event) {
            //get the update content of books
            var books = [];
            var hasError = false;
            dlg_books.find("div.book-item").each(function(){
                var item = {
                    title : $(this).find("input[name=book_name]").val().trim(),
                    teacher : $(this).find("input[name=book_teacher]").val().trim(),
                    info : $(this).find("input[name=book_info]").val().trim()
                };
                // handle error input
                $(this).find("div").removeClass("has-error");
                // both teach and title are mandatory for one book item
                if (item.teacher && !item.title) {
                    $(this).find("input[name=book_name]").closest("div").addClass("has-error");
                    hasError = true;
                } else if (item.title && !item.teacher) {
                    $(this).find("input[name=book_teacher]").closest("div").addClass("has-error");
                    hasError = true;
                } else if (item.title && item.teacher) {
                    books.push(item);
                }
            });
            
            if (hasError) {
                return; // Don't dismiss the dialog when there is input error
            }
            
            $.ajax("api/classes/" + class_id, {
                type : "PUT",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify({"books" : books}),
                success : function (data) {
                    //close the dialog
                    dlg_books.modal('hide');
                    //update books cache of the class
                    class_item.books = books;
                },
                error : function (jqXHR, status, err) {
                    showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
                },
                complete : function(jqXHR, status) {
                    //TODO
                },
                dataType : "json"
            });
        });
        
        dlg_books.modal('show');
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
        if (isNaN(classItem.capacity) || classItem.capacity < 0) {
            modal.find('#cls_capacity').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('#cls_capacity').closest(".form-group").removeClass("has-error");
        }
        
        // get age limitation
        classItem.age = {min:null,max:null};
        var input = modal.find('input[name=age_min]');
        if (input.val()) {
            classItem.age.min = parseInt(input.val());
            if (isNaN(classItem.age.min) || classItem.age.min < 0) {
                input.closest(".form-group").addClass("has-error");
                hasError = true;
            } else {
                input.closest(".form-group").removeClass("has-error");
            }
        }
        
        var input = modal.find('input[name=age_max]');
        if (input.val()) {
            classItem.age.max = parseInt(input.val());
            if (isNaN(classItem.age.max) || classItem.age.max < 0) {
                input.closest(".form-group").addClass("has-error");
                hasError = true;
            } else {
                input.closest(".form-group").removeClass("has-error");
            }
        }

        if (!hasError) {
            // switch the age.min and age.max if min is bigger than max
            if (classItem.age.min!=null && classItem.age.max!=null && classItem.age.min > classItem.age.max) {
                var temp = classItem.age.max;
                classItem.age.max = classItem.age.min;
                classItem.age.min = temp;
            }
            
            var class_id = modal.find('#member_table').data('classid');
            $.ajax("api/classes/" + class_id, {
                type : "PUT",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify(classItem),
                success : function (data) {
                    //close the dialog
                    modal.modal('hide');
                    // update the cache TODO, get new cls from server
                    var class_item = cls_cache[class_id];
                    class_item.name = classItem.name;
                    class_item.capacity = classItem.capacity;
                    class_item.age = classItem.age;
                    // update the class schedule
                    displayClass(class_item);
                },
                error : function (jqXHR, status, err) {
                    showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
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
                    showSuccessMsg("成功取消预约");
                },
                error : function (jqXHR, status, err) {
                    showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
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

        //TODO, make this confirm as danger style
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
                    cell.data('id', null);
                    cell.find('p').empty();
                    cell.find('.btn-group').empty();
                    cell.find('.btn-group').append('<button class="btn btn-default" data-toggle="modal" data-target="#cls_dlg">+</button>');
                    cell.removeClass('success');
                    cell.removeClass('info');
                    showSuccessMsg("删除成功");
                },
                error : function (jqXHR, status, err) {
                    showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
                },
                complete : function(jqXHR, status) {
                    //TODO
                },
                dataType : "json"
            });
        });
    };
    
    // event handler defined in home.jade file for removing booking item
    window.handleAddBook = {
        'click .book' : function (e, value, row, index) {
            var class_id = $(e.target).closest('table').data('classid');
            var bookInfo = {
                classid : class_id,
                name: row.name,
                contact: row.contact
            };
            
            // get quantity
            var modal = $(e.target).closest('.modal');
            bookInfo.quantity = parseInt(modal.find('#quantity').val());
            if (isNaN(bookInfo.quantity) || bookInfo.quantity <= 0) {
                modal.find('#quantity').closest(".form-group").addClass("has-error");
                return;
            } else {
                modal.find('#quantity').closest(".form-group").removeClass("has-error");
            }
            
            $.ajax("api/booking/", {
                type : "POST",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify(bookInfo),
                success : function (data) {
                    // update the cache
                    var classInfo = data['class'];
                    cls_cache[classInfo._id] = classInfo;
                    // update the class schedule
                    displayClass(classInfo);
                    showSuccessMsg("预约成功");
                    $(e.target).closest('tr').hide(600, function() {
                        $('#search_member table').bootstrapTable('removeByUniqueId', row._id);
                    });
                },
                error : function (jqXHR, status, err) {
                    showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
                },
                complete : function(jqXHR, status) {
                    //TODO
                },
                dataType : "json"
            });
        }
    };
    
    // sort the array of class from Monday to Sunday
    function sortClass(a, b){
        if (!a || !b) {
            return 0;
        }
        
        if (moment(a.date) < moment(b.date)) {
            return -1;
        } else {
            return 1;
        }
    };

    function updateSchedule(control) {
        clearSchedule();
        var begin = moment(currentMonday);
        var end = moment(currentMonday).add(7, 'days');
        $.ajax('api/classes', {
            type : "GET",
            //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
            data : {
                from : begin.toISOString(),
                to : end.toISOString(),
                classroom : getCurrentClassRoom()
            },
            success : function (data) {
                if (data && $.isArray(data)) {
                    // the data is already sorted in server side as "asc"
                    //data.sort(sortClass);
                    for (var i=0; i<data.length; i++) {
                        // update the cache
                        cls_cache[data[i]._id] = data[i];
                        displayClass(data[i]);
                    }
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

    function showSuccessMsg(msg) {
        var alert_bar = $('#alert_bar').removeClass('alert-danger').addClass("alert-success");
        alert_bar.find('span').text(msg);
        alert_bar.finish().show().fadeOut(2000);
    };

    function showErrorMsg(msg) {
        var alert_bar = $('#alert_bar').removeClass('alert-success').addClass("alert-danger");
        alert_bar.find('span').text(msg);
        alert_bar.finish().show().fadeOut(2000);
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
        return param ? decodeURI(param[2]) : undefined;
    };
})(jQuery);
