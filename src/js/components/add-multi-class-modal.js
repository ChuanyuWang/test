/**
 * --------------------------------------------------------------------------
 * add-multi-class-modal.js component for add multi classes modal dailog
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#add-multi-class-modal-template',
    props: {
        classrooms: Object // list of available classrooms
    },
    data: function() {
        return {
            date: moment(),
            begin: moment(),
            end: moment(),
            room: '',
            weekdays: [],
            isRepeated: false
        };
    },
    watch: {
        isRepeated : function(newValue) {
            var vm = this;
            if (newValue) {
                $(vm.$el).find('#class_date').data("DateTimePicker").format('LT');
            } else {
                $(vm.$el).find('#class_date').data("DateTimePicker").format('lll');
            }
        }
    },
    computed: {},
    filters: {},
    methods: {
        show: function(value) {
            // TODO, clear error
            $('#add-multi-class-modal').modal('show')
        },
        handleOK : function() {
            console.log(this.date.toString());
            console.log(this.weekdays);
            this.$emit("ok", this.$data);
            $('#add-multi-class-modal').modal('hide')
        }
    },
    mounted: function() {
        // 'this' is refer to vm instance
        var vm = this;
        $(vm.$el).find('#class_date').datetimepicker({
            locale: 'zh-CN',
            format: 'lll'
        });
        $(vm.$el).find('#class_begin').datetimepicker({
            locale: 'zh-CN',
            format: 'll'
        });
        $(vm.$el).find('#class_end').datetimepicker({
            locale: 'zh-CN',
            format: 'll'
        });

        $(vm.$el).find('#class_date').on('dp.change', function(e) {
            // when user clears the input box, the 'e.date' is false value
            vm.date = e.date === false ? null : e.date;
        });
        $(vm.$el).find('#class_begin').on('dp.change', function(e) {
            // when user clears the input box, the 'e.date' is false value
            vm.begin = e.date === false ? null : e.date;
        });
        $(vm.$el).find('#class_end').on('dp.change', function(e) {
            // when user clears the input box, the 'e.date' is false value
            vm.end = e.date === false ? null : e.date;
        });
    }
};