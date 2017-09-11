/**
 * --------------------------------------------------------------------------
 * member-select-modal.js component for select one or multi members
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#member-select-modal-template',
    props: {
        multiSelection : {
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
            if (selectedIDs && selectedIDs.length)
                $(this.$el).find('table').bootstrapTable('checkBy', { field: '_id', values: selectedIDs });
            $(this.$el).modal('show');
        },
        handleOK: function() {
            $(this.$el).modal('hide');
            var selections = $(this.$el).find('table').bootstrapTable('getAllSelections');
            this.$emit("ok", selections);
        },
        creditFormatter: function(value, row, index) {
            var membership = row.membership;
            if (membership && membership[0]) {
                // A better way of 'toFixed(1)'
                if (typeof (membership[0].credit) == 'number') {
                    return Math.round(membership[0].credit * 10) / 10;
                } else {
                    return membership[0].credit;
                }
            } else {
                return undefined;
            }
        }
    },
    mounted: function() {
        $(this.$el).find('table').bootstrapTable({
            url: '/api/members?status=active',
            locale: 'zh-CN',
            columns: [{}, {}, {}, {
                formatter: this.creditFormatter
            }]
        });
    }
};