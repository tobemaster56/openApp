<template>
  <div class="home">
    <el-dialog
      :visible.sync="dialogVisible"
      width="500px"
      title="添加链接"
      @open="handleOpen"
    >
      <el-form
        label-width="90px"
        label-position="right"
        size="small"
        :model="formModel"
        ref="form"
        :rules="rules"
      >
        <el-form-item label="链接文本 ">
          <el-input v-model="formModel.text" class="input-with-select">
          </el-input>
        </el-form-item>
        <el-form-item label="链接地址" prop="href">
          <el-input v-model="formModel.href" class="input-with-select">
            <el-select
              v-model="formModel.protocol"
              slot="prepend"
              placeholder="请选择"
            >
              <el-option label="http://" value="http://"></el-option>
              <el-option label="https://" value="https://"></el-option>
            </el-select>
          </el-input>
        </el-form-item>
        <el-form-item label="指定浏览器">
          <el-radio-group v-model="formModel.app">
            <el-radio-button label="iexplore">IE</el-radio-button>
            <el-radio-button label="chrome">Chrome</el-radio-button>
            <el-radio-button label="firefox">Firefox</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleSubmit" size="small"
          >确 定 [ enter ]</el-button
        >
        <el-button @click="dialogVisible = false" size="small"
          >取 消 [ esc ]</el-button
        >
      </span>
    </el-dialog>
    <el-dialog
      :visible.sync="checkDialogVisible"
      width="500px"
      title="注意"
      @open="handleOpen"
    >
      <p>
        该链接需要用 {{ browser }}打开，但本机未在默认地址发现{{
          browser
        }},若您安装在非默认地址，请指定
      </p>
      <el-form
        label-width="90px"
        label-position="right"
        size="small"
        :model="formModel"
        ref="form"
        :rules="rules"
      >
        <el-form-item label="安装地址 ">
          <el-input v-model="browserPath" class="input-with-select"> </el-input>
          <i class="el-icon-folder" @click="selectBrowser"></i>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleSubmit" size="small"
          >确 定 [enter]</el-button
        >
        <el-button @click="dialogVisible = false" size="small"
          >取 消 [esc]</el-button
        >
      </span>
    </el-dialog>
    <el-button
      size="mini"
      v-for="(link, index) in linkList"
      :key="index"
      @click="openLink(link)"
    >
      {{ link.text }}
    </el-button>
    <el-button @click="dialogVisible = true">添加链接</el-button>
  </div>
</template>

<script>
// @ is an alias to /src
import open from 'open'
const { ipcRenderer, remote } = require('electron')
export default {
  name: 'Home',
  components: {},
  data() {
    return {
      linkList: [],
      formModel: {
        href: '',
        text: '',
        app: 'iexplore',
        protocol: 'https://',
      },
      rules: {
        href: [{ required: true, message: '请输入链接地址', trigger: 'blur' }],
      },
      dialogVisible: false,

      checkDialogVisible: false,
      location: {
        chrome: null,
        firefox: null,
        iexplore: true,
      },
      browser: '',
      browserPath: '',
    }
  },
  mounted() {
    const location = ipcRenderer.sendSync('checkBrowser')
    this.location = Object.assign(this.location, {
      chrome: typeof location.chrome === 'string' && location.chrome,
      firefox: typeof location.firefox === 'string' && location.firefox,
    })
  },
  methods: {
    selectBrowser() {
      remote.dialog
        .showOpenDialog(remote.getCurrentWindow(), {
          properties: ['openFile'],
        })
        .then(result => {
          if (result.filePaths.length) {
            console.log(result.filePaths[0])
            this.browserPath = result.filePaths[0]
          }
        })
        .catch(err => {
          console.log(err)
        })
    },
    openLink(link) {
      const app = link.app || 'iexplore'
      if (!this.location[app]) {
        this.checkDialogVisible = true
        this.browser = app
      } else {
        open(link.protocol + link.href, { app })
      }
    },
    handleOpen() {
      this.$nextTick(() => {
        this.$refs.form.resetFields()
        this.formModel.app = 'iexplore'
        this.formModel.protocol = 'https://'
      })
    },
    handleSubmit() {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.linkList.push({ ...this.formModel })
          this.dialogVisible = false
        }
      })
    },
  },
}
</script>
<style>
.el-select .el-input {
  width: 90px;
}
.input-with-select .el-input-group__prepend {
  background-color: #fff;
}
</style>
