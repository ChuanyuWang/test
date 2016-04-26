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
    });

    // Functions =============================================================

    function init() {
        moment.locale('zh-CN');
        bootbox.setLocale('zh_CN');
        //$('.bootstrap-table').bootstrapTable({'striped':true, 'search':true});
        //$('.bootstrap-table').bootstrapTable('refresh');
    };

    function getParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var param = window.location.search.substr(1).match(reg);
        return param ? param[2] : undefined;
    };
})(jQuery);
