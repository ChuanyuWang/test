/**
 * --------------------------------------------------------------------------
 * member_view.js single member view page main entry module
 * --------------------------------------------------------------------------
 */

var cardComp = require('./card.vue').default;
var date_picker = require('../../components/date-picker.vue').default;
var comment_dlg = require('./comment-modal.vue').default;
var common = require('../../common/common');
var memberService = require('../../services/members');
var class_service = require('../../services/classes');

var viewData = {
    memberData: {
        membership: [],
        comments: [],
        summary: []
    }
};

// bootstrap the dialog of adding comment to class
var commentDialog = null;

var vueApp = {
    components: {
        'card': cardComp,
        'date-picker': date_picker,
        'comment-modal': comment_dlg
    },
    computed: {
        commentCount: function() {
            return this.memberData.comments ? this.memberData.comments.length : 0;
        },
        errors: function() {
            var errors = {};
            if (this.memberData.name.length == 0)
                errors.name = '姓名不能为空';
            if (this.memberData.contact.length == 0)
                errors.contact = '联系方式不能为空';
            if (this.memberData.birthday && !moment(this.memberData.birthday).isValid())
                errors.birthday = '生日格式不正确';
            return errors;
        },
        hasError: function() {
            var errors = this.errors
            return Object.keys(errors).some(function(key) {
                return true;
            })
        },
        source: function() {
            return this.memberData.source || "manual"
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
    methods: {
        saveBasicInfo: function() {
            if (this.hasError) return false;
            var request = memberService.update(this.memberData._id, {
                status: this.memberData.status,
                name: this.memberData.name,
                contact: this.memberData.contact,
                note: this.memberData.note,
                birthday: this.memberData.birthday && moment(this.memberData.birthday).toISOString()
            });
            request.done(function(data, textStatus, jqXHR) {
                bootbox.alert('会员基本资料更新成功');
            });
        },
        saveCardInfo: function(card, index) {
            var vm = this;
            var confirmDlg = $('#historyComment_dlg');
            // remove previous OK button's click listener
            confirmDlg.find('button.btn-success').off('click');
            confirmDlg.find('button.btn-success').one('click', function(event) {
                var modal = $(this).closest('.modal');
                var memo = modal.find('textarea[name=comment]').val().trim();
                card.memo = memo; // append the memo for this change if there is any
                // handle the click OK button
                if (index > -1) {
                    var request = memberService.updateCard(vm.memberData._id, index, card);
                    request.done(function(data, textStatus, jqXHR) {
                        bootbox.alert('会员卡更新成功');
                        Vue.set(vm.memberData.membership, index, data.membership[index]);
                    });
                } else {
                    var request = memberService.createCard(vm.memberData._id, card);
                    request.done(function(data, textStatus, jqXHR) {
                        bootbox.alert('会员卡创建成功');
                        vm.memberData.membership = data.membership;
                    });
                }
                // hide the confirm dialog in the end
                confirmDlg.modal('hide');
            });
            // pop up the confirm dialog with extra memo input
            confirmDlg.modal('show');
        },
        deactivateAlert: function(e) {
            if (this.memberData.status == 'inactive') {
                bootbox.alert({
                    message: "未激活会员将无法进行自助预约<br><small>确定后，请点击保存进行修改</small>",
                    buttons: {
                        ok: {
                            label: "确定",
                            className: "btn-danger"
                        }
                    }
                });
            }
        },
        addComment: function() {
            var vm = this;
            this.$refs.commentDlg.show(function(memo) {
                var comment = {
                    text: memo
                };
                var request = memberService.addComment(vm.memberData._id, comment);
                request.done(function(data, textStatus, jqXHR) {
                    Vue.set(vm.memberData, 'comments', data.comments);
                });
            });
        },
        editComment: function(commentIndex) {
            var vm = this;
            this.$refs.commentDlg.show(this.memberData.comments[commentIndex].text, function(memo) {
                var comment = {
                    text: memo
                };
                var request = memberService.editComment(vm.memberData._id, commentIndex, comment);
                request.done(function(data, textStatus, jqXHR) {
                    Vue.set(vm.memberData, 'comments', data.comments);
                });
            });
        }
    }
};

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    var request = memberService.getMemberInfo($('#member_app').data('member-id'));
    request.done(function(data, textStatus, jqXHR) {
        viewData.memberData = data;
        // bootstrap the member view page
        new Vue({ el: '#member_app', extends: vueApp, data: viewData });

        // bootstrap the dialog of adding comment to class
        commentDialog = new Vue({ el: '#commentDlg', extends: comment_dlg });
    });

    request.done(function(data, textStatus, jqXHR) {
        var commentRequest = memberService.getMemberComments($('#member_app').data('member-id'));
        commentRequest.done(function(data, textStatus, jqXHR) {
            Vue.set(viewData.memberData, 'comments', data.comments)
        });
        // load the member's course summary
        var summaryRequest = memberService.getMemberSummary($('#member_app').data('member-id'));
        summaryRequest.done(function(data, textStatus, jqXHR) {
            Vue.set(viewData.memberData, 'summary', data)
        });
    });
});

// Functions =============================================================

function init() {
    console.log("init view member ~~~");
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');

    $('#history_table').bootstrapTable({
        locale: 'zh-CN',
        columns: [{
            formatter: common.dateFormatter
        }, {
            formatter: fieldFormatter
        }, {
            formatter: deltaFormatter
        }]
    });

    $('#classes_table').bootstrapTable({
        locale: 'zh-CN',
        queryParams: classFilter,
        columns: [{
            formatter: linkNameFormatter
        }, {}, {
            formatter: common.dateFormatter
        }, {
            formatter: booksFormatter
        }, {
            formatter: checkinFormatter
        }, {
            formatter: flagFormatter,
            events: { 'click .flag': addFlag }
        }, {
            formatter: commentFormatter,
            events: { 'click .comment': addComment }
        }]
    });

    $('#loadHistoryBtn').click(loadHistory);
    $('#loadClassesBtn').click(loadClasses);
}

function addFlag(e, value, row, index) {
    var booking = getBooking(row && row.booking);
    if (!booking) return console.error("member booking not found")
    var nextFlag = booking.flag === 'red' ? 'green' : 'red';

    var request = class_service.flag(row._id, booking.member, nextFlag);
    request.done(function(data, textStatus, jqXHR) {
        booking.flag = nextFlag;
        $("#classes_table").bootstrapTable('updateRow', { index: index, row: row });
    });
}

function addComment(e, value, row, index) {
    var booking = getBooking(row && row.booking);
    if (!booking) return console.error("member booking not found")

    commentDialog.show(booking.comment, function(newComment) {
        var request = class_service.comment(row._id, booking.member, newComment);
        request.done(function(data, textStatus, jqXHR) {
            booking.comment = newComment;
            $("#classes_table").bootstrapTable('updateRow', { index: index, row: row });
        });
    });
}

function loadHistory(e) {
    e.preventDefault();
    $('#loadHistory_mask').show(600);
    $('#history_table').bootstrapTable('refresh', { url: '/api/members/' + viewData.memberData._id + '/history' });
}

function loadClasses(e) {
    e.preventDefault();
    $('#loadClasses_mask').show(600);
    $('#classes_table').bootstrapTable('refresh', {
        url: '/api/classes',
        query: {
            memberid: viewData.memberData._id,
            order: 'desc'
        }
    });
}

function classFilter(params) {
    var filter = $('#loadClasses_mask .filter input:checked').val();
    var begin = moment(0);
    var end = moment().add(10, 'years');
    if (filter === 'PAST') end = moment();
    if (filter === 'FUTURE') begin = moment();
    params.from = begin.toISOString();
    params.to = end.toISOString();
    return params;
}

function fieldFormatter(value, row, index) {
    if (value.indexOf('credit') > -1) {
        return '课时';
    } else if (value.indexOf('expire') > -1) {
        return '有效期';
    } else {
        return value;
    }
}

function linkNameFormatter(value, row, index) {
    return [
        '<a href="../class/' + row._id + '" target="_blank">',
        ' <i class="text-primary glyphicon glyphicon-calendar"></i>' + value,
        '</a>'
    ].join('');
}

function booksFormatter(value, row, index) {
    if ($.isArray(value)) {
        var result = '';
        value.forEach(function(book) {
            if (book.title) {
                if (book.title.substr(0, 1) !== "《")
                    result += "《" + book.title + "》";
                else
                    result += book.title;
            }
        });
        return result;
    }
}

function getBooking(bookings) {
    var result = null;
    if ($.isArray(bookings)) {
        bookings.some(function(booking) {
            if (booking.member === viewData.memberData._id) {
                result = booking;
                return true;
            }
            return false;
        });
    }
    return result;
}

function checkinFormatter(value, row, index) {
    var booking = getBooking(row && row.booking) || {};
    var result = booking.status;

    if (result == "absent") {
        return '<span style="display:table-cell" class="text-danger glyphicon glyphicon-remove"></span>';
    } else if (result == "checkin") {
        return '<span style="display:table-cell" class="text-success glyphicon glyphicon-ok"></span>';
    } else {
        return '<span style="display:table-cell" class="text-muted glyphicon glyphicon-question-sign"></span>';
    }
}

function flagFormatter(value, row, index) {
    var booking = getBooking(row && row.booking) || {};
    var flag = booking.flag;

    if (flag == "red") {
        return '<span style="cursor:pointer" class="flag text-danger glyphicon glyphicon-flag" title="红旗"></span>';
    } else if (flag == "green") {
        return '<span style="cursor:pointer" class="flag text-success glyphicon glyphicon-flag" title="绿旗"></span>';
    } else if (flag == "yellow") {
        return '<span style="cursor:pointer" class="flag text-warning glyphicon glyphicon-flag" title="黄旗"></span>';
    } else {
        return '<span style="cursor:pointer;opacity:0.5" class="flag text-muted glyphicon glyphicon-flag"></span>';
    }
}

function commentFormatter(value, row, index) {
    var booking = getBooking(row && row.booking) || {};
    var comment = booking.comment || "";
    if (comment) {
        return comment + ' <span style="cursor:pointer" class="comment text-mute glyphicon glyphicon-pencil"></span>';
    } else {
        return '<span style="cursor:pointer" class="comment text-mute glyphicon glyphicon-pencil"></span>'
    }
}

function deltaFormatter(value, row, index) {
    if (row.target.indexOf('credit') > -1) {
        return [
            row.old === null ? null : Math.round(row.old * 10) / 10,
            ' <i class="text-primary glyphicon glyphicon-arrow-right"></i> ',
            Math.round(row.new * 10) / 10
        ].join('');
    } else if (row.target.indexOf('expire') > -1) {
        return [
            moment(row.old).isValid() ? moment(row.old).format('ll') : null,
            ' <i class="text-primary glyphicon glyphicon-arrow-right"></i> ',
            moment(row.new).isValid() ? moment(row.new).format('ll') : null
        ].join('');
    } else {
        return [
            row.old,
            ' <i class="text-primary glyphicon glyphicon-arrow-right"></i> ',
            row.new
        ].join('');
    }
}
