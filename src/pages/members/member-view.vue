<template lang="pug">
div.container
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../member") 会员列表
    li.active 查看会员
  div.page-header
    h3(style='margin-top:0;display:inline-block') 基本信息
    button.btn.btn-danger(type='button',style='float:right',disabled,@click='') 删除学员
  form.form-horizontal
    div.form-group
      label.col-sm-2.control-label 状态:
      select.col-sm-5.form-control(v-model='memberData.status',@change='deactivateAlert',style='margin-left:15px;width:auto')
        option.text-success(value='active') 激活
        option.text-danger(value='inactive') 未激活
    div.form-group
      label.col-sm-2.control-label 来源:
      div.col-sm-10
        p.form-control-static {{source|sourceFormatter}}
    div.form-group(style='display:none')
      label.col-sm-2.control-label openID:
      div.col-sm-10
        p.form-control-static {{memberData.openid}}
    div.form-group(:class='{"has-error": errors.name}')
      label.col-sm-2.control-label 姓名:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.name")
        input.form-control(v-model.trim='memberData.name', placeholder='小朋友姓名')
      div.col-sm-5
        p.form-control-static(style='color:#808080')
          small {{memberData.since | formatDate}}注册会员
    div.form-group(:class='{"has-error": errors.contact}')
      label.col-sm-2.control-label 联系方式:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.contact")
        input.form-control(v-model.trim='memberData.contact', placeholder='135xxx')
    div.form-group(:class='{"has-error": errors.birthday}')
      label.control-label.col-sm-2 生日:
      div.col-sm-4(data-toggle="tooltip",data-placement="right",:title="errors.birthday")
        date-picker(v-model='memberData.birthday')
    div.form-group
      label.control-label.col-sm-2 描述:
      div.col-sm-8
        textarea.form-control(rows='3', placeholder='添加更多备注信息, 比如昵称', name='note',v-model.trim='memberData.note',style='resize:vertical;min-height:70px')
    div.form-group
      div.col-sm-offset-2.col-sm-10
        button.btn.btn-success(type='button',v-on:click='saveBasicInfo',:disabled='hasError') 保存
  div.page-header
    h3 会员卡
  template(v-if='memberData.membership&&memberData.membership.length')
    card(v-for="(card, i) in memberData.membership",@save="saveCardInfo",:item='card',:index='i',:key='i',:classrooms='tenantConfig.classrooms')
  template(v-else)
    card(@save="saveCardInfo",:item='{credit:0,room:[],type:"LIMITED"}',:index=-1,key='-1',:classrooms='tenantConfig.classrooms')
  div.page-header
    h3 {{$t('course_summary_title')}}
  table.table.table-bordered.table-striped.table-striped
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
              h4.media-heading(style='font-size:small') {{comment.text}}
              p.small(style='color:#777;position:relative') by {{comment.author}} at {{comment.posted | formatDateTime}}
                button.btn.btn-default.btn-xs.edit(type='button',v-on:click='editComment(key)',style='margin:-3px 3px;position:absolute')
                  span.glyphicon.glyphicon-pencil
        small(style='color:#777') 共{{commentCount}}条备忘
  div.page-header
    h3(style='margin-top:0;display:inline-block') 充值记录
    a(href='#',title='点击加载',@click='loadHistory')
      span.glyphicon.glyphicon-refresh(style='font-size:large;margin-left:5px')
  div#loadHistory_mask(style='display:none')
    bootstrap-table(ref='historyTable',:columns='changeHistory.columns',:options='changeHistory.options')
  div.page-header
    h3(style='margin-top:0;display:inline-block') 上课记录
    a(href='#',title='点击加载',@click='loadClasses')
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
    bootstrap-table(ref='classesTable',:columns='classRecord.columns',:options='classRecord.options')
  div(style='height:20px')
  comment-modal(ref='commentDlg')
  modal-dialog(ref='historyCommentDlg',buttonStyle="success",buttons="confirm",@ok="updateMembership") 确认并保存
    template(v-slot:body)
      form
        div.form-group
          label.control-label 备注:
          textarea.form-control(rows='3', name='comment',placeholder='备注修改会员卡的原因（选填）',v-model='toBeSavedMemo')
          small(style='color:#777;float:right;margin-top:2px') 不超过256个字，添加到备忘和充值记录备注中
    template(v-slot:action) 保存
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * member-view.js display details of single member item
 * --------------------------------------------------------------------------
 */
var cardComp = require('./card.vue').default;
var date_picker = require('../../components/date-picker.vue').default;
var modalDialog = require("../../components/modal-dialog.vue").default;
var comment_dlg = require('./comment-modal.vue').default;
var common = require('../../common/common');
var memberService = require('../../services/members');
var class_service = require('../../services/classes');


module.exports = {
  name: "member-view",
  props: {
  },
  components: {
    "BootstrapTable": BootstrapTable,
    "card": cardComp,
    "date-picker": date_picker,
    "modal-dialog": modalDialog,
    "comment-modal": comment_dlg
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
          striped: true,
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
          striped: true,
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
    },
    sourceFormatter: function(value) {
      if (value === "book") return "扫码预约";
      else return "手动添加";
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
      this.toBeSavedMembership = card;
      this.toBeSavedMembershipIndex = index;
      // open the confirm dialog with comment
      this.toBeSavedMemo = "";
      this.$refs.historyCommentDlg.show(this.toBeSavedMembershipIndex);
    },
    updateMembership: function(index) {
      var vm = this;
      // append the memo for this change if there is any
      this.toBeSavedMembership.memo = this.toBeSavedMemo.trim();
      if (index > -1) {
        var request = memberService.updateCard(this.memberData._id, index, this.toBeSavedMembership);
        request.done(function(data, textStatus, jqXHR) {
          bootbox.alert('会员卡更新成功');
          Vue.set(vm.memberData.membership, index, data.membership[index]);
        });
      } else {
        var request = memberService.createCard(this.memberData._id, this.toBeSavedMembership);
        request.done(function(data, textStatus, jqXHR) {
          bootbox.alert('会员卡创建成功');
          vm.memberData.membership = data.membership;
        });
      }
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
    // 'this' is refer to vm instance
    var vm = this;
    var member_id = $('#memberID').data('member-id');
    // load member data
    var request = memberService.getMemberInfo(member_id);
    request.done(function(data, textStatus, jqXHR) {
      vm.memberData = data;
    });

    request.done(function(data, textStatus, jqXHR) {
      var commentRequest = memberService.getMemberComments(member_id);
      commentRequest.done(function(data, textStatus, jqXHR) {
        vm.comments = data.comments;
      });
      // load the member's course summary
      var summaryRequest = memberService.getMemberSummary(member_id);
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
</style>
