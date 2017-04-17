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
$(document).ready(function() {
    init();
});

// Functions =============================================================

function init() {
    console.log("course_view moudle init...");
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');

    $('#member_table').bootstrapTable({
        url: '/api/members?status=active',
        locale: 'zh-CN',
        columns: [{}, {}, {}, {
            formatter: creditFormatter
        }]
    });

    // event listener of adding new comment
    $('#member_dlg #add_member').click(handleClickAddMember);
    $('#member_dlg').on('shown.bs.modal', function(event) {
        //$(this).find('table').bootstrapTable('refresh', { url: '/api/members', query: { status: 'active' } });
        // check selected members
        if (viewData.course.members) {
            var checkedItems = viewData.course.members.map(function(value, index, array) {
                return value._id
            });
            $(this).find('table').bootstrapTable('checkBy', { field: '_id', values: checkedItems });
        }
    });

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
            membersCount: function() {
                return this.course.members ? this.course.members.length : 0;
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
            removeMember: function(id) {
                var members = viewData.course.members;
                for(var i=0;i<members.length;i++) {
                    if (members[i].id == id) {
                        members.splice(i, 1);
                        break;
                    }
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
};

function handleClickAddMember() {
    var modal = $(this).closest('.modal');
    var selections = modal.find('table').bootstrapTable('getAllSelections');
    var result = selections.map(function(value, index, array) {
        return {
            id: value._id,
            name: value.name
        };
    });
    Vue.set(viewData.course, 'members', result)
    modal.modal('hide');
};

/**
 * Retrieve course object according to ID
 * 
 * @param {String} coureID 
 */
function getCourse(coureID) {
    var request = $.getJSON('/api/courses/' + coureID, null);
    request.fail(function(jqXHR, textStatus, errorThrown) {
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
    request.fail(function(jqXHR, textStatus, errorThrown) {
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

function creditFormatter(value, row, index) {
    var membership = row.membership;
    if (membership && membership[0]) {
        // A better way of 'toFixed(1)'
        if (typeof (membership[0].credit) == 'number') {
            return Math.round(membership[0].credit * 10) / 10;
        } else {
            return membership[0].credit;
        }
    } else {
        return undefined;
    }
};