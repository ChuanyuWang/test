<template lang="pug">
div
  div#toolbar
    div.form-inline(role="role")
      div.input-group
        span.input-group-addon {{$t("status")}}: 
        select.form-control(v-model="filter",@change="refresh")
          option(value="") {{$t("all")}}
          option(value="open") {{$t("order_open")}}
          option(value="notpay") {{$t("order_notpay")}}
          option(value="success") {{$t("order_success")}}
          option(value="closed") {{$t("order_closed")}}
          option(value="refund") {{$t("order_refund")}}
  bootstrap-table.table-striped(ref='orderTable',:columns='columns',:options='options')
</template>
<script>
//var order_service = require('../../services/orders');
//var common = require('../../common/common');

module.exports = {
  name: "order-app",
  props: {},
  components: {
    "BootstrapTable": BootstrapTable
  },
  data() {
    return {
      tenantConfig: {},
      filter: "",
      columns: [
        {
          field: "tradeno",
          title: "订单号",
          sortable: true
        }, {
          field: "status",
          title: this.$t("status"),
          formatter: this.statusFormatter
        }, {
          field: "name",
          title: "会员"
        }, {
          field: "contact",
          title: this.$t("member_contact")
        }, {
          field: "timestart",
          title: "日期/时间",
          sortable: true,
          formatter: this.dateTimeFormatter
        }, {
          field: "detail",
          title: "课程",
          formatter: this.detailFormatter
        }, {
          field: "totalfee",
          title: "金额(元)"
        }, {
          //field: "status", // the events will not work when adding duplicate field
          title: "操作",
          formatter: this.actionFormatter,
          events: {
            'click .delete-order': this.deleteOrder,
            'click .close-order': this.closeOrder,
            'click .refund-order': this.refundOrder
          }
        }
      ],
      options: {
        toolbar: "#toolbar",
        locale: 'zh-CN',
        pagination: true,
        pageSize: 15,
        pageList: [15, 25, 50, 110],
        url: "/api/orders",
        uniqueId: "_id",
        sidePagination: "server",
        showRefresh: true,
        search: true,
        sortName: "tradeno",
        sortOrder: "desc",
        queryParams: this.customQuery,
      }
    }
  },
  computed: {},
  filters: {

  },
  methods: {
    dateTimeFormatter(value, row, index) {
      if (!value) return '?';
      return moment(value).format('L HH:mm');
    },
    statusFormatter(value, row, index2) {
      switch (value) {
        case "success":
          return this.$t("order_success"); // + '<i class="text-success glyphicon glyphicon-ok"></i>';
        case "closed":
          return this.$t("order_closed");
        case "refund":
          return this.$t("order_refund");
        case "open":
          return this.$t("order_open");
        case "notpay":
          return this.$t("order_notpay");
        default:
          return null;
      }
    },
    detailFormatter(value, row, index) {
      var goods = value && value.goods_detail || [];
      return goods[0] && goods[0].goods_name;
    },
    actionFormatter(value, row, index) {
      /*
      return [
        '<a class="delete-order" href="javascript:void(0)" title="删除订单">',
        '<i class="text-danger glyphicon glyphicon-trash"></i>',
        '</a>  ',
        '<a class="close-order" href="javascript:void(0)" title="关闭订单">',
        '<i class="text-primary glyphicon glyphicon-ban-circle"></i>',
        '</a>',
        '<a class="refund-order" href="javascript:void(0)" title="退款">',
        '<i class="text-muted glyphicon glyphicon-yen"></i>',
        '</a>'
      ].join('');
      */
      return [
        '<div class="btn-group btn-group-xs" role="group">',
        row.status === "open" ? ['<button type="button" class="btn btn-danger delete-order" title="删除订单">',
          '<span class="glyphicon glyphicon-trash"></span>',
          '</button>'].join("") : "",
        row.status === "notpay" ? ['<button type="button" class="btn btn-primary close-order" title="关闭订单">',
          '<span class="glyphicon glyphicon-ban-circle"></span>',
          '</button>'].join("") : "",
        row.status === "success" ? ['<button type="button" class="btn btn-warning refund-order" title="退款">',
          '<span class="glyphicon glyphicon-yen"></span>',
          '</button>'].join("") : "",
        '</div>'
      ].join('');
    },
    customQuery(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      params.status = this.filter; // add the status filter
      return params;
    },
    refresh() {
      this.$refs.orderTable.refresh();
    },
    refundOrder(e, value, row, index) {
      if (row.status === "success") {
        //TODO
        alert("不支持退款");
      }
    },
    closeOrder(e, value, row, index) {
      if (row.status === "notpay") {
        //TODO
        alert("不支持关闭订单");
      }
    },
    deleteOrder(e, value, row, index) {
      if (row.status === "open") {
        //TODO
        alert("不支持删除订单");
      }
    }
  },
  created() {
    this.tenantConfig = _getTenantConfig();
  },
  mounted() {
  }
}
</script>
<style lang="less">
</style>
