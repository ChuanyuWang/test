(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();

        $('.nav-tabs a').click(function (e) {
            //e.preventDefault();
            //$(this).tab('show');
        });
    });

    // Functions =============================================================

    function init() {
        console.log("welcome~~~");
        //moment.locale('zh-CN');
        //bootbox.setLocale('zh_CN');
    };
})(jQuery);
