<style>

</style>

<template lang="pug">
div(style='margin-top:7px')
  ul.nav.nav-tabs(role='tablist')
    li.active(role='presentation')
      a(href="#checkin",role='tab',data-toggle='tab') {{$t('checkin_title')}}
  div.tab-content
    div.tab-pane.active(role="tabpanel",id="checkin",style="padding:7px")
      div#toolbar(style='line-height:1.5;display:inline-block')
        label.text-success.checkbox-inline
          input(type="checkbox",value='checkin',@click='refreshCheckinStatus')
          | 已签到
        label.text-danger.checkbox-inline
          input(type="checkbox",value='absent',@click='refreshCheckinStatus')
          | 缺席
        label.checkbox-inline
          input(type="checkbox",value='',@click='refreshCheckinStatus')
          | 未签到
      table#checkin_table(data-show-refresh='true',data-checkbox-header='false',data-pagination='true',data-page-size='15',data-page-list='[10,15,20,50,100]',data-striped='true',data-show-columns='true',data-toolbar='#toolbar',data-unique-id="_id",data-click-to-select="true")
        thead
          tr
            th(data-field='date',data-sortable='false') 日期/时间
            th(data-field='name',data-sortable='false') 课程名称
            th(data-field='books',data-sortable='false') 绘本
            th(data-field='member.0.name',data-sortable='false') 姓名
            //th(data-field='member.contact') 联系方式
            th(data-field='booking.status',data-sortable='false') 签到
            th(data-field='flag',data-align='center') 旗标
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * teach-setting display a panel for teacher settings
 * --------------------------------------------------------------------------
 */

var common = require("../common");
var class_service = require("../services/classes");

module.exports = {
  name: "statistics-page",
  props: {
    //data: Array // array of teacher object
  },
  data: function() {
    return {};
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
      return result || "<i>未添加</i>";
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
        var statusEl = $('#toolbar input[type=checkbox]:checked');
        if (statusEl.length > 0) {
            var statusQuery = '';
            for (var i=0;i<statusEl.length;i++) {
                statusQuery += statusEl[i].value + ',';
            }
            params.status = statusQuery.substring(0, statusQuery.length-1);
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
        sortOrder: "desc",
        maintainSelected: true,
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