<template lang="pug">
div
  div#members_toolbar
    div.d-flex.align-items-center.flex-wrap
      button.btn.btn-success.btn-sm(type='button',@click='beforeAddNewMember') 添加
      div.input-group.input-group-sm.source-filter.ms-3
        span.input-group-addon 来源:
        select.form-control(@change="refresh",v-model="sourceFilter")
          option(value="manual") 手动添加
          option(value="book") 扫码预约
          option(value="") 全部
      div.input-group.input-group-sm.status-filter.ms-3
        span.input-group-addon 状态:
        select.form-control(@change="refresh",v-model="statusFilter")
          option(value="active") 在读
          option(value="inactive") 过期
          option(value="") 全部
      div.input-group.input-group-sm.ms-3
        input.form-control(type="number",style="width:70px",placeholder="页码",v-model="pageNumber")
        span.input-group-btn
          button#jumpToButton.btn.btn-default(type="button",@click="jumpToPage") 跳转
      button.btn.btn-primary.btn-sm.ms-3(type='button',@click='displayOutOfCredit') 临期学员
  bootstrap-table.table-striped(ref='memberTable',:columns='tableColumns')

  modal-dialog(ref='expireMemberDialog',buttons="ok",@ok="") 临期学员
    template(v-slot:body)
      span.help-block.small 显示在读学员的剩余课时，统计所有合约中可用课时和已经排课但尚未开始的课时
      bootstrap-table.table-striped(ref='expireTable',:columns='expireTableColumns',:options='expireTableOptions')
    template(v-slot:helpText)
      span.help-block.small(style='float:left') *过期学员和过期合约不在统计之中
  modal-dialog(ref='createMemberDialog',buttons="confirm",@ok="addNewMember",:hasError="hasError") 添加学员
    template(v-slot:body)
      form.form-horizontal
        div.form-group
          div.col-sm-10.col-sm-offset-2
            span.help-block.small(style="margin:0")
              i.glyphicon.glyphicon-exclamation-sign.text-danger.me-3
              | <b>学员姓名</b>和<b>联系方式</b>是家长登录移动端进行约课的账号, 请谨慎填写并告知学员家长
        div.form-group(:class='{"has-error": errors.name}')
          label.control-label.col-sm-2(for='name') 姓名:
          div.col-sm-4
            input.form-control(type='text',name='name',placeholder='学员姓名',v-model.trim='name')
          div.col-sm-2
            p.form-control-static(style='color:#808080')
              small 必填
        div.form-group(:class='{"has-error": errors.contact}')
          label.control-label.col-sm-2(for='contact') 联系方式:
          div.col-sm-4
            input.form-control(type='tel',name='contact',placeholder='135xxx',v-model.trim='contact')
          div.col-sm-4
            p.form-control-static(style='color:#808080')
              small 必填
        div.form-group
          label.control-label.col-sm-2(for='birth') 出生日期:
          div.col-sm-4
            date-picker(v-model='birthday')
        div.form-group
          label.control-label.col-sm-2(for='note') 描述:
          div.col-sm-10
            textarea.form-control(rows='3',style='resize:vertical;min-height:70px',v-model.trim='note',name='note',placeholder='添加更多备注信息, 比如昵称')
  message-alert(ref="messager")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * member-overview.js display overview list of all members
 * --------------------------------------------------------------------------
 */
import common from '../../common/common';
import format from '../../common/format';
import serviceUtil from '../../services/util';
import messageAlert from "../../components/message-alert.vue";
import dataPicker from "../../components/date-picker.vue";
import modalDialog from "../../components/modal-dialog.vue";

export default {
  name: "member-overview",
  props: {},
  components: {
    "BootstrapTable": BootstrapTable,
    "date-picker": dataPicker,
    "message-alert": messageAlert,
    "modal-dialog": modalDialog
  },
  data: function() {
    return {
      tenantConfig: {},
      name: "",
      contact: "",
      birthday: null,
      note: "",
      sourceFilter: "manual",
      statusFilter: "active",
      pageNumber: 1,
      tableColumns: [{
        align: "center",
        formatter: this.viewFormatter
      }, {
        field: "name",
        title: "姓名",
        sortable: true
      }, {
        field: "contact",
        title: "联系方式"
      }, {
        field: "birthday",
        title: "出生日期",
        sortable: true,
        formatter: common.dateFormatter,
        visible: false
      }, {
        field: "contracts",
        title: "课程合约 (已用/合约)<i class='ms-3 small glyphicon glyphicon-info-sign' style='color:#777'/>",
        titleTooltip: "已用课时=消+排\n是指所有已经排课课程的课时合计 (包括已经结束和尚未开始的课程)",
        sortable: false,
        formatter: this.contractsFormatter
      },/*{
        field: "allRemaining",
        title: "剩余总课时<i class='small glyphicon glyphicon-info-sign' style='color:#777'/>",
        sortable: true,
        titleTooltip: "剩余总课时=剩余未使用课时+已使用但未开始的课时\n例如: 50 (40/10) 剩余40课时未使用/已使用但尚未开始的课程共计10课时，剩余总课时为50",
        formatter: this.remainingFormatter,
        cellStyle: this.remainingStyle
      }, {
        title: "有效期",
        sortable: true,
        sortName: "membership.0.expire",
        formatter: this.expireFormatter,
        cellStyle: this.expireStyle
      }, {
        field: "credit",
        title: "剩余课时",
        sortable: true,
        visible: false,
        formatter: this.creditFormatter
      }, {
        field: "unStartedClassCount",
        title: "未上课程(节)",
        sortable: false,
        visible: true
      }, */{
        field: "note",
        title: "描述",
        visible: false
      }],
      tableOptions: {
        toolbar: "#members_toolbar",
        iconSize: "sm",
        locale: "zh-CN",
        showRefresh: true,
        search: true,
        queryParams: this.customQuery,
        url: "/api/members",
        uniqueId: "_id",
        sortName: "since",
        sortOrder: "desc",
        showColumns: true,
        pageSize: 15,
        pageList: [15, 25, 50, 100],
        pagination: true,
        sidePagination: "server"
      },
      expireTableColumns: [{
        field: "member.name",
        title: "姓名",
        formatter: this.memberFormatter,
        sortable: true
      }, {
        field: "member.contact",
        title: "联系方式"
      }, {
        field: "total",
        title: "剩余课时*<i class='ms-3 small glyphicon glyphicon-info-sign' style='color:#777'/>",
        titleTooltip: "合约中可用课时和已经排课但尚未开始的课时",
        sortable: true,
        //formatter: format.toFixed1
        formatter: (value, row) => {
          return `<b>${format.toFixed1(value)}</b> <small>(可用${format.toFixed1(row.remaining)}/未开始${format.toFixed1(row.plan)})</small>`;
        }
      }],
      expireTableOptions: {
        locale: "zh-CN",
        showRefresh: false,
        //queryParams: this.customQuery,
        //url: "/api/members?hasContracts=true",
        uniqueId: "_id",
        sortName: "total",
        sortOrder: "asc",
        pageSize: 10,
        pageList: [10, 15, 20, 50],
        pagination: true,
        sidePagination: "server"
      }
    };
  },
  computed: {
    types() {
      var result = {};
      (this.tenantConfig.types || []).forEach(value => {
        result[value.id] = value.name;
      });
      return result;
    },
    errors: function() {
      var errors = {};
      if (!this.name || this.name.length === 0)
        errors.name = "学员姓名不能为空";
      if (!this.contact || this.contact.length === 0)
        errors.contact = "联系方式不能为空";
      return errors;
    },
    hasError: function() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  filters: {},
  methods: {
    customQuery(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      //var filter = $("#filter_dlg input:checked").val();
      //params.filter = filter;
      params.status = this.statusFilter;
      params.source = this.sourceFilter;
      // Append the field 'unStartedClassCount' to returned members
      params.appendLeft = true;
      return params;
    },
    beforeAddNewMember() {
      this.name = "";
      this.contact = "";
      this.birthday = moment().year(moment().year() - 8);
      this.note = "";
      this.$refs.createMemberDialog.show();
    },
    addNewMember() {
      var newMember = {
        since: moment(),
        name: this.name,
        contact: this.contact,
        birthday: this.birthday,
        note: this.note,
        membership: []
      };
      $.ajax("/api/members", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(newMember),
        success: function(data) {
          // update the table
          //$('#member_table').bootstrapTable('insertRow', { index: 0, row: data });
          // jump to new member page
          window.location.href = window.location.pathname + '/' + data._id;
        },
        error: function(jqXHR, status, err) {
          serviceUtil.showAlert("添加会员失败", jqXHR);
        },
        dataType: "json"
      });
    },
    viewFormatter(value, row, index) {
      var url = window.location.pathname + '/' + row._id;
      return [
        '<a href="' + url + '" title="查看会员详情">',
        '<i class="glyphicon glyphicon-edit"></i>',
        '</a>'
      ].join('');
    },
    contractsFormatter(value, row, index) {
      var contracts = value || [];
      var result = "";
      contracts.forEach((element, i) => {
        result += this.types[element.goods] + `: ${this.$toFixed1(element.consumedCredit) || 0}/${element.credit}课时`;
        if (element.status !== "paid") {
          result += "<span class='label label-danger' style='font-size: 60%''>欠费</span>"
        }
        if (i < contracts.length - 1) result += "; "
      });
      return result;
    },
    remainingFormatter(value, row, index) {
      return [
        '<b>',
        this.$toFixed1(value),
        '</b> <small>(<i>',
        this.getCredit(row.membership) || 0,
        '/',
        row.unStartedClassCost,
        '</i>)</small>'
      ].join('');
    },
    remainingStyle(value, row, index, field) {
      if (row.membership && row.membership[0]) {
        // highlight the cell if remaining credit or classes is zero
        if (value <= 0) {
          return {
            classes: 'danger'
          };
        }
      }
      return {};
    },
    expireFormatter(value, row, index) {
      var membership = row.membership;
      if (membership && membership[0]) {
        var expire = membership[0].expire;
        return expire ? moment(expire).format('ll') : null;
      } else {
        return undefined;
      }
    },
    expireStyle(value, row, index, field) {
      var card = row.membership && row.membership[0];
      if (card) {
        var expire = moment(card.expire);
        // skip is expire is not set
        if (!expire.isValid()) return {};
        // highlight the row if member is expired
        if (expire.isBefore(moment())) {
          return {
            classes: 'danger'
          };
        }
      }
      return {};
    },
    getCredit(memberships) {
      var card = memberships && memberships[0];
      if (card) {
        return this.$toFixed1(card.credit || 0);
      } else {
        return undefined;
      }
    },
    jumpToPage(event) {
      // jump to the specified page number
      pageNumber = parseInt(this.pageNumber);
      if (pageNumber !== NaN && pageNumber > 0) {
        this.refresh({ pageNumber: pageNumber });
      } else {
        this.refresh();
        this.pageNumber = null;
      }
    },
    refresh(params) {
      this.$refs.memberTable.refresh(params);
    },
    displayOutOfCredit() {
      this.$refs.expireMemberDialog.show();
      this.$refs.expireTable.refresh({ url: "/api/members?hasContracts=true" });
    },
    memberFormatter(value, row, index) {
      return [
        `<a href="./member/${row._id}" target="blank">`,
        `<i class="glyphicon glyphicon-user me-3"/>`,
        value,
        '</a>'
      ].join('');
    },
  },
  created: function() {
    this.tenantConfig = _getTenantConfig();
  },
  mounted: function() {
    // set message for global usage
    Vue.prototype.$messager = this.$refs.messager;
    this.$refs.memberTable.updateFormatText("formatSearch", "搜索姓名或联系方式");
    // Reload options to fix bug of refresh button size,
    // it turns out that method 'updateFormatText' will reset the size of refresh button
    this.$refs.memberTable.refreshOptions(this.tableOptions);
  }
}
</script>

<style lang='less'></style>
