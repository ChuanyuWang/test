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
            return {};
        },
        computed: {},
        filters: {
            displayTime: function(date) {
                return moment(date).format('HH:mm');
            }
        },
        methods: {
            reservation: function(cItem) {
                if (cItem) {
                    var booking = cItem.booking || [];
                    if (booking.length === 0) return 0;
                    else {
                        var reservation = 0;
                        booking.forEach(function(val, index, array) {
                            reservation += (val.quantity || 0);
                        });
                        return reservation;
                    }
                } else {
                    return undefined;
                }
            },
            books: function(cItem) {
                var books = cItem.books || [];
                return books.length;
            }
        }
    });
};
