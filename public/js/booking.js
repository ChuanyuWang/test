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
    });

    // Functions =============================================================
    function getParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var param = window.location.search.substr(1).match(reg);
        return param ? param[2] : undefined;
    }
})(jQuery);
