<template lang="pug">
v-container
  v-subheader
    p 光影故事屋播放器端公告管理，发布公告后可以推送到所有播放器端
  v-row.mt-1(dense align="center" justify="end")
    v-btn.ml-2(color='primary' @click="createNoticeDialog = true") 创建公告
    v-spacer
    v-btn(color='primary' @click="refresh") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :server-items-length="totalNotice" 
    :loading="isLoading" no-data-text="没有公告" :options.sync="options")
    template(v-slot:item.create_time="{ item }") {{ new Date(item.create_time).toLocaleString() }}
    template(v-slot:item.issue_time="{ item }") {{ item.issue_time && new Date(item.issue_time).toLocaleString() }}
    template(v-slot:item.status="{ item }") {{ item.status === "open" ? "未发布":"已发布" }}
    template(v-slot:item.actions="{ item }")
      //v-btn-toggle
      v-btn.me-1(x-small elevation="0") 编辑
      v-btn.me-1(x-small elevation="0") 删除
      v-btn(x-small elevation="0" v-if="item.status==='open'") 发布
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
  v-dialog(v-model="createNoticeDialog" persistent max-width="600px")
    v-card
      v-card-title
        span.text-h5 创建公告
      v-card-text 
        v-form(v-model="valid")
          v-container 
            v-row
              v-col(cols="12")
                v-text-field(label="标题" required autofocus v-model="title" counter="128"
                  :rules="[() => !!title || '标题必填']")
            v-row
              v-col(cols="12")
                v-textarea(label="内容" rows="3" outlined required v-model="content" counter="512"
                  :rules="[() => !!content || '内容必填']")
      v-card-actions
        v-spacer
        v-btn(text @click="createNoticeDialog = false") 取消
        v-btn(text color="info" @click="createNotice" :disabled="!valid") 创建
</template>

<script>

module.exports = {
  name: "notice",
  data() {
    return {
      valid: false,
      createNoticeDialog: false,
      title: "",
      content: "",
      snackbar: false,
      message: "公告创建成功",
      isLoading: true,
      headers: [
        { text: '标题', value: 'title', },
        { text: '内容', value: 'content' },
        { text: '创建时间', value: 'create_time' },
        { text: '发布时间', value: 'issue_time' },
        { text: '状态', value: 'status' },
        { text: '操作', value: 'actions', sortable: false }
      ],
      options: {},
      rawData: [],
      totalNotice: 0
    }
  },
  computed: {},
  watch: {
    options: {
      handler() {
        this.isLoading = true;
        this.refresh();
      },
      deep: true
    }
  },
  methods: {
    refresh() {
      this.isLoading = true;
      const { sortBy, sortDesc, page, itemsPerPage } = this.options;
      var params = {
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage
      };
      if (sortBy.length === 1 && sortDesc.length === 1) {
        params.sort = sortBy[0];
        params.order = sortDesc[0] === false ? "asc" : "desc";
      }
      // refresh table data
      var request = axios.get("/api/notices", { params });
      request.then((response) => {
        this.rawData = response.data && response.data.rows || [];
        this.totalNotice = response.data && response.data.total || 0;
      });
      request.finally(() => {
        this.isLoading = false;
      });
    },
    createNotice() {
      // create notice
      var request = axios.post("/api/notices", { title: this.title, content: this.content });
      request.then((response) => {
        this.snackbar = true;
        this.refresh();
      });
      this.createNoticeDialog = false;
    }
  },
  mounted() {
    this.refresh();
  }
}
</script>

<style lang="less">
</style>
