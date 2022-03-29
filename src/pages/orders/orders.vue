<template lang="pug">
div
  div#toolbar
    div.form-inline(role="group")
      div.input-group
        span.input-group-addon {{$t("status")}}: 
        select.form-control(v-model="filter",@change="refresh")
          option(value="") {{$t("all")}}
          option(value="open") {{$t("order_open")}}
          option(value="notpay") {{$t("order_notpay")}}
          option(value="success") {{$t("order_success")}}
          option(value="closed") {{$t("order_closed")}}
          option(value="refund") {{$t("order_refund")}}
      //div.input-group(style="margin-left:4px")
        div.input-group-addon 开始:
        date-picker(v-model='from',style="width:120px")
      //div.input-group(style="margin-left:4px")
        div.input-group-addon 结束:
        date-picker(v-model='to',style="width:120px")
      //button#jumpToButton.btn.btn-default(type="button") 查询
  bootstrap-table.table-striped(ref='orderTable',:columns='columns',:options='options')
  modal-dialog(ref='confirmDelete',buttons="confirm",buttonStyle="danger",@ok="deleteOrder") 确认删除
    template(v-slot:body)
      p 确认删除订单<strong>{{actionOrder}}</strong>吗？
      p.small (无法撤销)
</template>
<script>
//var order_service = require('../../services/orders');
//var common = require('../../common/common');
var orders_service = require("../../services/orders");

module.exports = {
  name: "order-app",
  props: {},
  components: {
    "BootstrapTable": BootstrapTable,
    "date-picker": require("../../components/date-picker.vue").default,
    "modal-dialog": require("../../components/modal-dialog.vue").default
  },
  data() {
    return {
      tenantConfig: {},
      actionOrder: "",
      filter: "",
      from: null,
      to: null,
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
            'click .delete-order': this.deletingOrder,
            'click .close-order': this.closingOrder,
            'click .refund-order': this.refundingOrder
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
    refundingOrder(e, value, row, index) {
      if (row.status === "success") {
        //TODO
        alert("不支持退款");
      }
    },
    closingOrder(e, value, row, index) {
      if (row.status === "notpay") {
        //TODO
        alert("不支持关闭订单");
      }
    },
    deletingOrder(e, value, row, index) {
      if (row.status === "open") {
        this.actionOrder = row.tradeno;
        this.$refs.confirmDelete.show(row._id);
      }
    },
    deleteOrder(orderID) {
      var vm = this;
      var request = orders_service.delete(orderID);
      request.done(function(data, textStatus, jqXHR) {
        vm.$refs.orderTable.removeByUniqueId(orderID);
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
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
