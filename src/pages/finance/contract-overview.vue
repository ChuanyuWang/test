<template lang="pug">
div
  div#contracts_toolbar
    div.form-inline(role="group")
      div.btn-group(role="group" style="margin-right: 3px")
        a.btn.btn-success(type="button" href="contract/create") 创建
      div.input-group
        span.input-group-addon {{ $t('status') }}
        select.form-control(v-model="filter" @change="refresh")
          //"open|outstanding|paid|closed",
          option(value="") {{ $t('all') }}
          option(value="open") 新建
          option(value="outstanding") 部分支付
          option(value="paid") 已支付
          option(value="closed") 完成
          option(value="deleted") 作废
      date-picker(v-model="from" placeholder="签约日期" style="width: 160px; margin-left: 4px")
      i.glyphicon.glyphicon-minus
      date-picker(v-model="to" placeholder="结束" style="width: 160px", :class="{ 'has-error': errors.to }")
      button.btn.btn-primary(type="button" style="margin-left: 4px" @click="refresh") 查询
      button.btn.btn-default(type="button" style="margin-left: 4px" @click="clear") 清空
  bootstrap-table.table-striped(ref="contractTable", :columns="columns", :options="options")
  modal-dialog(ref="errorDialog" buttonStyle="danger") 出错了
    template(v-slot:body)
      p {{ errorMessage }}
</template>
<script>

module.exports = {
  name: "contract-overview",
  props: {},
  components: {
    "BootstrapTable": BootstrapTable,
    "date-picker": require("../../components/date-picker.vue").default,
    "modal-dialog": require("../../components/modal-dialog.vue").default
  },
  data() {
    return {
      tenantConfig: {},
      types: [],
      actionOrder: "",
      errorMessage: "",
      filter: "",
      from: null,
      to: null,
      columns: [{
        field: "signDate",
        title: "签约日期",
        sortable: true,
        formatter: this.dateFormatter
      }, {
        field: "memberId",
        title: "学员",
        formatter: this.memberFormatter
      }, {
        field: "type",
        title: "合约类型",
        formatter: this.typeFormatter
      }, {
        field: "goods",
        title: "课程",
        formatter: this.goodsFormatter
      }, {
        field: "credit",
        title: "合约课时"
      }, {
        field: "effectiveDate",
        title: "生效日期",
        sortable: true,
        formatter: this.dateTimeFormatter
      }, {
        title: "合约金额",
        formatter: this.totalFormatter
      }, {
        field: "received",
        title: "欠费金额",
        formatter: this.outstandingFormatter,
        cellStyle: this.outstandingStyle
      }, {
        //field: "status", // the events will not work when adding duplicate field
        title: "操作",
        formatter: this.actionFormatter
      }],
      options: {
        toolbar: "#contracts_toolbar",
        locale: 'zh-CN',
        pagination: true,
        pageSize: 15,
        pageList: [15, 25, 50, 110],
        url: "/api/contracts",
        uniqueId: "_id",
        sidePagination: "server",
        search: false,
        showRefresh: true,
        sortName: "signDate",
        sortOrder: "desc",
        queryParams: this.customQuery
      }
    }
  },
  computed: {
    errors: function() {
      var errors = {};
      if (this.from && this.to && this.to.isBefore(this.from))
        errors.to = '结束日期不能小于开始日期';
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
    dateTimeFormatter(value, row, index) {
      if (!value) return null;
      return moment(value).format('YYYY-MM-DD HH:mm');
    },
    dateFormatter(value, row, index) {
      if (!value) return null;
      return moment(value).format('YYYY-MM-DD');
    },
    typeFormatter(value, row, index2) {
      switch (value) {
        // "new|renewal|donate|import|export"
        case "new":
          return "新签"; // + '<i class="text-success glyphicon glyphicon-ok"></i>';
        case "renewal":
          return "续费";
        case "donate":
          return "赠送";
        case "import":
          return "转入";
        case "export":
          return "转出";
        case "refund":
          return "退费";
        default:
          return null;
      }
    },
    memberFormatter(value, row, index) {
      var members = row.member || [];
      return [
        members.length > 0 ? members[0].name : value,
        ' <a href="./member/' + value + '" target="_blank">',
        '<i class="glyphicon glyphicon-search"></i>',
        '</a>'
      ].join('');
    },
    goodsFormatter(value, row, index) {
      var goods_type = row && row.goods_type || "type";
      if (goods_type === "type") {
        for (var i = 0; i < this.types.length; i++) {
          if (this.types[i].id === value) {
            return this.types[i].name;
          }
        }
      }
    },
    totalFormatter(value, row, index) {
      return (row.total - row.discount) / 100 + "元";
    },
    outstandingFormatter(value, row, index) {
      return (row.total - row.discount - value) / 100 + "元";
    },
    outstandingStyle(value, row, index, field) {
      var outstanding = row.total - row.discount - value;
      return outstanding > 0 ? { classes: "text-danger" } : {};
    },
    actionFormatter(value, row, index) {
      var href = './contract/' + row._id;
      return ['<a href="' + href + '" title="查看合约">',
        '<i class="glyphicon glyphicon-search"></i>',
        '</a>'
      ].join("");
    },
    customQuery(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      params.status = this.filter; // add the status filter
      params.from = this.from && this.from.startOf('day').toISOString();
      params.to = this.to && this.to.endOf('day').toISOString();
      return params;
    },
    clear() {
      this.from = null;
      this.to = null;
    },
    refresh() {
      this.$refs.contractTable.refresh();
    }
  },
  created() {
    var vm = this;
    this.tenantConfig = _getTenantConfig();
    var request = $.getJSON("/api/setting/types");
    request.done(function(data, textStatus, jqXHR) {
      vm.types = data || []
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
    });
  },
  mounted() { }
}
</script>
<style lang="less">
</style>
