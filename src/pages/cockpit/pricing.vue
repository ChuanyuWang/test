<template lang="pug">
v-container
  v-subheader
    p 光影故事屋片源定价管理，
      |所有片源信息来源于叮聆课堂浏览日志，新片源可能不显示，已经下架或删除片源也会出现在列表中
  v-row(dense align="center" justify="end")
    v-col(cols="auto")
      v-autocomplete.ml-3(:items="contentList" item-text="itemName" dense item-value="contentId" clearable
        @focus.once="fetchContentList" v-model="selectedContent" @change="refresh" label="选择片源")
    v-spacer
    v-col(cols="auto")
      v-btn(color='primary' @click="refresh") 刷新
  v-data-table(:headers="headers" :items="priceList" :items-per-page="10" :loading="isLoading" no-data-text="无数据")
    template(v-slot:item.price="{ item }") 
      div(v-if="isNaN(item.price)") <i>未设置</i>
        v-icon.ml-1(small @click.stop="editPrice(item)") mdi-pencil
      div(v-else) {{ item.price /100}}元
        v-icon.ml-1(small @click.stop="editPrice(item)") mdi-pencil
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
  v-dialog(v-model="dialog" max-width="400")
    v-card
      v-card-title {{editedItem.name}}
      v-card-subtitle 修改片源价格
      v-card-text
        v-form(ref="priceForm" v-model="valid")
          v-row
            v-col(sm="6")
              v-text-field(type="number" v-model.number="editedItem.price" label="价格" suffix="元"
                :rules="[rules.required, rules.positive]" hint="修改好价格后，请点击保存")
      v-card-actions
        small.caption 价格保存后立即生效，无法撤消
        v-spacer
        v-btn(text color="primary" @click="dialog = false") 关闭
        v-btn(text color="primary" @click="updatePrice" :disabled="!valid" :loading="dialogLoading") 保存
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
      dialogLoading: false,
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
            price: value.prices.length > 0 ? value.prices[0].price : NaN
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
      this.editedItem.price = isNaN(item.price) ? "" : item.price / 100;
      this.dialog = true;
      this.$nextTick(() => {
        this.$refs.priceForm.validate(); // force validate for the first time
      });
    },
    updatePrice() {
      this.dialogLoading = true;
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
        this.dialogLoading = false;
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

<style lang="less"></style>
