<template lang="pug">
modal-dialog(ref='dialog',buttons="confirm",@ok="clickOK" @show="lazyRefresh") {{$t('member_select_title')}}
  template(v-slot:body)
    slot(name='toolbar')
    table.member-table(data-checkbox-header='false',data-striped='true',data-search='true',data-pagination='true',data-page-size='8',data-unique-id="_id",data-search-align='right',data-click-to-select='true')
      thead
        tr
          //th(data-field='_id',data-visible='false') ID
          th(v-if='multiSelection',data-checkbox='true')
          th(v-else,data-radio='true')
          th(data-field='name',data-sortable='true') {{$t('member_name')}}
          th(data-field='contact') {{$t('member_contact')}}
          th(data-field='_id') 课程合约
  template(v-slot:helpText)  
    p.small(style='color:#777;float:left;margin-top:7px') *仅显示在读学员
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * member-select-modal.vue component for select one or multi members
 * --------------------------------------------------------------------------
 */
var modalDialog = require("./modal-dialog.vue").default;

module.exports = {
  name: "member-select-dialog",
  props: {
    multiSelection: {
      type: Boolean,
      default: false
    }
  },
  data: function() {
    return {
      firstOpen: true
    };
  },
  components: {
    "modal-dialog": modalDialog
  },
  computed: {},
  filters: {},
  methods: {
    lazyRefresh() {
      if (this.firstOpen) {
        this.firstOpen = false;
        $(this.$el).find('table.member-table').bootstrapTable('refresh', { url: '/api/members?status=active' });
      }
    },
    show: function(selectedIDs) {
      // TODO, check if data is loaded successfully at the very first time
      // clear existed selected items
      var selections = $(this.$el).find('table.member-table').bootstrapTable('getAllSelections');
      selections = selections.map(function(value) {
        return value._id;
      });
      $(this.$el).find('table.member-table').bootstrapTable('uncheckBy', { field: '_id', values: selections });
      $(this.$el).find('table.member-table').bootstrapTable('resetSearch');
      if (selectedIDs && selectedIDs.length) {
        // select the pass in ones
        $(this.$el).find('table.member-table').bootstrapTable('checkBy', { field: '_id', values: selectedIDs });
      }
      this.$refs.dialog.show();
    },
    clickOK: function() {
      var selections = $(this.$el).find('table.member-table').bootstrapTable('getAllSelections');
      this.$emit("ok", selections);
    },
    creditFormatter: function(value, row, index) {
      var membership = row.membership;
      if (membership && membership[0]) {
        // A better way of 'toFixed(1)'
        if (typeof (membership[0].credit) == 'number') {
          var n = Math.round(membership[0].credit * 10) / 10;
          return n === 0 ? 0 : n; // handle the "-0" case
        } else {
          return membership[0].credit;
        }
      } else {
        return undefined;
      }
    },
    contractFormatter(value, row, index) {
      return "TBD";
    }
  },
  mounted: function() {
    var vm = this;
    $(vm.$el).find('table.member-table').bootstrapTable({
      sidePagination: "server",
      //url: '/api/members?status=active', // only display active members
      locale: 'zh-CN',
      showRefresh: true,
      columns: [{}, {}, {}, {
        formatter: vm.contractFormatter
      }]
    });
  }
};
</script>

<style lang='less'>

</style>
