<template lang="pug">
div.container
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../member") 学员列表
    li.active 查看学员
  div.page-header
    h3(style='margin-top:0;display:inline-block') 基本信息
    button.btn.btn-danger(type='button',style='float:right',disabled,@click='') 删除学员
  form.form-horizontal
    div.form-group
      label.col-sm-2.col-xs-3.control-label 状态:
      div.col-sm-3.col-xs-9
        select.form-control(v-model='memberData.status',@change='deactivateAlert')
          option.text-success(value='active') 在读
          option.text-danger(value='inactive') 过期
    div.form-group
      label.col-sm-2.col-xs-3.control-label 来源:
      div.col-sm-10.col-xs-9
        p.form-control-static {{source|sourceFormatter}}
          span.small.ms-3(style='color:#808080') ({{memberData.since | formatDate}}添加)
    div.form-group(style='display:none')
      label.col-sm-2.col-xs-3.control-label openID:
      div.col-sm-10.col-xs-9
        p.form-control-static {{memberData.openid}}
    div.form-group(:class='{"has-error": errors.name}')
      label.col-sm-2.col-xs-3.control-label 姓名:
      div.col-sm-4.col-xs-9(data-toggle="tooltip",data-placement="right",:title="errors.name")
        input.form-control(v-model.trim='memberData.name', placeholder='学员姓名')
    div.form-group(:class='{"has-error": errors.contact}')
      label.col-sm-2.col-xs-3.control-label 联系方式:
      div.col-sm-4.col-xs-9(data-toggle="tooltip",data-placement="right",:title="errors.contact")
        input.form-control(v-model.trim='memberData.contact', placeholder='135xxx')
    div.form-group(:class='{"has-error": errors.birthday}')
      label.control-label.col-sm-2.col-xs-3 出生日期:
      div.col-sm-4.col-xs-9(data-toggle="tooltip",data-placement="right",:title="errors.birthday")
        date-picker(v-model='memberData.birthday')
    div.form-group
      label.control-label.col-sm-2.col-xs-3 描述:
      div.col-sm-8.col-xs-9
        textarea.form-control.has-3-rows(rows='3', placeholder='添加更多备注信息, 比如昵称', name='note',v-model.trim='memberData.note')
    div.form-group
      label.control-label.col-sm-2.col-xs-3 会员卡(旧):
      div.col-sm-8.col-xs-9
        p.form-control-static {{memberData.membership | membershipFilter}}
    div.form-group
      div.col-sm-offset-2.col-sm-10.col-xs-offset-3.col-xs-9
        button.btn.btn-success(type='button',v-on:click='saveBasicInfo',:disabled='hasError') 保存
  member-contracts(:memberId="memberId")
  div.page-header
    h3 {{$t('course_summary_title')}}
  table.table.table-bordered.table-striped
    thead
      tr
        th {{$t('course_name')}}
        th {{$t('finished')}}
        th {{$t('unfinished')}}
        th {{$t('total')}}
    tbody(v-if='summary&&summary.length')
      tr(v-for='course in summary')
        td(v-if='course._id') {{course.courseName || $t('deleted_course')}}
          a.btn.btn-primary.btn-xs(:href='"../course/" + course._id',style='margin-left:3px') {{$t('view')}}
        td(v-else) {{$t('other_self_booking')}}
        td {{course.finished}}
        td {{course.unfinished}}
        td {{course.total}}
    tbody(v-else)
      tr
        td(colspan='4',style='text-align:center') {{$t('no_record')}}
  div.page-header
    h3 备忘
  form.form-horizontal
    div.form-group
      div.col-sm-2
        button.btn.btn-primary.btn-sm(type="button",:disabled='!memberData._id',@click='addComment')
          span.glyphicon.glyphicon-plus 新备忘
      div.col-sm-10
        template(v-for="(comment, key) in comments")
          div.media
            div.media-left
              span.glyphicon.glyphicon-comment.text-primary(style='font-size:large;opacity:0.8')
            div.media-body
              //h4.media-heading(style='font-size:small') {{comment.text}}
              p(style='font-size:small') {{comment.text}}
              p.small(style='color:#777;position:relative') by {{comment.author}} at {{comment.posted | formatDateTime}}
                button.btn.btn-default.btn-xs.edit(type='button',v-on:click='editComment(key)',style='margin:-3px 3px;position:absolute')
                  span.glyphicon.glyphicon-pencil
        small(style='color:#777') 共{{commentCount}}条备忘
  div.page-header
    h3(style='margin-top:0;display:inline-block') 充值记录
      span.label.label-danger.ms-3(style="font-size:60%") 待移除
    a(role='button',title='点击加载',@click='loadHistory')
      span.glyphicon.glyphicon-refresh(style='font-size:large;margin-left:5px')
  div#loadHistory_mask(style='display:none')
    bootstrap-table.table-striped(ref='historyTable',:columns='changeHistory.columns',:options='changeHistory.options')
  div.page-header
    h3(style='margin-top:0;display:inline-block') 上课记录
    a(role='button',title='点击加载',@click='loadClasses')
      span.glyphicon.glyphicon-refresh(style='font-size:large;margin-left:5px')
  div#loadClasses_mask(style='display:none')
    div.filter(style='margin:0 0 7px 3px')
      label.radio-inline
        input(type="radio",name="classFilter",value="PAST",v-model='classRecord.filter')
        |已上课程
      label.radio-inline
        input(type="radio",name="classFilter",value="FUTURE",v-model='classRecord.filter')
        |未上课程
      label.radio-inline
        input(type="radio",name="classFilter",value="ALL",v-model='classRecord.filter')
        |全部
    bootstrap-table.table-striped(ref='classesTable',:columns='classRecord.columns',:options='classRecord.options')
  div(style='height:20px')
  comment-modal(ref='commentDlg')
  message-alert(ref="messager")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * member-view.js display details of single member item
 * --------------------------------------------------------------------------
 */
var date_picker = require('../../components/date-picker.vue').default;
var modalDialog = require("../../components/modal-dialog.vue").default;
var comment_dlg = require('./comment-modal.vue').default;
var messageAlert = require("../../components/message-alert.vue").default;
var common = require('../../common/common');
var memberService = require('../../services/members');
var class_service = require('../../services/classes');
var memberContracts = require("./member-contracts.vue").default;


module.exports = {
  name: "member-view",
  props: {
    appData: {
      type: String, // should be member id
      require: true
    }
  },
  components: {
    "BootstrapTable": BootstrapTable,
    "date-picker": date_picker,
    "modal-dialog": modalDialog,
    "comment-modal": comment_dlg,
    "message-alert": messageAlert,
    "member-contracts": memberContracts
  },
  data: function() {
    var tenantSetting = common.getTenantSetting();
    return {
      tenantConfig: {},
      memberData: {
        _id: "",
        name: "",
        contact: "",
        status: "",
        source: "",
        birthday: null,
        note: "",
        membership: [],
      },
      toBeSavedMemo: "",
      toBeSavedMembership: {},
      toBeSavedMembershipIndex: -1,
      summary: [],
      comments: [],
      changeHistory: {
        columns: [
          {
            field: "date",
            title: "日期",
            formatter: common.dateFormatter
          }, {
            field: "target",
            title: "属性",
            formatter: this.fieldFormatter
          }, {
            field: "new",
            title: "变更",
            formatter: this.deltaFormatter
          }, {
            field: "remark",
            title: "备注"
          }
        ],
        options: {
          locale: "zh-CN",
          pageSize: 10,
          showRefresh: false,
          pagination: true
        }
      },
      classRecord: {
        filter: "PAST",
        columns: [{
          field: "name",
          title: "课程名称",
          formatter: this.linkNameFormatter
        }, {
          field: "cost",
          title: "课时"
        }, {
          field: "booking",
          title: "人数",
          formatter: this.quantityFormatter
        }, {
          field: "date",
          title: "课程日期",
          sortable: true,
          formatter: common.dateFormatter
        }, {
          field: "books",
          title: "绘本",
          visible: tenantSetting.feature === "book",
          formatter: this.booksFormatter
        }, {
          field: "booking",
          title: "签到",
          formatter: this.checkinFormatter
        }, {
          title: "旗标",
          formatter: this.flagFormatter,
          events: { 'click .flag': this.addBookFlag }
        }, {
          title: "备注",
          formatter: this.commentFormatter,
          events: { 'click .comment': this.addBookComment }
        }],
        options: {
          uniqueId: "_id",
          locale: "zh-CN",
          showRefresh: false,
          sortName: "date",
          sortOrder: "desc",
          pagination: true,
          pageSize: 10,
          queryParams: this.classFilter
        }
      }
    };
  },
  computed: {
    memberId() {
      return this.appData;
    },
    commentCount: function() {
      return this.comments ? this.comments.length : 0;
    },
    errors: function() {
      var errors = {};
      if (!this.memberData.name || this.memberData.name.length == 0)
        errors.name = '姓名不能为空';
      if (!this.memberData.contact || this.memberData.contact.length == 0)
        errors.contact = '联系方式不能为空';
      if (this.memberData.birthday && !moment(this.memberData.birthday).isValid())
        errors.birthday = '生日格式不正确';
      //TODO, limit note to 512 chars
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
    },
    sourceFormatter: function(value) {
      if (value === "book") return "扫码预约";
      else return "手动添加";
    },
    membershipFilter(value) {
      let cards = value || [];
      if (cards.length === 0) {
        return "会员卡未创建";
      } else if (cards.length > 1) {
        return "会员卡错误";
      }

      let credit = Math.round(cards[0].credit * 10) / 10;
      // "2012/12/20" without time
      let expire = cards[0].expire ? moment(cards[0].expire).format('ll') : cards[0].expire;
      let cardType = cards[0].type === "LIMITED" ? `卡片类型为限定卡 (可用教室: ${(cards[0].room || []).join(",")})` : "卡片类型为通用卡";

      return `截止2022年10月31日, 剩余${credit || 0}课时, 有效期到${expire}, ${cardType}`;
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
      request.done((data, textStatus, jqXHR) => {
        this.$refs.messager.showSuccessMessage("学员基本资料更新成功");
      });
    },
    deactivateAlert: function(e) {
      if (this.memberData.status == 'inactive') {
        this.$refs.messager.showWarningMessage("过期学员将无法进行自助预约，请点击<strong>保存</strong>按钮确定修改");
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
          Vue.set(vm, 'comments', data.comments);
        });
      });
    },
    editComment: function(commentIndex) {
      var vm = this;
      this.$refs.commentDlg.show(this.comments[commentIndex].text, function(memo) {
        var comment = {
          text: memo
        };
        var request = memberService.editComment(vm.memberData._id, commentIndex, comment);
        request.done(function(data, textStatus, jqXHR) {
          vm.comments = data.comments;
        });
      });
    },
    fieldFormatter: function(value, row, index) {
      if (value.indexOf('credit') > -1) {
        return '课时';
      } else if (value.indexOf('expire') > -1) {
        return '有效期';
      } else {
        return value;
      }
    },
    deltaFormatter: function(value, row, index) {
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
    },
    classFilter: function(params) {
      var filter = this.classRecord.filter;
      var begin = moment(0);
      var end = moment().add(10, 'years');
      if (filter === 'PAST') end = moment();
      if (filter === 'FUTURE') begin = moment();
      params.from = begin.toISOString();
      params.to = end.toISOString();
      return params;
    },
    linkNameFormatter: function(value, row, index) {
      return [
        '<a href="../class/' + row._id + '" target="_blank">',
        ' <i class="text-primary glyphicon glyphicon-calendar"></i>' + value,
        '</a>'
      ].join('');
    },
    booksFormatter: function(value, row, index) {
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
    },
    getBooking: function(bookings) {
      var vm = this;
      var result = null;
      if ($.isArray(bookings)) {
        bookings.some(function(booking) {
          if (booking.member === vm.memberData._id) {
            result = booking;
            return true;
          }
          return false;
        });
      }
      return result;
    },
    checkinFormatter: function(value, row, index) {
      var booking = this.getBooking(row && row.booking) || {};
      var result = booking.status;

      if (result == "absent") {
        return '<span style="display:table-cell" class="text-danger glyphicon glyphicon-remove"></span>';
      } else if (result == "checkin") {
        return '<span style="display:table-cell" class="text-success glyphicon glyphicon-ok"></span>';
      } else {
        return '<span style="display:table-cell" class="text-muted glyphicon glyphicon-question-sign"></span>';
      }
    },
    quantityFormatter: function(value, row, index) {
      var booking = this.getBooking(row && row.booking) || {};
      return booking.quantity || 1;
    },
    flagFormatter: function(value, row, index) {
      var booking = this.getBooking(row && row.booking) || {};
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
    },
    commentFormatter: function(value, row, index) {
      var booking = this.getBooking(row && row.booking) || {};
      var comment = booking.comment || "";
      if (comment) {
        return comment + ' <span style="cursor:pointer" class="comment text-mute glyphicon glyphicon-pencil"></span>';
      } else {
        return '<span style="cursor:pointer" class="comment text-mute glyphicon glyphicon-pencil"></span>'
      }
    },
    addBookFlag: function(e, value, row, index) {
      var vm = this;
      var booking = this.getBooking(row && row.booking);
      if (!booking) return console.error("member booking not found")
      var nextFlag = booking.flag === 'red' ? 'green' : 'red';

      var request = class_service.flag(row._id, booking.member, nextFlag);
      request.done(function(data, textStatus, jqXHR) {
        booking.flag = nextFlag;
        vm.$refs.classesTable.updateRow({ index: index, row: row });
        //$("#classes_table").bootstrapTable('updateRow', { index: index, row: row });
      });
    },
    addBookComment: function(e, value, row, index) {
      var vm = this;
      var booking = this.getBooking(row && row.booking);
      if (!booking) return console.error("member booking not found")

      this.$refs.commentDlg.show(booking.comment, function(newComment) {
        var request = class_service.comment(row._id, booking.member, newComment);
        request.done(function(data, textStatus, jqXHR) {
          booking.comment = newComment;
          vm.$refs.classesTable.updateRow({ index: index, row: row });
          //$("#classes_table").bootstrapTable('updateRow', { index: index, row: row });
        });
      });
    },
    loadHistory: function(e) {
      // disable the default navigation behavior
      e.preventDefault();
      $('#loadHistory_mask').show(600);
      this.$refs.historyTable.refresh({ url: '/api/members/' + this.memberData._id + '/history' });
    },
    loadClasses: function(e) {
      // disable the default navigation behavior
      e.preventDefault();
      $('#loadClasses_mask').show(600);
      this.$refs.classesTable.refresh({
        url: '/api/classes',
        query: {
          memberid: this.memberData._id,
          order: 'desc'
        }
      });
    }
  },
  created: function() {
    this.tenantConfig = _getTenantConfig();
  },
  mounted: function() {
    // set message for global usage
    Vue.prototype.$messager = this.$refs.messager;
    // 'this' is refer to vm instance
    var vm = this;
    // load member data
    var request = memberService.getMemberInfo(this.memberId);
    request.done((data, textStatus, jqXHR) => {
      if (data) {
        this.memberData = data || {};
      } else {
        this.$refs.messager.showErrorMessage("查看的学员不存在");
      }
    });

    request.done(function(data, textStatus, jqXHR) {
      if (!data) return; // member not existed
      var commentRequest = memberService.getMemberComments(vm.memberId);
      commentRequest.done(function(data, textStatus, jqXHR) {
        vm.comments = data.comments;
      });
      // load the member's course summary
      var summaryRequest = memberService.getMemberSummary(vm.memberId);
      summaryRequest.done(function(data, textStatus, jqXHR) {
        vm.summary = data;
      });
    });
  }
}
</script>

<style lang='less'>
.container .page-header {
  margin: 15px 0;
  padding-bottom: 3px;
}

.container .page-header span:hover {
  transition: all 0.5s ease-in-out;
  transform: rotate(360deg);
}

.form-horizontal .control-label {
  padding-top: 7px;
  padding-right: 0;
  margin-bottom: 0;
  text-align: right;
}
</style>
