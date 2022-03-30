<template lang="pug">
// add class 'date' to change the cursor as hand
div.input-group.date(:id="id",:class="inputClass")
  span.input-group-addon(v-if="label") {{label}}
  input.form-control(type="text",
        :name="name",
        :placeholder="placeholder",
        :required="required",
        :readOnly="readOnly",
        :disabled="disabled",
        autocomplete="off")
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
  props: {
    label: {
      default: "",
      required: false
    },
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
      default: function() { return { "format": "ll", "locale": "zh-CN" } }
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
    $(this.$el).off();
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
      if (this.dp) {
        // if the new value is null, clear the input text manually, because date(null) function doesn't clear previous value
        if (newValue === null) this.dp.clear();
        else this.dp.date(moment(newValue || null));
      }
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
     * Or when value property is set
     *
     * @param event
     */
    onChange: function(event) {
      this.$emit('input', event.date || null);
    }
  }
};
</script>

<style lang='less'>
</style>
