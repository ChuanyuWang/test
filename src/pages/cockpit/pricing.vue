<template lang="pug">
v-container
  v-subheader
    p 光影故事屋片源定价管理，
      |所有片源信息来源于叮聆课堂浏览日志，新片源可能不显示，已经下架或删除片源也会出现在列表中
  v-row(dense align="center" justify="end")
    v-spacer
    v-col(cols="auto")
      v-text-field(v-model="search" prepend-icon="mdi-magnify" label="搜索片源"  hide-details dense clearable)
    //v-col(cols="auto")
      v-autocomplete(:items="contentList" item-text="itemName" dense item-value="contentId" 
        clearable @focus.once="fetchContentList" v-model="selectedContent" @change="refresh" 
        hide-details label="选择片源" prepend-icon="mdi-video-vintage")
    v-col(cols="auto")
      v-btn(color='primary' @click="refresh" :disabled="isLoading") 刷新
  v-data-table(:headers="headers" :items="priceList" :items-per-page="10" :loading="isLoading" 
    no-data-text="无数据" :search="search")
    template(v-slot:item.effective_date="{ item }") {{ item.effective_date ? new Date(item.effective_date).toLocaleDateString() : null }}
    template(v-slot:item.price="{ item }") 
      div(v-if="isNaN(item.price)") <i>未设置</i>
        v-icon.ml-1(small @click.stop="openHistory(item)") mdi-pencil
      div(v-else) {{ item.price /100}}元
        v-icon.ml-1(small @click.stop="openHistory(item)") mdi-pencil
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
  v-dialog(v-model="dialog" max-width="50%")
    v-card
      v-card-title {{editedItem.name}}
      v-card-subtitle 片源历史价格
      v-card-text
        v-data-table(:headers="historyHeaders" :items="priceHistory" :items-per-page="10" 
          :loading="isHisotryLoading" no-data-text="无历史价格" dense :sort-by="['effective_date']")
          template(v-slot:item.effective_date="{ item }") {{ item.effective_date ? new Date(item.effective_date).toLocaleDateString() : null }}
          template(v-slot:item.price="{ item }") {{ item.price /100 }}元
          template(v-slot:item.actions="{ item }")
            v-btn(icon small v-if="new Date() < new Date(item.effective_date)" @click="confirmDeletePrice(item)")
              v-icon(small) mdi-delete
          template(v-slot:item.isEffective="{ item }")
            v-chip(small v-if="item.price === current_price.price && item.effective_date === current_price.effective_date" color="success") 生效中
            v-chip(small v-else-if="new Date() < new Date(item.effective_date)" color="warning") 未生效
            v-chip(small v-else color="text") 已失效
        v-form(ref="priceForm" v-model="valid")
          v-row.justify-end
            v-col(cols="auto")
              v-menu(v-model="menu1" :close-on-content-click="false" :nudge-right="-100" offset-x min-width="auto")
                template(v-slot:activator="{ on, attrs }")
                  v-text-field(v-model="editedItem.effective_date" label="生效日期"
                    readonly v-bind="attrs" v-on="on" dense :rules="[rules.valid_date, rules.unique_date]")
                v-date-picker(v-model="editedItem.effective_date" @input="menu1 = false" :min="tomorrow")
            v-col(cols="auto")
              v-text-field(type="number" v-model.number="editedItem.price" label="价格" suffix="元"
                :rules="[rules.required, rules.positive]" hint="设置后，点击添加价格" dense)
            v-col(cols="auto")
              v-btn(type="button" color="primary" :disabled="!valid" @click="addPrice" :loading="isAddingPrice") 添加价格
      v-card-actions
        small.caption 无法修改已失效或生效中的价格
        v-spacer
        v-btn(text color="primary" @click="dialog = false" :loading="isHisotryLoading") 关闭
  v-dialog(v-model="dialogDeletePrice" persistent max-width="300px")
    v-card
      v-card-title
        span.text-h5 删除价格
      v-card-text 确定删除该价格吗？删除操作无法撤销
      v-card-actions
        v-spacer
        v-btn(text @click="dialogDeletePrice = false") 取消
        v-btn(text color="error" @click="removePrice") 删除
</template>

<script>

module.exports = {
  name: "pricing",
  data() {
    return {
      snackbar: false,
      message: "",
      selectedContent: "",
      isLoading: true,
      search: "",
      headers: [
        { text: '片源ID', value: 'contentId', sortable: false },
        { text: '片源名称', value: 'itemName', sortable: true },
        { text: '生效日期', value: 'effective_date', sortable: true },
        { text: '当前价格', value: 'price', sortable: true }
      ],
      priceList: [],
      editedItem: {},
      editedIndex: -1,
      dialog: false,
      dialogLoading: false,
      valid: true,
      rules: {
        required: value => value !== "" || '价格不能为空',
        positive: value => value >= 0 || '价格不能为负',
        valid_date: value => moment(value).isValid() || '请选择日期',
        unique_date: value => {
          var duplicate = this.priceHistory.some(v => { return moment(v.effective_date).isSame(value, 'day') });
          return !duplicate || '生效日期重复'
        }
      },
      priceHistory: [],
      current_price: {},
      isHisotryLoading: false,
      tomorrow: moment().add(1, 'day').startOf('day').format('YYYY-MM-DD'),
      new_price: "",
      new_effective_date: null,
      menu1: false,
      isAddingPrice: false,
      historyHeaders: [
        { text: '生效日期', value: 'effective_date', sortable: true },
        { text: '价格', value: 'price', sortable: false },
        { text: '是否有效', value: 'isEffective', sortable: false },
        { text: '操作', value: 'actions', sortable: false, align: 'center' }
      ],
      dialogDeletePrice: false,
      delete_price: {}
    }
  },
  computed: {},
  methods: {
    refresh() {
      this.isLoading = true;
      // refresh table data
      var request = axios.get("/api/dlktlogs/prices", { params: { fromContentId: this.selectedContent || undefined } });
      request.then((response) => {
        this.priceList = (response.data || []).map((value, index, array) => {
          return {
            contentId: value._id,
            itemName: value.itemName,
            price: value.prices.length > 0 ? value.prices[0].price : NaN,
            effective_date: value.prices.length > 0 ? value.prices[0].effective_date : null
          }
        });
      }).catch((error) => {
        // TODO, append the error message returned from server
        this.message = "获取价格失败";
        this.snackbar = true;
      }).finally(() => {
        this.isLoading = false;
      });
    },
    openHistory(item) {
      this.editedIndex = this.priceList.indexOf(item);
      this.editedItem.fromContentId = item.contentId;
      this.editedItem.name = item.itemName;
      // reset the new price
      this.editedItem.price = "";
      this.editedItem.effective_date = null;
      // remove the price history of selected content
      this.isHisotryLoading = true;
      this.priceHistory = [];
      this.dialog = true;
      this.$nextTick(() => {
        //this.$refs.priceForm.validate(); // force validate for the first time
      });

      // load price history of selected content
      var request = axios.get("/api/dlktlogs/prices/" + this.editedItem.fromContentId);
      request.then((response) => {
        this.priceHistory = response.data || [];
        this.findEffectivePrice(this.priceHistory);
      }).catch((error) => {
        // TODO, append the error message returned from server
      }).finally(() => {
        this.isHisotryLoading = false;
      });
    },
    addPrice(item) {
      var newPrice = {
        contentId: this.editedItem.fromContentId,
        price: Math.round(this.editedItem.price * 100),
        effective_date: new Date(this.editedItem.effective_date + " GMT+0800").toISOString()
      };

      this.isAddingPrice = true;
      var request = axios.post("/api/dlktlogs/prices/", newPrice);
      request.then((response) => {
        if (response.data) {
          newPrice._id = response.data._id;
          this.priceHistory.push(newPrice);
          this.message = "添加价格成功";
          this.snackbar = true;
        } else {
          // TODO, handle unknown case
          this.message = "添加价格失败";
          this.snackbar = true;
        }
      }).catch((error) => {
        // TODO, append the error message returned from server
        this.message = "添加价格失败";
        this.snackbar = true;
      }).finally(() => {
        this.isAddingPrice = false;
        this.$nextTick(() => {
          this.$refs.priceForm.validate(); // force validate current effective date/price
        });
      });
    },
    confirmDeletePrice(item) {
      this.delete_price = item;
      this.dialogDeletePrice = true;
    },
    removePrice() {
      var request = axios.delete("/api/dlktlogs/prices/" + this.delete_price._id, { data: this.delete_price });
      request.then((response) => {
        // remove deleted price
        var index = this.priceHistory.indexOf(this.delete_price)
        this.priceHistory.splice(index, 1);
        this.message = "删除价格成功";
        this.snackbar = true;
      }).catch((error) => {
        // TODO, append the error message returned from server
        this.message = "删除价格失败";
        this.snackbar = true;
      }).finally(() => {
        this.delete_price = {};
        this.dialogDeletePrice = false;
        this.$nextTick(() => {
          this.$refs.priceForm.validate(); // force validate current effective date/price
        });
      });
    },
    findEffectivePrice(prices) {
      this.current_price = {};
      var min_diff = Number.MAX_VALUE;
      var today = moment();
      (prices || []).forEach(value => {
        var diff = today.diff(new Date(value.effective_date));
        if (diff > 0 && diff < min_diff) {
          this.current_price = value;
        }
      });
    }
  },
  mounted() {
    this.refresh();
  }
}
</script>

<style lang="less">
</style>
