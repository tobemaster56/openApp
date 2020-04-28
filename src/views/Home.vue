<template>
  <div class="home">
    <el-dialog
      :visible.sync="dialogVisible"
      width="500px"
      title="添加应用"
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
          >确 定</el-button
        >
        <el-button @click="dialogVisible = false" size="small">取 消</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :visible.sync="checkDialogVisible"
      width="500px"
      title="注意"
      @open="handleOpen"
    >
      <p>
        该链接需要用
        <svg-icon :icon-class="browser"></svg-icon> 打开，但本机未在默认地址发现
        <svg-icon :icon-class="browser"></svg-icon>
        ,若您安装在非默认地址，请指定
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
          <el-input
            v-model="browserPath"
            class="input-with-select path"
            @click.native="selectBrowser"
            readonly
          >
            <i slot="suffix" class="el-icon-folder"></i>
          </el-input>
        </el-form-item>
      </el-form>
      <div>
        <span>或者，通过以下地址下载安装程序</span>
        <div>
          <p>
            <svg-icon
              :icon-class="browser"
              style="font-size: 20px;"
              @click.native="download"
            ></svg-icon>
          </p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleCheck" size="small"
          >确 定</el-button
        >
        <el-button @click="checkDialogVisible = false" size="small"
          >取 消</el-button
        >
      </span>
    </el-dialog>

    <div class="container">
      <div>
        <div>应用列表</div>
        <ul>
          <li
            v-for="(link, index) in linkList"
            :key="index"
            @click="openLink(link)"
          >
            <div>
              <svg-icon :icon-class="link.app"></svg-icon>
              <span>{{ link.text }}</span>
            </div>
            <svg-icon
              :icon-class="link.loved ? 'loved' : 'unlove'"
              class="right"
              @click.native.stop="toggleLoved(link)"
            ></svg-icon>
          </li>
        </ul>

        <el-button @click="dialogVisible = true">添加应用</el-button>
      </div>
      <div>
        <div>我收藏的应用</div>
        <ul>
          <li
            v-for="(link, index) in lovedApps"
            :key="index"
            @click="openLink(link)"
          >
            <div>
              <svg-icon :icon-class="link.app"></svg-icon>
              <span>{{ link.text }}</span>
            </div>
            <i class="el-icon-delete right" @click="link.loved = false"></i>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import open from 'open'
const { ipcRenderer, remote, shell } = require('electron')
export default {
  name: 'Home',
  components: {},
  data() {
    return {
      linkList: [
        {
          href: 'https://www.baidu.com',
          text: '百度',
          app: 'chrome',
          loved: true,
        },
        {
          href: 'https://www.tencent.com',
          text: '腾讯',
          app: 'firefox',
          loved: false,
        },
        {
          href: 'https://www.sina.com',
          text: '新浪',
          app: 'iexplore',
          loved: false,
        },
      ],
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
        iexplore: null,
      },
      browser: '',
      browserPath: '',
    }
  },
  computed: {
    lovedApps() {
      return this.linkList.filter(link => link.loved)
    },
  },
  mounted() {
    const location = ipcRenderer.sendSync('checkBrowser')
    this.location = Object.assign(this.location, {
      chrome: typeof location.chrome === 'string' && location.chrome,
      firefox: typeof location.firefox === 'string' && location.firefox,
    })
  },
  methods: {
    download() {
      let url
      switch (this.browser) {
        case 'chrome ':
          url = 'https://www.google.com/intl/zh-CN/chrome/'
          break
        case 'firefox':
          url = 'https://www.mozilla.org/zh-CN/firefox/new/'
          break
        default:
          url =
            'https://www.microsoft.com/en-us/download/internet-explorer.aspx'
      }
      shell.openExternal(url)
    },
    toggleLoved(link) {
      link.loved = !link.loved
    },
    handleCheck() {},
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
<style lang="less">
.el-select .el-input {
  width: 90px;
}
.input-with-select .el-input-group__prepend {
  background-color: #fff;
}
.input-with-select.path input {
  cursor: pointer;
}
ul {
  padding: 0;
}
li {
  padding-left: 10px;
  list-style: none;
  line-height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .right {
    display: none;
  }
  &:hover {
    background-color: #eee;
    .right {
      display: block;
    }
  }
  svg {
    margin-right: 10px;
  }
}

.container {
  display: flex;
  justify-content: center;
  > div {
    width: 200px;
  }
}
</style>
