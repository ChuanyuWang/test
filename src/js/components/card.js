/**
 * --------------------------------------------------------------------------
 * card.js component for membership card
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#card-template',
    props: {
        index: Number, // index of membership card
        item: Object // object of membership card object
    },
    data: function() {
        return {
            delta: 0,
            type: this.item.type,
            // Fix a bug, there is some invalid date which has boolean value
            room: typeof (this.item.room) === 'boolean' ? [] : this.item.room,
            expire: this.item.expire ? moment(this.item.expire) : null
        };
    },
    watch: {
        'item': function() {
            this.delta = 0;
        }
    },
    computed: {
        expireDate: function() {
            return this.expire ? this.expire.format('ll') : null;
        },
        isLimitedCard: function() {
            return this.type === 'LIMITED';
        },
        errors: function() {
            var errors = {};
            if (typeof (this.delta) !== 'number')
                errors.delta = '增加/减少的课时数不正确';
            if (!this.expire || !this.expire.isValid())
                errors.expire = '请指定会员有效期';
            if (!this.type)
                errors.type = '请选择会员卡类型';
            return errors;
        },
        hasError: function() {
            var errors = this.errors
            return Object.keys(errors).some(function(key) {
                return true;
            })
        }
    },
    filters: {
        formatCredit: function(value) {
            return Math.round(value * 10) / 10;
        }
    },
    methods: {
        alterCharge: function(value) {
            if (typeof (this.delta) !== 'number') {
                this.delta = parseFloat(this.delta) || 0;
            }
            this.delta += value;
        },
        onSave: function() {
            if (this.hasError) return;
            var toBeSaved = {
                "type": this.type,
                "room": this.room,
                "expire": this.expire && this.expire.toISOString(),
                "credit": this.item.credit + this.delta
            };
            this.$emit("save", toBeSaved, this.index);
        }
    },
    mounted: function() {
        var vm = this;
        $(this.$el).find('#expire_date').datetimepicker({
            format: 'll',
            locale: 'zh-CN'
        });
        $(this.$el).find('#expire_date').on('dp.change', function(e) {
            // update the expire value from datetimepicker control event
            // when user clears the input box, the 'e.date' is false value
            vm.expire = e.date === false ? null : e.date;
        });
    }
};