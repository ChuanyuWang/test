/**
 * --------------------------------------------------------------------------
 * view-member-course-modal.js modal dailog for view member's classes of one course
 * --------------------------------------------------------------------------
 */

// the element ID of modal dialog
var elementID = '#view-member-course-modal';

module.exports = {
    template: '#view-member-course-modal-template',
    props: {
        courseid: String // course id
    },
    data: function() {
        return {
            name: '' // member name
        };
    },
    watch: {},
    computed: {},
    filters: {},
    methods: {
        show: function(value) {
            // TODO, clear error
            $(elementID).modal('show');
        },
        handleOK: function() {
            if (this.isValid) {
                this.$emit("ok", this.$data);
                $(elementID).modal('hide');
            }
        }
    },
    mounted: function() {
        // 'this' is refer to vm instance
        //var vm = this;
    }
};