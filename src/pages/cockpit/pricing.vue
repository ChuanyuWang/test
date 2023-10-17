<template lang="pug">
v-container
  v-subheader
    p 光影故事屋片源定价管理，
      |所有片源信息来源于叮聆课堂浏览日志，新片源可能不显示，已经下架或删除片源也会出现在列表中
  v-row.mt-1(dense align="center" justify="end")
    v-col(cols="auto")
      span.ml-2 选择片源:
    v-col(cols="auto")
      v-autocomplete(:items="contentList" item-text="itemName" item-value="contentId" clearable
        @focus.once="fetchContentList" v-model="selectedContent" @change="refresh")
    v-spacer
    v-col(cols="auto")
      v-btn(color='primary' @click="refresh") 刷新
  v-data-table(:headers="headers" :items="priceList" :items-per-page="10" :loading="isLoading" no-data-text="无数据")
    template(v-slot:item.price="{ item }") {{ item.price / 100 }}元
      v-icon.ml-1(small @click.stop="editPrice(item)") mdi-pencil
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
  v-dialog(v-model="dialog" max-width="450")
    v-card
      v-card-title 修改片源价格
      v-card-text
        v-form(v-model="valid")
          v-row
            v-col(sm="8")
              v-text-field(v-model="editedItem.name" readonly label="名称")
            v-col(sm="4")
              v-text-field(type="number" v-model.number="editedItem.price" label="价格" suffix="元"
                :rules="[rules.required, rules.positive]")
      v-card-actions
        v-spacer
        v-btn(text color="primary" @click="dialog = false") 关闭
        v-btn(text color="primary" @click="updatePrice" :disabled="!valid") 保存
</template>

<script>

module.exports = {
  name: "pricing",
  data() {
    return {
      snackbar: false,
      message: "",
      contentList: [],
      selectedContent: "",
      isLoading: true,
      headers: [
        { text: '片源ID', value: 'contentId', sortable: false },
        { text: '片源名称', value: 'itemName', sortable: false },
        { text: '价格', value: 'price', sortable: false }
      ],
      priceList: [],
      editedItem: {},
      editedIndex: -1,
      dialog: false,
      valid: true,
      rules: {
        required: value => value !== "" || '价格不能为空',
        positive: value => value >= 0 || '价格不能为负'
      }
    }
  },
  computed: {},
  methods: {
    refresh() {
      this.isLoading = true;
      // refresh table data
      var request = axios.get("/api/dlktlogs/prices", { params: { fromContentId: this.selectedContent } });
      request.then((response) => {
        this.priceList = (response.data || []).map((value, index, array) => {
          return {
            contentId: value._id,
            itemName: value.itemName,
            price: value.prices.length > 0 ? value.prices[0].price : 0
          }
        });
      });
      request.finally(() => {
        this.isLoading = false;
      });
    },
    editPrice(item) {
      this.editedIndex = this.priceList.indexOf(item);
      this.editedItem.fromContentId = item.contentId;
      this.editedItem.name = item.itemName;
      this.editedItem.price = item.price / 100;
      this.dialog = true;
    },
    updatePrice() {
      var newPrice = Math.round(this.editedItem.price * 100);
      var request = axios.put("/api/dlktlogs/prices/" + this.editedItem.fromContentId, {
        price: newPrice
      });
      request.then((response) => {
        if (this.editedIndex > -1) {
          Object.assign(this.priceList[this.editedIndex], { price: newPrice })
        }
        this.message = "价格修改成功";
        this.snackbar = true;
      });
      request.finally(() => {
        this.dialog = false;
      });
    },
    fetchContentList() {
      var request = axios.get("/api/dlktlogs/content/list");
      request.then((response) => {
        this.contentList = (response.data || []).map((value, index, array) => {
          return {
            itemName: value.itemName,
            contentId: value._id
          }
        });
        this.contentList.push({ itemName: "全部", contentId: "" })
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
