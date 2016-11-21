(function ($) {
    // open id of Weichat user
    window._openid = undefined;

    var memberid = undefined;

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();
        
        // click logout
        $('#user_info .btn-danger').click(function (e) {
            // TODO
            //clearSchedule();
            try {
                localStorage._memberid = memberid = undefined;
            }catch (oException) {
                // the private browsing is on, access to localStorage cause exception on iOS
            }
            toggleLoginForm(true);
        });

        // click login
        $('#login .btn').click(handleLoginOK);
    });
    
    // Functions =============================================================

    function init() {
        console.log("welcome~~~");
        moment.locale('zh-CN');
        //bootbox.setLocale('zh_CN');
        //$('#currentWeekRange').text(moment().format('[今天] MMMDo'));
        
        toggleLoginForm(true);
    };

    function handleLoginOK(event) {
        // prevent from submitting the form
        event.preventDefault();

        var loginForm = $(this).closest('form');
        var hasError = false;
        // validate the input
        var userInfo = {};
        userInfo.name = loginForm.find('input[name=name]').val().trim();
        if (!userInfo.name || userInfo.name.length == 0) {
            loginForm.find('input[name=name]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            loginForm.find('input[name=name]').closest(".form-group").removeClass("has-error");
        }
        // get contact
        userInfo.contact = loginForm.find('input[name=contact]').val().trim();
        if (!userInfo.contact || userInfo.contact.length == 0) {
            loginForm.find('input[name=contact]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            loginForm.find('input[name=contact]').closest(".form-group").removeClass("has-error");
        }

        if (!hasError) {
            $.ajax("api/members", {
                type : "GET",
                //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
                data : userInfo,
                success : function (data) {
                    if (data && data.length > 0) {
                        try {
                            // cache the member id in global variable before access localStorage
                            localStorage._memberid = memberid = data[0]._id;
                            localStorage._name = data[0].name;
                            localStorage._contact = data[0].contact;
                        }catch (oException) {
                            if(oException.name == 'QuotaExceededError'){
                                console.error('超出本地存储限额！');
                                //clear the local storage
                                localStorage.clear();
                            }
                        }
                        toggleLoginForm(false);
                        updateUserInfo(data[0]);
                        showMyBooks();
                    } else {
                        // handle login fail
                        $('#error_dlg').find("h4").text('登录失败');
                        $('#error_dlg').find("p#message").text('没有找到会员信息，请核对您的姓名和联系方式，如有问题请联系客服');
                        $('#error_dlg').modal('show');
                    }
                },
                error : function (jqXHR, status, err) {
                    // handle login error
                    console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
                },
                complete : function (jqXHR, status) {
                    //TODO
                },
                dataType : "json"
            });
        }
    };

    function updateUserInfo(user) {
        var credit = 0;
        //TODO, support multi membership card
        if (user.membership && user.membership.length > 0) {
            credit = user.membership[0].credit;
        }
        $('#user_info p').html('你好，<b>' + user.name +'</b>小朋友 <small style="color:#808080">剩余课时: ' + credit + '</small>');
    };
    
    function toggleLoginForm(isShow) {
        // display the login form for user to input name and contact
        if (isShow) {
            $('#user_info').hide();
            $('#content').hide();
            // initialize the default value from local storage
            $('#main form input[name=name]').val(localStorage._name);
            $('#main form input[name=contact]').val(localStorage._contact);
            $('#main form').fadeIn(400);
            $('#main form input[name=name]').focus();
        } else {
            $('#main form').hide();
            $('#user_info').show();
            $('#content').fadeIn(600);
        }
    };
    
    function showMyBooks(isHistory, tab_id) {
        clearBooks();

        var query = {
            memberid : memberid,
            from : moment(0).toISOString(),
            to : moment().add(1, 'years').toISOString(),
            order : 'desc'
        };
        $.ajax("api/classes", {
            type : "GET",
            //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
            data : query,
            success : function (data) {
                for (var i = 0; i < data.length; i++) {
                    appendBook(data[i]);
                }
                if (!data.length) {
                    displayNoClassWarning();
                }
            },
            error : function (jqXHR, status, err) {
                console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            complete : function (jqXHR, status) {
                // update the total number
                var total = $('#content table tbody tr').length;
                var pTotal = $('#content p.small');
                var t = pTotal.html().replace('{0}',total);
                pTotal.html(t);
            },
            dataType : "json"
        });
    };
    
    // append a book at the last row of table
    function appendBook(item) {
        // append the content to current active panel
        var table = $('#content table tbody');
        
        if (item && item.books) {
            for (var i=0;i<item.books.length;i++) {
                var book = item.books[i];
                var row_book = ['<tr>',
                    '<td>',
                    moment(item.date).format('l'),
                    '</td>',
                    '<td>',
                    book.title,
                    '</td>',
                    '<td>',
                    book.teacher,
                    '</td>',
                    '</tr>'].join('');
                table.append(row_book);
            }
        }
    };
    
    function displayNoClassWarning() {
        var list = $('#main');

        // append a warning bar
        list.append("<div class='alert alert-warning' role='alert' style='margin-top:7px'><strong>提示：</strong>没有找到绘本</div>");
    };
    
    function clearBooks() {
        // remove all rows in table except headers
        $('#content table tbody tr').remove();
        $('.alert-warning').remove();
    };
})(jQuery);
