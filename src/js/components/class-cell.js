/**
 * --------------------------------------------------------------------------
 * class-cell.js component for home page
 * --------------------------------------------------------------------------
 */

module.exports = function() {
    // register the class list in table
    Vue.component('class-list', {
        template: '#classlist-template',
        props: {
            data: Array // array of class object
        },
        data: function() {
            return {
            };
        },
        computed: {},
        filters: {
            displayTime: function(date) {
                return moment(date).format('HH:mm');
            }
        },
        methods: {}
    });
};
