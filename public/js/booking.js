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

        $('#book').click(function (event) {
            $.post("api/sendText", {
                foo : "hello world"
            }, function (data) {
                console.log("booking successfully");
            }).fail(function (err) {
                console.error(err);
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
