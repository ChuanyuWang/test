(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {

        // enable jQuery UI tooltip
        //$(document).tooltip();

        // populate task list & initialize table
        //require(['taskManager'], function (taskManager) {
        //    taskManager.populateList('#tasklist');
        //});
        console.log("welcome~~~");
        moment.locale('zh-CN');
        //init();
        //clearSchedule();
        updateWeekInfo();

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
            modal.find('#cls_capacity').val(8);
            //modal.find('.modal-title').text('New message to ' + recipient);
        });

        $('#create_cls').click(function (event) {
            var modal = $(this).closest('.modal');
            var hasError = false;
            // validate the input
            var name = modal.find('#cls_name').val();
            if (!name || name.length == 0) {
                modal.find('#cls_name').closest(".form-group").addClass("has-error");
                hasError = true;
            } else {
                modal.find('#cls_name').closest(".form-group").removeClass("has-error");
            }
            
            // get type
            var type = modal.find('.active input').data('value');
            
            var capacity = Number.parseInt(modal.find('#cls_capacity').val());
            
            if (!hasError) {
                modal.modal('hide');
            }
        });

        $('#previous_week').click(function (event) {
            $.ajax({
                type : "POST",
                url : "api/classes",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify({
                    name : '贵贵妈妈《蚂蚁和西瓜》《蚂蚁散步》',
                    date : new Date(),
                    capacity : 8,
                    reservation : 4,
                    kind : 'story'
                }),
                success : function (data) {
                    console.log("add class successfully");
                },
                error : function (err) {
                    console.error(err.responseText);
                },
                dataType : "json"
            });
        });

        $('#next_week').click(function (event) {
            $.ajax({
                type : "GET",
                url : "api/classes",
                //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
                data : {
                    week : 7
                },
                success : function (data) {
                    console.log("get class successfully, %j", data);
                },
                error : function (err) {
                    console.error(err.responseText);
                },
                dataType : "json"
            });
        });
    });

    function init() {
        // listen to the add class button
        //$('.btn-default').click(function (event) {
        $('.btn-default').click(function (event) {
            // pop a model dialog and let user to add a new class
            var rowIndex = $("#cls_table tr").index($(this).closest('tr'));
            var colIndex = $("#cls_table td").index($(this).closest('td')) % 8;

            console.log(this);
        });
    };
    
    function updateWeekInfo() {
        var dayofweek = moment().day();
        // the Monday of this week
        if (dayofweek == 0) {// today is Sunday
            var mon = moment().day(-6);
            var sun = moment().day(0);
        } else {
            var mon = moment().day(1);
            var sun = moment().day(7);
        }
        var info = mon.format('ll') + ' 至 ' + sun.format('ll');
        $('#currentWeekRange').text(info);
    };

    function updateSchedule(weekData) {
        for (var item in weekData) {}
    };

    function clearSchedule() {
        // replace all the table cell in tbody except the first column
        $('<td>\
              <p></p>\
              <div class="btn-group btn-group-xs pull-right">\
                 <button class="btn btn-default">+</button>\
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
