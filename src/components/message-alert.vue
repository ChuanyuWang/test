<template lang="pug">
transition(name="alert-fade")
  div.alert.alert-bottom-center(style="width: 50%", :class="alertStyle" v-if="message")
    button.close(type="button" @click="closeAlert") &times;
    strong.me-3 {{ messageHeader }}!
    span(v-html="message")
</template>

<script>
export default {
  name: "message-alert",
  components: {},
  props: {},
  data() {
    return {
      timeoutID: null,
      message: "",
      messageType: "success" // success|info|warning|danger
    };
  },
  computed: {
    alertStyle() {
      return {
        "alert-success": this.messageType == "success",
        "alert-danger": this.messageType == "danger",
        "alert-info": this.messageType == "info",
        "alert-warning": this.messageType == "warning"
      }
    },
    messageHeader() {
      switch (this.messageType) {
        case "success":
          return "操作完成"
        case "danger":
          return "操作出错"
        case "info":
          return "提示信息";
        case "warning":
          return "警告注意";
        default:
          return "";
      }
    }
  },
  mounted() { },
  created() { },
  methods: {
    closeAlert() {
      this.message = "";
    },
    showMessage(message, type, fadeOut) {
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.message = message;
      this.messageType = type;
      if (fadeOut === true) {
        this.timeoutID = setTimeout(message => {
          this.message = "";
        }, 3000);
      }
    },
    showSuccessMessage(message, fadeOut) {
      this.showMessage(message, "success", fadeOut === undefined ? true : fadeOut);
    },
    showErrorMessage(message, fadeOut) {
      this.showMessage(message, "danger", fadeOut === undefined ? false : fadeOut);
    },
    showInfoMessage(message, fadeOut) {
      this.showMessage(message, "info", fadeOut === undefined ? true : fadeOut);
    },
    showWarningMessage(message, fadeOut) {
      this.showMessage(message, "warning", fadeOut === undefined ? false : fadeOut);
    },
  },
}
</script>

<style lang="less" scoped>
.alert-bottom-center {
  position: fixed;
  left: 50%;
  bottom: 7px;
  z-index: 100;
  transform: translateX(-50%);
}

.alert-fade-enter-active {
  transition: opacity 0.3s;
  transition: bottom 0.3s;
}

.alert-fade-leave-active {
  //transition: opacity 2.5s;
  transition: all 1.5s;
}

.alert-fade-enter,
.alert-fade-leave-to {
  //transform: translateY(-50px);
  opacity: 0;
  bottom: -100px;
}
</style>
