<template lang="pug">
v-container
  v-subheader
    p 光影故事屋播放器端公告管理，发布公告后可以推送到所有播放器端
  v-row.mt-1(dense align="center" justify="end")
    v-btn.ml-2(color='primary' @click.stop="openCreateNoticeDialog()") 创建公告
    v-spacer
    v-btn(color='primary' @click.stop="refresh") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :server-items-length="totalNotice" 
    :loading="isLoading" no-data-text="没有公告" :options.sync="options" :footer-props="{'items-per-page-options': [10,20,50,100]}")
    template(v-slot:item.create_time="{ item }") {{ new Date(item.create_time).toLocaleDateString() }}
    template(v-slot:item.issue_time="{ item }") {{ item.issue_time && new Date(item.issue_time).toLocaleDateString() }}
    template(v-slot:item.status="{ item }")
      v-chip(small v-if="item.status === 'open'" color="warning") 未发布
      v-chip(small v-if="item.status === 'publish'" color="success") 已发布
      v-chip(small v-if="item.status === 'deleted'" color="error") 已删除
    template(v-slot:item.actions="{ item }")
      v-btn.me-1(x-small elevation="0" v-if="item.status==='open'" @click.stop="openEditNoticeDialog(item)") 编辑
      v-btn.me-1(x-small elevation="0" @click.stop="noticeID=item._id,deleteNoticeDialog=true") 删除
      v-btn(x-small elevation="0" v-if="item.status==='open'" @click.stop="noticeID=item._id,publishNoticeDialog=true") 发布
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
  v-dialog(v-model="editNoticeDialog" persistent max-width="600px")
    v-card
      v-card-title
        span.text-h5 修改公告
      v-card-text 
        v-form(v-model="isEditValid")
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
        v-btn(text @click="editNoticeDialog = false") 取消
        v-btn(text color="info" @click="editNotice" :disabled="!isEditValid") 修改
  v-dialog(v-model="publishNoticeDialog" persistent max-width="300px")
    v-card
      v-card-title
        span.text-h5 发布公告
      v-card-text 确定发布该公告吗？发布后无法进行编辑
      v-card-actions
        v-spacer
        v-btn(text @click="publishNoticeDialog = false") 取消
        v-btn(text color="info" @click="publishNotice") 发布
  v-dialog(v-model="deleteNoticeDialog" persistent max-width="300px")
    v-card
      v-card-title
        span.text-h5 删除公告
      v-card-text 确定删除该公告吗？删除操作无法撤销
      v-card-actions
        v-spacer
        v-btn(text @click="deleteNoticeDialog = false") 取消
        v-btn(text color="error" @click="deleteNotice") 删除
</template>

<script>

module.exports = {
  name: "notice",
  data() {
    return {
      valid: false,
      isEditValid: false,
      createNoticeDialog: false,
      editNoticeDialog: false,
      publishNoticeDialog: false,
      deleteNoticeDialog: false,
      noticeID: "",
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
    openCreateNoticeDialog() {
      this.title = "";
      this.content = "";
      this.createNoticeDialog = true;
    },
    createNotice() {
      // create notice
      var request = axios.post("/api/notices", { title: this.title, content: this.content });
      request.then((response) => {
        this.message = "创建公告成功";
        this.snackbar = true;
        this.refresh();
      }).catch((error) => {
        this.message = "创建公告失败";
        this.snackbar = true;
      });
      this.createNoticeDialog = false;
    },
    openEditNoticeDialog(notice) {
      this.noticeID = notice._id;
      this.title = notice.title;
      this.content = notice.content;
      this.editNoticeDialog = true;
    },
    editNotice() {
      // edit notice
      var request = axios.patch("/api/notices/" + this.noticeID, { title: this.title, content: this.content });
      request.then((response) => {
        this.message = "修改公告成功";
        this.snackbar = true;
        this.refresh();
      }).catch((error) => {
        this.message = "修改公告失败";
        this.snackbar = true;
      });
      this.editNoticeDialog = false;
    },
    deleteNotice() {
      // delete notice
      var request = axios.delete("/api/notices/" + this.noticeID);
      request.then((response) => {
        this.message = "删除公告成功";
        this.snackbar = true;
        this.refresh();
      }).catch((error) => {
        this.message = "删除公告失败";
        this.snackbar = true;
      });
      this.deleteNoticeDialog = false;
    },
    publishNotice() {
      // publish notice
      var request = axios.patch("/api/notices/" + this.noticeID, { status: "publish" });
      request.then((response) => {
        this.message = "发布公告成功";
        this.snackbar = true;
        this.refresh();
      }).catch((error) => {
        this.message = "发布公告失败";
        this.snackbar = true;
      });
      this.publishNoticeDialog = false;
    }
  },
  mounted() {
    this.refresh();
  }
}
</script>

<style lang="less">
</style>
