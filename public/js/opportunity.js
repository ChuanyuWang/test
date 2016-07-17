(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();
    });

    // Functions =============================================================

    function init() {
        moment.locale('zh-CN');
    };
    
    // event handler defined in home.jade file for removing booking item
    window.handleChangeStatus = {
        'click .phone' : function (e, value, row, index) {
            var opportunity = row; // the object of clicked row
            var newStatus = opportunity.status == 'open' ? 'closed' : 'open';
            
            $.ajax("api/opportunities/" + opportunity._id, {
                type : "PUT",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify({status:newStatus}),
                success : function (data) {
                    row.status = newStatus;
                    $('#opps_table').bootstrapTable('updateRow', {index:index, row:row});
                },
                error : function (jqXHR, status, err) {
                    console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
                },
                complete : function(jqXHR, status) {
                    //TODO
                },
                dataType : "json"
            });
        }
    };
})(jQuery);
