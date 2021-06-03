<template lang="pug">
div.modal.fade(tabindex='-1',data-backdrop='static')
  div.modal-dialog
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title {{$t('member_select_title')}}
      div.modal-body
        slot(name='toolbar')
        table.member-table(data-checkbox-header='false',data-striped='true',data-search='true',data-pagination='true',data-page-size='8',data-unique-id="_id",data-search-align='right',data-click-to-select='true')
          thead
            tr
              //th(data-field='_id',data-visible='false') ID
              th(v-if='multiSelection',data-checkbox='true')
              th(v-else,data-radio='true')
              th(data-field='name',data-sortable='true') {{$t('member_name')}}
              th(data-field='contact') {{$t('member_contact')}}
              th(data-field='membership') 剩余课时
      div.modal-footer
        p.small(style='color:#777;float:left;margin-top:7px') *仅显示激活会员
        button.btn.btn-default(type="button",data-dismiss="modal") {{$t('dialog_cancel')}}
        button.btn.btn-success(type="button",@click='handleOK') {{$t('dialog_ok')}}
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * member-select-modal.vue component for select one or multi members
 * --------------------------------------------------------------------------
 */

module.exports = {
  props: {
    multiSelection: {
      type: Boolean,
      default: false
    }
  },
  data: function() {
    return {};
  },
  watch: {
  },
  computed: {
  },
  filters: {
  },
  methods: {
    show: function(selectedIDs) {
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
      $(this.$el).modal('show');
    },
    handleOK: function() {
      $(this.$el).modal('hide');
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
    }
  },
  mounted: function() {
    var vm = this;
    $(vm.$el).find('table.member-table').bootstrapTable({
      sidePagination: "server",
      url: '/api/members?status=active', // only display active members
      locale: 'zh-CN',
      columns: [{}, {}, {}, {
        formatter: vm.creditFormatter
      }]
    });
  }
};
</script>

<style lang='less'>
</style>