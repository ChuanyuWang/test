/**
 * --------------------------------------------------------------------------
 * member-select-modal.js component for select one or multi members
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#member-select-modal-template',
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
            if (selectedIDs && selectedIDs.length) {
                // clear existed selected items
                var selections = $(this.$el).find('table.member-table').bootstrapTable('getAllSelections');
                selections = selections.map(function(value) {
                    return value._id;
                });
                $(this.$el).find('table.member-table').bootstrapTable('uncheckBy', { field: '_id', values: selections });
                // select the pass ones
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
            url: '/api/members?status=active', // only display active members
            locale: 'zh-CN',
            columns: [{}, {}, {}, {
                formatter: vm.creditFormatter
            }]
        });
    }
};