/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */

var viewData = {
    course: {},
    error: null
}

// DOM Ready =============================================================
$(document).ready(function () {
    init();
});

// Functions =============================================================

function init() {
    console.log("course_view moudle init...");
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');

    var request = getCourse($('#course_app').data('course-id'));
    request.done(function(data, textStatus, jqXHR) {
        initPage(data);
    });
};

function initPage(course) {
    viewData.course = course;

    // bootstrap the course view page
    var courseViewer = new Vue({
        el: '#course_app',
        data: viewData,
        computed: {
            commentCount: function() {
                return this.memberData.comments ? this.memberData.comments.length : 0;
            }
        },
        filters: {
            formatDate: function(value) {
                if (!value) return '?';
                return moment(value).format('ll');
            },
            formatDateTime: function(value) {
                if (!value) return '?';
                return moment(value).format('lll');
            }
        },
        watch: {
        },
        methods: {
            saveBasicInfo: function() {
                this.error = null;
                if (this.course.name.length == 0) this.error = '名称不能为空';
                if (!this.error) {
                    var request = updateCourse(this.course._id, {
                        status: this.course.status,
                        name: this.course.name,
                        classroom: this.course.classroom,
                        remark: this.course.remark
                    });
                    request.done(function(data, textStatus, jqXHR) {
                        bootbox.alert('班级基本资料更新成功');
                    });
                }
            },
            closeAlert: function(e) {
                if (this.course.status == 'closed') {
                    bootbox.alert({
                        message: "结束此班级后会删除所有未开始的课程<br><small>确定后，请点击保存进行修改</small>",
                        buttons: {
                            ok: {
                                label: "确定",
                                className: "btn-danger"
                            }
                        }
                    });
                }
            }
        },
        mounted: function() {
            // 'this' is refer to vm instance
            var vm = this;
            $(vm.$el).find('#birth_date').datetimepicker({
                format: 'll',
                locale: 'zh-CN'
            });

            $(vm.$el).find('#birth_date').on('dp.change', function(e) {
                // when user clears the input box, the 'e.date' is false value
                vm.birth = e.date === false ? null : e.date;
            });
        }
    });
}

/**
 * Retrieve course object according to ID
 * 
 * @param {String} coureID 
 */
function getCourse(coureID) {
    var request = $.getJSON('/api/courses/' + coureID, null);
    request.fail(function (jqXHR, textStatus, errorThrown) {
        showAlert('获取班级失败', jqXHR);
    })
    return request;
};

function updateCourse(coureID, fields) {
    var request = $.ajax("/api/courses/" + coureID, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert("更新班级失败", jqXHR);
    })
    return request;
};

function closeAlert(coureID) {
    var request = $.getJSON('/api/courses/' + coureID, null);
    request.fail(function (jqXHR, textStatus, errorThrown) {
        showAlert('获取班级失败', jqXHR);
    })
    return request;
};

/**
 * 
 * @param {String} title 
 * @param {Object} jqXHR 
 * @param {String} className default is 'btn-danger'
 */
function showAlert(title, jqXHR, className) {
    //console.error(jqXHR);
    bootbox.dialog({
        message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
        title: title || '错误',
        buttons: {
            danger: {
                label: "确定",
                // alert dialog with danger button by default
                className: className || "btn-danger"
            }
        }
    });
};