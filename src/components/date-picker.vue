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

 export default {
  props: {
    label: {
      type: String,
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
      // have to set the locale explicitly, because date-picker load default config before moment locale is set
      default: function() { return {"format": "ll", locale: moment.locale()} }
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
      type: String,
      default: ""
    },
  },
  data: function() {
    return {
      dp: null,
    };
  },
  watch: {
    /**
     * Listen to change from outside of component and update DOM
     *
     * @param newValue
     */
    value: function(newValue, oldValue) {
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
  mounted: function() {
    // Return early if date-picker is already loaded
    if (this.dp) return;
    // Init date-picker
    var $elem = $(this.$el);
    $elem.datetimepicker(this.config);
    // Store data control
    this.dp = $elem.data('DateTimePicker');
    if (!this.config.locale) {
      // set locale if not defined
      this.dp.locale(moment.locale());
    }
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
  methods: {
    /**
     * Update v-model upon change triggered by date-picker itself
     *
     * @param event
     */
    onChange: function(event) {
      // do not emit 'input' event when value property is set from parent component
      if (moment(event.date).isSame(this.value)) return;
      this.$emit('input', event.date || null);
    }
  }
};
</script>

<style lang='less'></style>
