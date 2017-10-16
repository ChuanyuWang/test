<style>

</style>

<template lang="jade">
div.input-group.date
  input.form-control(type="text",
        :class="inputClass",
        :id="id",
        :name="name",
        :placeholder="placeholder",
        :required="required",
        :readOnly="readOnly",
        :disabled="disabled")
  span.input-group-addon
    span.glyphicon.glyphicon-calendar
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * date-picker.vue component for input date/time
 * --------------------------------------------------------------------------
 */

module.exports = {
  template: '#date-picker-template',
  props: {
    value: {
      default: null,
      required: true,
      validator: function(value) {
        return value === null || value instanceof Date || typeof value === 'string' || value instanceof String || value instanceof moment
      }
    },
    // http://eonasdan.github.io/bootstrap-datetimepicker/Options/
    config: {
      type: Object,
      default: function (){ return {"format": "ll", "locale": "zh-CN"}}
    },
    placeholder: {
      type: String,
      default: ''
    },
    inputClass: {
      type: [String, Object],
      default: ''
    },
    name: {
      type: String,
      default: 'datetime'
    },
    required: {
      type: Boolean,
      default: false
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    id: {
      type: String
    },
  },
  data: function() {
    return {
      dp: null,
    };
  },
  mounted: function() {
    // Return early if date-picker is already loaded
    if (this.dp) return;
    // Init date-picker
    var $elem = $(this.$el);
    $elem.datetimepicker(this.config);
    // Store data control
    this.dp = $elem.data('DateTimePicker');
    // Set initial value
    this.dp.date(moment(this.value));
    // Watch for changes
    $elem.on('dp.change', this.onChange);
  },
  beforeDestroy: function() {
    // Free up memory
    if (this.dp) {
      this.dp.destroy();
      this.dp = null;
    }
  },
  watch: {
    /**
     * Listen to change from outside of component and update DOM
     *
     * @param newValue
     */
    value: function(newValue) {
      this.dp && this.dp.date(newValue || null)
    },
    /**
     * Watch for any change in options and set them
     *
     * @param newConfig Object
     */
    config: function(newConfig) {
      this.dp && this.dp.options(Object.assign(this.dp.options(), newConfig));
    }
  },
  methods: {
    /**
     * Update v-model upon change triggered by date-picker itself
     *
     * @param event
     */
    onChange: function(event) {
      this.$emit('input', event.date || null);
    }
  }
};
</script>