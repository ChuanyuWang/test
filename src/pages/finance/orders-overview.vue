<template lang="pug">
div
  div#orders_toolbar
    div.d-flex.align-items-center.flex-wrap
      div.input-group.input-group-sm.me-3
        span.input-group-addon {{$t("status")}}: 
        select.form-control(v-model="filter",@change="refresh")
          option(value="") {{$t("all")}}
          option(value="open") {{$t("order_open")}}
          option(value="notpay") {{$t("order_unpaid")}}
          option(value="success") {{$t("order_success")}}
          option(value="closed") {{$t("order_closed")}}
          option(value="refund") {{$t("order_refund")}}
      date-picker.input-group-sm(v-model='from',placeholder="开始",style="width:160px")
      i.glyphicon.glyphicon-minus
      date-picker.input-group-sm.me-3(v-model='to',placeholder="结束",style="width:160px",:class='{"has-error": errors.to}')
      button.btn.btn-primary.btn-sm.me-3(type="button" @click="refresh") 查询
      button.btn.btn-default.btn-sm(type="button" @click="clear") 清空
  bootstrap-table.table-striped(ref='orderTable',:columns='columns',:options='options')
  modal-dialog(ref='confirmDelete',buttons="confirm",buttonStyle="danger",@ok="deleteOrder") 删除订单
    template(v-slot:body)
      p 确认删除订单<strong>{{actionOrder}}</strong>吗？
      p.small (无法撤销)
  modal-dialog(ref='confirmClose',buttons="confirm",@ok="closeOrder") 关闭订单
    template(v-slot:body)
      p 确认关闭订单<strong>{{actionOrder}}</strong>吗？
      p.small (关闭后用户无法再通过此订单支付)
  modal-dialog(ref='errorDialog',buttonStyle="danger") 出错了
    template(v-slot:body)
      p {{errorMessage}}
</template>
<script>
import orders_service from "../../services/orders";
import datePicker from "../../components/date-picker.vue";
import modalDialog from "../../components/modal-dialog.vue";

export default {
  name: "order-page",
  props: {},
  components: {
    "BootstrapTable": BootstrapTable,
    "date-picker": datePicker,
    "modal-dialog": modalDialog
  },
  data() {
    return {
      tenantConfig: {},
      actionOrder: "",
      errorMessage: "",
      filter: "",
      from: null,
      to: null,
      columns: [{
        field: "tradeno",
        title: "订单号",
        sortable: true
      }, {
        field: "status",
        title: this.$t("status"),
        formatter: this.statusFormatter
      }, {
        field: "name",
        title: "学员",
        formatter: this.memberFormatter
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
        title: "金额(元)",
        formatter: this.totalFormatter
      }, {
        //field: "status", // the events will not work when adding duplicate field
        title: "操作",
        formatter: this.actionFormatter,
        events: {
          'click .delete-order': this.deletingOrder,
          'click .close-order': this.closingOrder,
          'click .refund-order': this.refundingOrder
        }
      }],
      options: {
        toolbar: "#orders_toolbar",
        iconSize: "sm",
        locale: 'zh-CN',
        pagination: true,
        pageSize: 15,
        pageList: [15, 25, 50, 110],
        //url: "/api/orders",
        uniqueId: "_id",
        sidePagination: "server",
        search: true,
        showRefresh: true,
        sortName: "tradeno",
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
          return this.$t("order_unpaid");
        default:
          return null;
      }
    },
    memberFormatter(value, row, index) {
      return [
        `<a href="./member/${row.memberid}">`,
        '<i class="glyphicon glyphicon-user me-3"/>',
        value,
        '</a>'
      ].join('');
    },
    detailFormatter(value, row, index) {
      var goods = value && value.goods_detail || [];
      return [
        `<a href="./class/${row.classid}">`,
        '<i class="glyphicon glyphicon-blackboard me-3"/>',
        goods[0] && goods[0].goods_name,
        '</a>'
      ].join('');
    },
    totalFormatter(value, row, index) {
      return value / 100 + "元";
    },
    actionFormatter(value, row, index) {
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
      params.from = this.from && this.from.startOf('day').toISOString();
      params.to = this.to && this.to.endOf('day').toISOString();
      return params;
    },
    clear() {
      this.from = null;
      this.to = null;
    },
    refresh() {
      this.$refs.orderTable.refresh({ url: "/api/orders" });
    },
    refundingOrder(e, value, row, index) {
      if (row.status === "success") {
        //TODO
        alert("不支持退款");
      }
    },
    closingOrder(e, value, row, index) {
      if (row.status === "notpay") {
        this.actionOrder = row.tradeno;
        this.$refs.confirmClose.show(row._id);
      }
    },
    closeOrder(orderID) {
      var vm = this;
      var request = orders_service.close(orderID);
      request.done(function(data, textStatus, jqXHR) {
        vm.$refs.orderTable.updateByUniqueId({ id: orderID, row: data });
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        vm.errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        vm.$refs.errorDialog.show();
      });
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
        vm.errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        vm.$refs.errorDialog.show();
      });
    }
  },
  created() {
    this.tenantConfig = _getTenantConfig();
  },
  mounted() { }
}
</script>
<style lang="less"></style>
