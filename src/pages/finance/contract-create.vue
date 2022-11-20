<template lang="pug">
div.container
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../finance") 合约列表
    li.active 创建合约
  div.page-header
    h3(style="margin-top: 0; display: inline-block") 合约信息
    button.btn.btn-success(type="button" style="float: right", :disabled="hasError" @click="createContract") 确定
    a.btn.btn-default.me-3(type="button" style="float: right" href="../finance") 取消
  div.row
    div.col-sm-6
      form.form-horizontal
        div.form-group(:class="{ 'has-error': errors.memberId }")
          label.col-sm-4.col-md-3.control-label 学员:
          div.col-sm-8.col-md-6
            div.input-group
              input.form-control(type="text" readonly v-model="memberData.name")
              span.input-group-btn
                button.btn.btn-primary(type="button" @click="openMemberSelectDialog") 选择学员
            span.help-block.small.mb-3(v-show="errors.memberId") {{errors.memberId}}
        div.form-group
          label.col-sm-4.col-md-3.control-label 联系方式:
          div.col-sm-8.col-md-9
            p.form-control-static {{ memberData.contact }}
        div.form-group(:class="{ 'has-error': errors.comment }")
          label.col-sm-4.col-md-3.control-label 合约备注:
          div.col-sm-8.col-md-9
            textarea.form-control.has-3-rows(rows="3" v-model.trim="comment" placeholder="添加合约备注信息")
    div.col-sm-6
      form.form-horizontal
        div.form-group
          label.col-sm-4.col-md-3.control-label 类型:
          div.col-sm-4.col-md-3
            select.form-control(v-model="contract.type")
              option.text-default(value="new") 新签
              option.text-default(value="renewal") 续费
              option.text-default(value="donate") 赠送
          div.col-sm-4.col-md-3
            p.form-control-static(style="color: #808080")
              small 课时卡
        div.form-group(:class="{ 'has-error': errors.effectiveDate }")
          label.col-sm-4.col-md-3.control-label 生效日期:
          div.col-sm-7.col-md-5
            date-picker(v-model="contract.effectiveDate")
        div.form-group(:class="{ 'has-error': errors.expireDate }")
          label.col-sm-4.col-md-3.control-label 截止日期:
          div.col-sm-7.col-md-5
            date-picker(v-model="contract.expireDate")
        div.form-group
          label.col-sm-4.col-md-3.control-label 签约日期:
          div.col-sm-7.col-md-5
            date-picker(v-model="contract.signDate")
  div.page-header
    h3 选择课程
  div.row
    div.col-sm-6
      form.form-horizontal
        div.form-group(:class="{ 'has-error': errors.productId }")
          label.col-sm-4.col-md-3.control-label 课程:
          div.col-sm-8.col-md-6
            div.input-group
              input.form-control(type="text" readonly v-model="product.name")
              span.input-group-btn
                button.btn.btn-primary(type="button" @click="openTypeSelectDialog") 选择课程
        div.form-group(:class="{ 'has-error': errors.credit }")
          label.col-sm-4.col-md-3.control-label 课时数:
          div.col-sm-6.col-md-5
            div.input-group
              input.form-control(type="number" v-model.number="contract.credit" min="1" step="1")
              span.input-group-addon 课时
        div.form-group(:class="{ 'has-error': errors.averageFee }")
          label.col-sm-4.col-md-3.control-label 课程单价:
          div.col-sm-6.col-md-5
            div.input-group
              input.form-control(type="number" v-model.number="averageFee" min="0" step="1")
              span.input-group-addon 元
        div.form-group(:class="{ 'has-error': errors.total }")
          label.col-sm-4.col-md-3.control-label 课程金额:
          div.col-sm-6.col-md-5
            div.input-group
              input.form-control(type="number" v-model.number="totalFee" min="0" step="1")
              span.input-group-addon 元
    div.col-sm-6
      form.form-horizontal
        div.form-group(:class="{ 'has-error': errors.expendedCredit }")
          label.col-sm-4.col-md-3.control-label 系统外耗课:
            a.small.ms-3(style="color: #777" data-toggle="tooltip" data-container="body" title="系统外消耗课时是指使用系统前(合同签约前)上了的课时，例如：合约中有100课时，系统外耗课20课时，则实际可以使用的课时为80课时")
              i.glyphicon.glyphicon-info-sign
          div.col-sm-7.col-md-5
            div.input-group
              input.form-control(type="number" v-model.number="contract.expendedCredit" min="1" step="1")
              span.input-group-addon 课时
        div.form-group(:class="{ 'has-error': errors.discount }")
          label.col-sm-4.col-md-3.control-label 折扣直减:
          div.col-sm-7.col-md-5
            div.input-group
              input.form-control(type="number" v-model.number="discountFee" min="0" step="1")
              span.input-group-addon 元
        div.form-group
          label.col-sm-4.col-md-3.control-label 应收金额:
          div.col-sm-7.col-md-5
            p.form-control-static
              strong {{ receivable }} 元
  member-select-modal(ref="memberSelectDlg" @ok="selectMember")
  type-select-modal(ref="typeSelectDlg" @ok="selectType")
  message-alert(ref="messager")
</template>
<script>

var member_select_modal = require("../../components/member-select-modal.vue").default;
var type_select_modal = require("../../components/type-select-modal.vue").default;
var serviceUtil = require("../../services/util");
var common = require('../../common/common');
var messageAlert = require("../../components/message-alert.vue").default;


module.exports = {
  name: "contract-create",
  props: {},
  components: {
    "member-select-modal": member_select_modal,
    "type-select-modal": type_select_modal,
    "message-alert": messageAlert,
    "date-picker": require('../../components/date-picker.vue').default
  },
  data() {
    return {
      tenantConfig: {},
      comment: "",
      memberData: {
        id: "",
        name: "",
        contact: "",
        status: ""
      },
      product: {
        id: "",
        name: "",
        type: "type"
      },
      contract: {
        //status: "open",
        type: "new",
        goods: "",
        goods_type: "type",
        category: "credit", // TODO, remove hardcode category
        credit: 0,
        //consumedCredit: 0,
        expendedCredit: 0,
        total: 0,
        discount: 0,
        received: 0,
        createDate: new Date(),
        effectiveDate: moment().startOf('day'),
        expireDate: null,
        signDate: new Date(),
        comments: []
      }
    }
  },
  computed: {
    receivable() {
      var value = this.contract.total - this.contract.discount;
      return value > 0 ? Math.round(value) / 100 : 0;
    },
    averageFee: {
      get() {
        var value = this.contract.credit > 0 ? this.contract.total / this.contract.credit : 0
        return Math.round(value) / 100;
      },
      set(newValue) {
        var total = this.contract.credit > 0 ? newValue * this.contract.credit : 0;
        this.contract.total = Math.round(total * 100);
      }
    },
    totalFee: {
      get() {
        return Math.round(this.contract.total) / 100;
      },
      set(newValue) {
        this.contract.total = Math.round(newValue * 100);
      }
    },
    discountFee: {
      get() {
        return Math.round(this.contract.discount) / 100;
      },
      set(newValue) {
        this.contract.discount = Math.round(newValue * 100);
      }
    },
    errors() {
      var errors = {};
      if (!this.memberData.id)
        errors.memberId = "请选择学员";
      if (this.memberData.status === "inactive")
        errors.memberId = "过期学员不能创建合约";
      if (this.comment.length > 256)
        errors.comment = "备注不超过256个字";
      if (this.comment.length < 1)
        errors.comment = "备注不能为空";
      if (!this.product.id)
        errors.productId = "请选择课程";
      if (!moment(this.contract.effectiveDate).isValid())
        errors.effectiveDate = "生效日期未设置或格式不正常";
      if (moment(this.contract.expireDate).isValid() && moment(this.contract.expireDate).isBefore(this.contract.effectiveDate))
        errors.expireDate = "截止日期不能早于生效日期";
      if (this.contract.credit <= 0)
        errors.credit = "课时数不能小于或等于零";
      if (this.averageFee < 0)
        errors.averageFee = "课程单价不能小于零";
      if (this.contract.total < 0)
        errors.total = "课程金额不能小于零";
      if (this.contract.discount < 0)
        errors.discount = "折扣金额不能小于零";
      if (this.contract.discount > 0 && this.contract.total < this.contract.discount)
        errors.discount = "折扣金额不能大于课程金额";
      if (this.contract.expendedCredit < 0)
        errors.expendedCredit = "已耗课时不能小于零";
      if (this.contract.expendedCredit > 0 && this.contract.credit < this.contract.expendedCredit)
        errors.expendedCredit = "已耗课时不能大于课时数";
      return errors;
    },
    hasError() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  watch: {},
  filters: {},
  methods: {
    openMemberSelectDialog() {
      this.$refs.memberSelectDlg.show();
    },
    openTypeSelectDialog() {
      this.$refs.typeSelectDlg.show();
    },
    selectMember(items) {
      if (items && items.length > 0) {
        var member = items[0];
        this.memberData.id = member._id;
        this.memberData.name = member.name;
        this.memberData.contact = member.contact;
        this.memberData.status = member.status;
      }
    },
    selectType(item) {
      if (item && item.id) {
        this.product.id = item.id;
        this.product.name = item.name;
        this.product.visible = item.visible;
      }
    },
    createContract() {
      this.contract.memberId = this.memberData.id;
      this.contract.goods = this.product.id;
      if (this.comment.length > 0)
        this.contract.comments.push({ text: this.comment });
      var request = serviceUtil.postJSON("/api/contracts", this.contract);
      request.done(function(data, textStatus, jqXHR) {
        // data is generated ObjectId for the insert operation
        window.location.href = window.location.pathname + '/../' + data;
      });
      request.fail((jqXHR, textStatus, errorThrown) => {
        this.$refs.messager.showErrorMessage("创建合约失败");
      });
    }
  },
  created() {
    this.tenantConfig = _getTenantConfig();
  },
  mounted() {
    $('[data-toggle="tooltip"]').tooltip();
    // set message for global usage
    Vue.prototype.$messager = this.$refs.messager;
    // default tab is classroom
    var memberId = common.getParam("memberId");
    if (memberId) {
      var request = serviceUtil.getJSON("/api/members/" + memberId);
      request.done((data, textStatus, jqXHR) => {
        if (data) {
          this.memberData.id = data._id;
          this.memberData.name = data.name;
          this.memberData.contact = data.contact;
          this.memberData.status = data.status;
        }
      });
    }
  }
}
</script>
<style lang="less">
.container .page-header {
  margin: 15px 0;
  padding-bottom: 3px;
}
</style>
