<template lang="pug">
v-container
  v-subheader
    p 光影故事屋片源定价管理，
      |所有片源信息来源于叮聆课堂浏览日志，新片源可能不显示，已经下架或删除片源也会出现在列表中
  v-row.mt-1(dense align="center" justify="end")
    v-col(cols="auto")
      span 选择片源:
    v-col(cols="auto")
      v-autocomplete(:items="contentList" item-text="itemName" item-value="contentId" clearable
        @focus.once="fetchContentList" v-model="selectedContent" @change="refresh")
    v-spacer
    v-col(cols="auto")
      v-btn(color='primary' @click="refresh") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :loading="isLoading" no-data-text="无数据")
    template(v-slot:item.prices="{ item }") {{ item.prices.length > 0 ? item.prices[0].price/100 : 0 }}元
      v-icon.ml-1(small @click="editPrice(item)") mdi-pencil
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
</template>

<script>

module.exports = {
  name: "pricing",
  data() {
    return {
      snackbar: false,
      contentList: [],
      selectedContent: "",
      isLoading: true,
      headers: [
        { text: '片源ID', value: '_id', sortable: false },
        { text: '片源名称', value: 'itemName', sortable: false },
        { text: '价格', value: 'prices', sortable: false }
      ],
      rawData: [],
      editedItem: null,
      editedIndex: -1,
      dialog: false
    }
  },
  computed: {},
  methods: {
    refresh() {
      this.isLoading = true;
      // refresh table data
      var request = axios.get("/api/dlktlogs/prices", { params: { fromContentId: this.selectedContent } });
      request.then((response) => {
        this.rawData = response.data || [];
      });
      request.finally(() => {
        this.isLoading = false;
      });
    },
    editPrice(item) {
      this.editedIndex = this.rawData.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
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
