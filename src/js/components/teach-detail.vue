<template lang="pug">
div.detail-teacher-border(style='min-height:300px')
  form.form-horizontal(v-show='hasData')
    div.form-group
      label.col-sm-2.control-label {{$t('status')}}:
      select.col-sm-5.form-control(v-model='item.status',style='margin-left:15px;width:auto',:disabled='isDeleted')
        option.text-success(value='active') {{$t('status_active')}}
        option.text-danger(value='inactive') {{$t('status_inactive')}}
        option(v-if='isDeleted',value='deleted') {{$t('status_deleted')}}
    div.form-group(:class='{"has-error": errors.name}')
      label.col-sm-2.control-label {{$t('member_name')}}:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.name")
        input.form-control(v-model.trim='item.name', placeholder='老师姓名')
    div.form-group(:class='{"has-error": errors.contact}')
      label.col-sm-2.control-label {{$t('member_contact')}}:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.contact")
        input.form-control(v-model.trim='item.contact', placeholder='135xxx')
    div.form-group(:class='{"has-error": errors.birthday}')
      label.control-label.col-sm-2 {{$t('birthday')}}:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.birthday")
        date-picker(v-model='item.birthday')
    div.form-group(:class='{"has-error": errors.note}')
      label.control-label.col-sm-2 {{$t('note')}}:
      div.col-sm-10(data-toggle="tooltip",data-placement="right",:title="errors.note")
        textarea.form-control(rows='3',v-model.trim='item.note',style='resize:vertical;min-height:70px')
    div.form-group
      div.col-sm-offset-2.col-sm-10
        button.btn.btn-success(type='button',v-on:click='saveBasicInfo',:disabled='hasError || isDeleted') {{item._id ? $t('save'): $t('create')}}
        button.btn.btn-danger(type='button',v-on:click='deleteListener',v-show='hasData',style='margin-left:5px') {{$t('delete')}}
    div.detail-separator
    div.form-group
      label.control-label.col-sm-2 {{$t('history_teacher')}}:
      div.col-sm-10
        div#history_toolbar
          form.form-inline
            div.form-group(style='margin-right:0')
              span(style='margin-right:7px',data-toggle="tooltip",data-placement="right",title="不含缺席学员课时") 共计完成{{totalCost}}课时
              select.form-control(v-model='timeFilter',@change='refreshHistory')
                option(value='this_month') {{$t('this_month')}}
                option(value='last_month') {{$t('last_month')}}
                option(value='') {{$t('all')}}
        bootstrap-table(ref='historyTable',:columns='columns',:options='options',@onLoadSuccess="calculateTotal")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * teach-detail.js display details of selected teacher
 * --------------------------------------------------------------------------
 */

var date_picker = require("./date-picker.vue").default;
var common = require("../common");

module.exports = {
  props: {
    data: Object // teacher object
  },
  data: function() {
    var settings = common.getTenantSetting();
    return {
      item: jQuery.extend(true, {}, this.data || {}),
      setting: settings,
      timeFilter: "this_month",
      totalCost: 0,
      columns: [
        {
          field: "name",
          title: "课程名称",
          formatter: this.linkNameFormatter
        },
        {
          field: "cost",
          title: "课时",
        },
        {
          field: "booking",
          title: "人数",
          formatter: this.quantityFormatter
        },
        {
          field: "date",
          title: "课程日期",
          sortable: true,
          formatter: common.dateFormatter
        },
        {
          field: "books",
          title: this.$t("book"),
          visible: settings.feature == 'book',
          formatter: this.booksFormatter
        }
      ],
      options: {
        locale: "zh-CN",
        striped: true,
        toolbar: "#history_toolbar",
        toolbarAlign: "right",
        uniqueId: "_id",
        sortName: "date",
        sortOrder: "desc",
        pagination: true,
        pageSize: 10
      }
    };
  },
  components: {
    "date-picker": date_picker,
    "BootstrapTable": BootstrapTable
  },
  watch: {
    data: function(value) {
      this.item = jQuery.extend(true, {}, value || {});
      if (this.item._id) {
        this.refreshHistory();
      } else {
        this.$refs.historyTable.removeAll();
      }
    }
  },
  computed: {
    hasData: function() {
      return !jQuery.isEmptyObject(this.item);
    },
    errors: function() {
      var errors = {};
      if (!this.item.name) errors.name = this.$t("msg_name_cannot_empty");
      if (this.item.note && this.item.note.length > 256)
        errors.note = this.$t("msg_note_too_long");
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      });
    },
    isDeleted: function() {
      if (this.item && this.item.status) {
        return this.item.status === "deleted";
      }
      return false;
    },
    from: function() {
      switch (this.timeFilter) {
        case 'this_month':
          return moment().startOf('month');
        case 'last_month':
          return moment().subtract(1, 'months').startOf('month');
        default:
          return null;
      }
    }
  },
  filters: {},
  methods: {
    refreshHistory: function() {
      this.$refs.historyTable.refresh({
        url: "/api/classes",
        query: {
          teacher: this.item._id,
          order: "desc",
          from: this.from && this.from.toISOString() || undefined,
          to: this.from && this.from.add(1, "months").toISOString() || undefined
        }
      });
    },
    calculateTotal: function(data, status, jqXHR) {
      var total = 0;
      data = data || [];
      var now = moment();
      for (var i = 0; i < data.length; i++) {
        var cls = data[i];
        // don't include not started classes
        if (moment(cls.date).isBefore(now)) {
          var booking = cls.booking || [];
          booking.forEach(function(member) {
            // don't include absent members
            if (member.status !== "absent") total += member.quantity * cls.cost;
          });
        }
      }
      // A better way of 'toFixed(1)'
      this.totalCost = Math.round(total * 10) / 10;
    },
    saveBasicInfo: function() {
      var res = {
        name: this.item.name,
        //gender: this.item.gender,
        status: this.item.status,
        contact: this.item.contact || "",
        birthday: this.item.birthday && moment(this.item.birthday).toISOString(),
        note: this.item.note || ""
      };
      if (this.item._id) {
        res._id = this.item._id;
        this.$emit("update", res);
      } else {
        this.$emit("create", res);
      }
    },
    deleteListener: function(params) {
      var vm = this;
      if (!vm.item._id) {
        return vm.$emit("delete");
      }
      bootbox.confirm({
        title: "确定删除吗？",
        message: '如果该老师被一节或多节程课指定，删除后，会被标记成"已删除"状态，并且不能修改',
        buttons: {
          confirm: {
            className: "btn-danger"
          }
        },
        callback: function(ok) {
          if (ok) vm.$emit("delete", vm.item._id);
        }
      });
    },
    linkNameFormatter: function(value, row, index) {
      return [
        '<a href="./class/' + row._id + '" target="_blank">',
        ' <i class="text-primary glyphicon glyphicon-calendar"></i>' + value,
        "</a>"
      ].join("");
    },
    quantityFormatter: function(value, row, index) {
      var result = 0;
      if ($.isArray(value)) {
        value.forEach(function(registration) {
          if (registration.quantity) result += parseInt(registration.quantity);
        });
      }
      return result;
    },
    booksFormatter: function(value, row, index) {
      if ($.isArray(value)) {
        var result = "";
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
  },
  mounted: function() { }
};
</script>

<style lang='less'>
.detail-teacher-border {
  border-left: 2px solid #eee;
}

.detail-separator {
  border-top: 2px solid #eee;
  margin: 15px 0px;
}
</style>
