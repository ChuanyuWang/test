<template lang="pug">
div
  div#checkin_toolbar.d-flex.align-items-center
    div.input-group.me-3
      span.input-group-addon {{$t('time')}}:
      select.form-control(v-model='timeFilter' @change='refreshCheckinStatus')
        option(value='today') {{$t('today')}}
        option(value='yesterday') {{$t('yesterday')}}
        option(value='past_week') {{$t('past_week')}}
        option(value='past_month') {{$t('past_month')}}
        option(value='') {{$t('all')}}
    div.input-group.me-7
      span.input-group-addon {{$t('flag')}}:
      select.form-control(v-model='flagFilter' @change='refreshCheckinStatus')
        option(value='red') {{$t('red_flag')}}
        option(value='green') {{$t('green_flag')}}
        option(value='') {{$t('all')}}
    label.text-success.checkbox-inline
      input(type="checkbox",value='checkin',@click='refreshCheckinStatus')
      | {{$t('checked_in')}}
      span.glyphicon.glyphicon-ok.ms-3
    label.text-danger.checkbox-inline
      input(type="checkbox",value='absent',@click='refreshCheckinStatus',checked)
      | {{$t('absent')}}
      span.glyphicon.glyphicon-remove.ms-3
    label.checkbox-inline
      input(type="checkbox",value='',@click='refreshCheckinStatus',checked)
      | {{$t('uncheckin')}}
      span.glyphicon.glyphicon-question-sign.ms-3(style='color:#777')
  bootstrap-table.table-striped(ref='checkinTable',:columns='columns',:options='options')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * checkin-tab display a panel for checkin status statistics
 * --------------------------------------------------------------------------
 */

var common = require("../../common/common");
var class_service = require("../../services/classes");

module.exports = {
  name: "checkin-tab",
  props: {},
  data: function() {
    // load the setting of tenant from html root-level elements
    var setting = common.getTenantSetting();
    return {
      timeFilter: 'today',
      flagFilter: 'red',
      feature: setting.feature,
      columns: [
        {
          field: "date",
          title: this.$t("datetime"),
          sortable: true,
          formatter: common.dateFormatter
        }, {
          field: "name",
          title: this.$t("class"),
          sortable: false,
          formatter: this.nameFormatter
        }, {
          field: "books",
          title: this.$t("book"),
          sortable: false,
          formatter: this.bookFormatter,
          visible: setting.feature === 'book'
        }, {
          field: "member.0.name",
          title: this.$t("member_name"),
          sortable: false,
          formatter: this.memberFormatter
        }, {
          field: "booking.status",
          title: this.$t("checkin"),
          sortable: false,
          formatter: this.checkinFormatter
        }, {
          field: "flag",
          title: this.$t("flag"),
          align: "center",
          formatter: this.flagFormatter,
          cellStyle: this.flagStyle,
          events: { 'click .flag': this.addFlag }
        }, {
          field: "booking.comment",
          title: this.$t("comment"),
          sortable: false,
          visible: false
        }
      ],
      options: {
        locale: "zh-CN",
        sortName: 'date',
        sortOrder: "desc",
        toolbar: '#checkin_toolbar',
        queryParams: this.statusQuery,
        url: "/api/classes/checkin",
        sidePagination: "server",
        showRefresh: true,
        pagination: true,
        pageSize: 15,
        pageList: [10, 15, 20, 50, 100],
        showColumns: true,
        uniqueId: "_id"
      }
    };
  },
  watch: {},
  components: {
    "BootstrapTable": BootstrapTable
  },
  computed: {},
  filters: {},
  methods: {
    refreshCheckinStatus: function() {
      // refresh the table when user changes the status filter
      this.$refs.checkinTable.refresh();
    },
    bookFormatter: function(value, row, index) {
      var result = "";
      if (jQuery.isArray(value)) {
        value.forEach(function(book) {
          if (book.title) {
            if (book.title.substr(0, 1) !== "《")
              result += "《" + book.title + "》";
            else
              result += book.title;
          }
        });
      }
      return result || "<i>" + this.$t('book_not_added') + "</i>";
    },
    getFlag: function(booking) {
      if (!booking) return null;
      if (booking.flag) return booking.flag;
      // show red flag is flag is not set and booking status is absent
      return booking.status === 'absent' ? 'red' : null;
    },
    nameFormatter: function(value, row, index) {
      return [
        '<a class="" target="_blank" href="./class/' + row._id + '">',
        '  <i class="glyphicon glyphicon-calendar"/> ' + value,
        "</a>"
      ].join("");
    },
    memberFormatter: function(value, row, index) {
      return [
        '<a class="" target="_blank" href="./member/' + row.member[0]._id + '">',
        '  <i class="glyphicon glyphicon-user"/> ' + value,
        "</a>"
      ].join("");
    },
    flagStyle: function(value, row, index, field) {
      return {
        css: {
          padding: '0px'
        }
      }
    },
    flagFormatter: function(value, row, index) {
      var flag = this.getFlag(row.booking);
      if (flag == "red") {
        return [
          '<a class="flag text-danger" href="javascript:void(0)" title="红旗">',
          '<i class="glyphicon glyphicon-flag"></i>',
          "</a>"
        ].join("");
      } else if (flag == "green") {
        return [
          '<a class="flag text-success" href="javascript:void(0)" title="绿旗">',
          '<i class="glyphicon glyphicon-flag"></i>',
          "</a>"
        ].join("");
      } else if (flag == "yellow") {
        return [
          '<a class="flag text-warning" href="javascript:void(0)" title="黄旗">',
          '<i class="glyphicon glyphicon-flag"></i>',
          "</a>"
        ].join("");
      } else {
        return [
          '<a class="flag text-muted" href="javascript:void(0)" title="未设置">',
          '<i class="glyphicon glyphicon-flag" style="opacity:0.5"></i>',
          "</a>"
        ].join("");
      }
    },
    checkinFormatter: function(value, row, index) {
      if (value == "absent") {
        return '<span style="display:table-cell" class="text-danger glyphicon glyphicon-remove"></span>';
      } else if (value == "checkin") {
        return '<span style="display:table-cell" class="text-success glyphicon glyphicon-ok"></span>';
      } else {
        return '<span style="display:table-cell" class="text-muted glyphicon glyphicon-question-sign"></span>';
      }
    },
    addFlag: function(e, value, row, index) {
      var vm = this;
      var flag = vm.getFlag(row.booking);
      var nextFlag = flag === 'red' ? 'green' : 'red';

      var request = class_service.flag(row._id, row.booking.member, nextFlag);
      request.done(function(data, textStatus, jqXHR) {
        row.booking.flag = nextFlag;
        vm.$refs.checkinTable.updateRow(index, row);
      });
    },
    statusQuery: function(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      var statusEl = $('#checkin_toolbar input[type=checkbox]:checked');
      if (statusEl.length > 0) {
        var statusQuery = '';
        for (var i = 0; i < statusEl.length; i++) {
          statusQuery += statusEl[i].value + ',';
        }
        params.status = statusQuery.substring(0, statusQuery.length - 1);
      }
      switch (this.flagFilter) {
        case 'red':
          params.flag = 'red,'; // include red flag and 'null' flag
          break;
        case 'green':
          params.flag = 'green';
          break;
        default:
          break;
      }
      switch (this.timeFilter) {
        case 'today':
          params.from = moment().startOf('day').toISOString();
          params.to = moment().endOf('day').toISOString();
          break;
        case 'yesterday':
          params.from = moment().startOf('day').subtract(24, 'hours').toISOString();
          params.to = moment().startOf('day').toISOString();
          break;
        case 'past_week':
          params.from = moment().startOf('day').subtract(7, 'days').toISOString();
          params.to = moment().endOf('day').toISOString();
          break;
        case 'past_month':
          params.from = moment().startOf('day').subtract(30, 'days').toISOString();
          params.to = moment().endOf('day').toISOString();
          break;
        default:
          break;
      }
      return params;
    }
  },
  created: function() { },
  mounted: function() { }
};
</script>

<style lang='less'>
.flag {
  font-size: larger;
}
</style>
