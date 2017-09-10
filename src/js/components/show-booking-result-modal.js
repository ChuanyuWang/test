/**
 * --------------------------------------------------------------------------
 * show-booking-result-modal.js component for display the booking result
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#show-booking-result-modal-template',
    props: {
    },
    data: function() {
        return {
            result: {} // the result of adding members/classes into course
        };
    },
    watch: {
    },
    computed: {
        newBookingCount: function() {
            var count = 0;
            var classSummary = this.result.classSummary || {};
            Object.keys(classSummary).forEach(function(classID) {
                var res = classSummary[classID];
                count += res.newbookings.length;
            });
            return count;
        },
        failBookingCount: function() {
            var count = 0;
            var memberSummary = this.result.memberSummary || {};
            Object.keys(memberSummary).forEach(function(memberID) {
                var res = memberSummary[memberID];
                count += res.errors.length;
            });
            return count;
        }
    },
    filters: {
        getMemberName: function(value, result) {
            var memberSummary = result.memberSummary || {};
            if (!value) return ''
            return memberSummary[value].name;
        }
    },
    methods: {
        show: function(result) {
            this.result = result || {};
            $(this.$el).modal('show');
        }
    },
    mounted: function() {
    }
};