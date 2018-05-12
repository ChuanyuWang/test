<style>

</style>

<template lang="pug">
div
  div#checkin_toolbar(style='line-height:1.5;display:inline-block')
    label(style='margin:0 3px') {{$t('time')}}:
    select.input-sm(v-model='timeFilter',style='margin-right:7px',@change='refreshCheckinStatus')
      option(value='today') {{$t('today')}}
      option(value='yesterday') {{$t('yesterday')}}
      option(value='past_week') {{$t('past_week')}}
      option(value='past_month') {{$t('past_month')}}
      option(value='') {{$t('all')}}
    label(style='margin:0 3px') {{$t('flag')}}:
    select.input-sm(v-model='flagFilter',style='margin-right:7px',@change='refreshCheckinStatus')
      option(value='red') {{$t('red_flag')}}
      option(value='green') {{$t('green_flag')}}
      option(value='') {{$t('all')}}
    label.text-success.checkbox-inline
      input(type="checkbox",value='checkin',@click='refreshCheckinStatus')
      | {{$t('checked_in')}}
      span.glyphicon.glyphicon-ok(style='margin-left:3px')
    label.text-danger.checkbox-inline
      input(type="checkbox",value='absent',@click='refreshCheckinStatus',checked)
      | {{$t('absent')}}
      span.glyphicon.glyphicon-remove(style='margin-left:3px')
    label.checkbox-inline
      input(type="checkbox",value='',@click='refreshCheckinStatus',checked)
      | {{$t('uncheckin')}}
      span.glyphicon.glyphicon-question-sign(style='margin-left:3px;color:#777')
  table#checkin_table(data-show-refresh='true',data-checkbox-header='false',data-pagination='true',data-page-size='15',data-page-list='[10,15,20,50,100]',data-striped='true',data-show-columns='true',data-unique-id="_id",data-click-to-select="true")
    thead
      tr
        th(data-field='date',data-sortable='false') {{$t('datetime')}}
        th(data-field='name',data-sortable='false') {{$t('class')}}
        th(data-field='books',data-sortable='false') {{$t('book')}}
        th(data-field='member.0.name',data-sortable='false') {{$t('member_name')}}
        //th(data-field='member.contact') 联系方式
        th(data-field='booking.status',data-sortable='false') {{$t('checkin')}}
        th(data-field='flag',data-align='center') {{$t('flag')}}
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * checkin-tab display a panel for checkin status statistics
 * --------------------------------------------------------------------------
 */

var common = require("../common");
var class_service = require("../services/classes");

module.exports = {
  name: "checkin-tab",
  props: {},
  data: function() {
    return {
      timeFilter: 'today',
      flagFilter: 'red'
    };
  },
  watch: {},
  components: {},
  computed: {},
  filters: {},
  methods: {
    refreshCheckinStatus: function() {
      // refresh the table when user changes the status filter
      $(this.$el).find("#checkin_table").bootstrapTable('refresh');
    },
    bookFormatter: function(value, row, index) {
      var result = "";
      if (jQuery.isArray(value)) {
        value.forEach(function(book) {
          if (book.title) result += "《" + book.title + "》";
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
          '<a class="flag text-muted" href="javascript:void(0)" title="">',
          '<i class="glyphicon glyphicon-flag"></i>',
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
        $(vm.$el).find("#checkin_table").bootstrapTable('updateRow', { index: index, row: row });
      });
    },
    statusQuery: function(params) {
        // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
        var statusEl = $('#checkin_toolbar input[type=checkbox]:checked');
        if (statusEl.length > 0) {
            var statusQuery = '';
            for (var i=0;i<statusEl.length;i++) {
                statusQuery += statusEl[i].value + ',';
            }
            params.status = statusQuery.substring(0, statusQuery.length-1);
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
  created: function() {},
  mounted: function() {
    $(this.$el)
      .find("#checkin_table")
      .bootstrapTable({
        locale: "zh-CN",
        //sortName: 'date',
        sortOrder: "asc",
        maintainSelected: true,
        toolbar: '#checkin_toolbar',
        //rowStyle: highlightExpire,
        queryParams: this.statusQuery,
        url: "/api/classes/checkin",
        sidePagination: "server",
        columns: [
          {
            formatter: common.dateFormatter
          },
          {
            formatter: this.nameFormatter
          },
          {
            formatter: this.bookFormatter
          },
          {},
          {
            formatter: this.checkinFormatter
          },
          {
            formatter: this.flagFormatter,
            events: {'click .flag': this.addFlag}
          }
        ]
      });
  }
};
</script>