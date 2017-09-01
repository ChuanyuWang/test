/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * common.js
 * --------------------------------------------------------------------------
 */

module.exports = {
    /**
     * get the tenat name of current page, e.g.
     * return 'bqsq' from http://localhost:3000/t/bqsq/course/1/view
     */
    getTenantName: function() {
        var pathname = window.location.pathname;
        if (pathname.length == 0) return "";
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        if (pathname.charAt(0) == 't') pathname = pathname.substring(1);
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        return pathname.split('/')[0];
    },
    /**
     * Data fomatter function of bootstrap-table to format date localized string by 'll'
     * 
     * @param {Object} value the field value
     * @param {Object} row the row record data
     * @param {Number} index the row index
     */
    dateFormatter: function(value, row, index) {
        if (value) {
            return moment(value).format('ll');
        } else {
            return undefined;
        }
    },
    /**
     * Calculate the remaining capacity of class object
     * 
     * @cItem {Object} cItem class object
     */
    classRemaining: function(cItem) {
        if (cItem) {
            var booking = cItem.booking || [];
            if (booking.length === 0) return cItem.capacity || 0;
            else {
                var reservation = 0;
                booking.forEach(function(val, index, array) {
                    reservation += (val.quantity || 0);
                });
                return (cItem.capacity || 0) - reservation;
            }
        } else {
            return undefined;
        }
    }
};
},{}],2:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * card.js component for membership card
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#card-template',
    props: {
        index: Number, // index of membership card
        item: Object // object of membership card object
    },
    data: function() {
        return {
            delta: 0,
            type: this.item.type,
            // Fix a bug, there is some invalid date which has boolean value
            room: typeof (this.item.room) === 'boolean' ? [] : this.item.room,
            expire: this.item.expire ? moment(this.item.expire) : null,
            error: null
        };
    },
    watch: {
        'item': function() {
            this.delta = 0;
        }
    },
    computed: {
        expireDate: function() {
            return this.expire ? this.expire.format('ll') : null;
        },
        isLimitedCard: function() {
            return this.type === 'LIMITED';
        }
    },
    filters: {
        formatCredit: function(value) {
            return Math.round(value * 10) / 10;
        }
    },
    methods: {
        alterCharge: function(value) {
            if (typeof (this.delta) !== 'number') {
                this.delta = parseFloat(this.delta) || 0;
            }
            this.delta += value;
        },
        validteBeforeSave: function() {
            this.error = null;
            if (typeof (this.delta) !== 'number') {
                this.error = '增加/减少的课时数不正确';
                return;
            }
            if (!this.expire || !this.expire.isValid()) {
                this.error = '请指定会员有效期';
                return;
            }
            if (!this.type) {
                this.error = '请选择会员卡类型';
                return;
            }
            var toBeSaved = {
                "type": this.type,
                "room": this.room,
                "expire": this.expire && this.expire.toISOString(),
                "credit": this.item.credit + this.delta
            };
            this.$emit("save", toBeSaved, this.index);
        }
    },
    mounted: function() {
        var vm = this;
        $(this.$el).find('#expire_date').datetimepicker({
            format: 'll',
            locale: 'zh-CN'
        });
        $(this.$el).find('#expire_date').on('dp.change', function(e) {
            // update the expire value from datetimepicker control event
            // when user clears the input box, the 'e.date' is false value
            vm.expire = e.date === false ? null : e.date;
        });
    }
};
},{}],3:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * member_view.js single member view page main entry module
 * --------------------------------------------------------------------------
 */

var cardComp = require('./components/card');
var common = require('./common');
var util = require('./services/util');

var viewData = {
    memberData: {
        membership: [],
        comments: [],
        summary: []
    },
    birth: null,
    errors: null
}

var vueApp = {
    components : {
        'card' : cardComp
    },
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
        'memberData.birthday': function() {
            $('#birth_date').data('DateTimePicker').date(this.memberData.birthday ? moment(this.memberData.birthday) : null);
            // only update the birth in dp.change event
            //this.birth = this.memberData.birthday ? moment(this.memberData.birthday) : null;
        }
    },
    methods: {
        saveBasicInfo: function() {
            this.errors = null;
            if (this.memberData.name.length == 0) this.errors = { basic: '姓名不能为空' };
            if (this.memberData.contact.length == 0) this.errors = { basic: '联系方式不能为空' };
            if (this.birth && !this.birth.isValid()) this.errors = { basic: '生日格式不正确' };
            if (!this.errors) {
                var request = update({
                    status: this.memberData.status,
                    name: this.memberData.name,
                    contact: this.memberData.contact,
                    note: this.memberData.note,
                    birthday: this.birth && this.birth.toISOString()
                });
                request.done(function(data, textStatus, jqXHR) {
                    bootbox.alert('会员基本资料更新成功');
                });
            }
        },
        saveCardInfo: function(card, index) {
            var vm = this;
            var confirmDlg = $('#historyComment_dlg');
            // remove previous OK button's click listener
            confirmDlg.find('button.btn-success').off('click');
            confirmDlg.find('button.btn-success').one('click', function (event) {
                var modal = $(this).closest('.modal');
                var memo = modal.find('textarea[name=comment]').val().trim();
                card.memo = memo; // append the memo for this change if there is any
                // handle the click OK button
                if (index > -1) {
                    var request = updateCard(vm.memberData._id, index, card);
                    request.done(function(data, textStatus, jqXHR) {
                        bootbox.alert('会员卡更新成功');
                        Vue.set(vm.memberData.membership, index, data.membership[index]);
                    });
                } else {
                    var request = createCard(vm.memberData._id, card);
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
            $('#comment_dlg').find('textarea[name=comment]').val(null);
            // event listener of adding new comment
            $('#comment_dlg button.btn-success').off('click');
            $('#comment_dlg button.btn-success').one('click', handleClickAddComment);
            $('#comment_dlg').modal('show');
        },
        editComment: function(commentIndex) {
            var comment = this.memberData.comments[commentIndex].text;
            $('#editComment_dlg').find('textarea[name=comment]').val(comment);
            $('#editComment_dlg button.btn-success').off('click');
            $('#editComment_dlg button.btn-success').one('click', commentIndex, handleClickEditComment);
            $('#editComment_dlg').modal('show');
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
};

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    var request = getMemberInfo($('#member_app').data('member-id'));
    request.done(function(data, textStatus, jqXHR) {
        viewData.memberData = data;
        // bootstrap the member view page
        var memberViewer = new Vue({extends: vueApp, data: viewData, el: '#member_app'});
    });

    request.done(function(data, textStatus, jqXHR) {
        var commentRequest = getMemberComments($('#member_app').data('member-id'));
        commentRequest.done(function(data, textStatus, jqXHR) {
            Vue.set(viewData.memberData, 'comments', data.comments)
        });
        // load the member's course summary
        var summaryRequest = getMemberSummary($('#member_app').data('member-id'));
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

    $('#comment_dlg').on('shown.bs.modal', function(event) {
        // focus on the commnet input control
        $(this).find('textarea[name=comment]').focus();
    });
    $('#editComment_dlg').on('shown.bs.modal', function(event) {
        // focus on the commnet input control
        $(this).find('textarea[name=comment]').focus();
    });

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
        }]
    });

    $('#loadHistoryBtn').click(loadHistory);
    $('#loadClassesBtn').click(loadClasses);
};

function handleClickAddComment() {
    var modal = $(this).closest('.modal');
    var content = modal.find('textarea[name=comment]').val().trim();
    if (content.length === 0 || content.length > 255) {
        modal.find('textarea[name=comment]').closest(".form-group").addClass("has-error");
        return;
    } else {
        modal.find('textarea[name=comment]').closest(".form-group").removeClass("has-error");
    }
    var comment = {
        text: content
    };
    var request = addComment(viewData.memberData._id, comment);
    request.done(function(data, textStatus, jqXHR) {
        Vue.set(viewData.memberData, 'comments', data.comments)
    });
    modal.modal('hide');
};

function handleClickEditComment(event) {
    var modal = $(this).closest('.modal');
    var content = modal.find('textarea[name=comment]').val().trim();
    // get the index of comment from event data
    var commentIndex = event.data;
    if (content.length === 0 || content.length > 255) {
        modal.find('textarea[name=comment]').closest(".form-group").addClass("has-error");
        return;
    } else {
        modal.find('textarea[name=comment]').closest(".form-group").removeClass("has-error");
    }
    var comment = {
        text: content
    };
    var request = editComment(viewData.memberData._id, commentIndex, comment);
    request.done(function(data, textStatus, jqXHR) {
        Vue.set(viewData.memberData, 'comments', data.comments)
    });
    modal.modal('hide');
};

function loadHistory(e) {
    e.preventDefault();
    $('#loadHistory_mask').show(600);
    $('#history_table').bootstrapTable('refresh', { url: '/api/members/' + viewData.memberData._id + '/history' });
};

function loadClasses(e) {
    e.preventDefault();
    $('#loadClasses_mask').show(600);
    var begin = moment(0);
    var end = moment().add(10, 'years');
    $('#classes_table').bootstrapTable('refresh', {
        url: '/api/classes',
        query: {
            memberid: viewData.memberData._id,
            order: 'desc'
        }
    });
};

function update(fields) {
    var request = $.ajax("/api/members/" + viewData.memberData._id, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新会员失败", jqXHR);
    })
    return request;
};

function addComment(memberID, fields) {
    var request = $.ajax("/api/members/" + memberID + '/comments', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加会员备忘失败", jqXHR);
    });
    return request;
};

function editComment(memberID, index, fields) {
    var request = $.ajax('/api/members/' + memberID + '/comments/' + index, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("修改会员备忘失败", jqXHR);
    });
    return request;
};

function createCard(memberID, fields) {
    var request = $.ajax("/api/members/" + memberID + '/memberships', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("创建会员卡失败", jqXHR);
    });
    return request;
};

function updateCard(memberID, index, fields) {
    var request = $.ajax("/api/members/" + memberID + '/memberships/' + index, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("修改会员卡失败", jqXHR);
    });
    return request;
};

function getMemberInfo(id) {
    var request = $.getJSON("/api/members/" + id, '');
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("获取会员信息失败", jqXHR);
    });
    return request;
};

function getMemberComments(id) {
    var request = $.getJSON("/api/members/" + id + '/comments', '');
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("获取会员备忘失败", jqXHR);
    });
    return request;
};

function getMemberSummary(id) {
    var request = $.getJSON("/api/members/" + id + '/summary', '');
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("获取会员参与的班级失败", jqXHR);
    });
    return request;
};

function classFilter(params) {
    var filter = $('#loadClasses_mask .filter input:checked').val();
    var begin = moment(0);
    var end = moment().add(10, 'years');
    if (filter === 'PAST') end = moment();
    if (filter === 'FUTURE') begin = moment();
    params.from = begin.toISOString();
    params.to = end.toISOString();
    return params;
};

function fieldFormatter(value, row, index) {
    if (value.indexOf('credit') > -1) {
        return '课时';
    } else if (value.indexOf('expire') > -1) {
        return '有效期';
    } else {
        return value;
    }
};

function linkNameFormatter(value, row, index) {
    return [
        '<a href="../class/' + row._id + '" target="_blank">',
        ' <i class="text-primary glyphicon glyphicon-calendar"></i>' + value,
        '</a>'
    ].join('');
};

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
};
},{"./common":1,"./components/card":2,"./services/util":4}],4:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * util.js provide common utils for all services
 * --------------------------------------------------------------------------
 */
 
var util = {};

/**
 * 
 * @param {String} title error dialog title
 * @param {Object} jqXHR XHR object of jQuery ajax call
 * @param {String} className default is 'btn-danger'
 */
util.showAlert = function(title, jqXHR, className) {
    //console.error(jqXHR);
    bootbox.alert({
        message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
        title: title || '错误',
        buttons: {
            ok: {
                label: "确定",
                // alert dialog with danger button by default
                className: className || "btn-danger"
            }
        }
    });
};

module.exports = util;

},{}]},{},[3]);
