'use strict'

import { app, protocol, BrowserWindow, Menu } from 'electron'
const { ipcMain } = require('electron')
const { checkForUpdates } = require('./updater')

ipcMain.on('checkBrowser', event => {
  event.returnValue = {
    chrome: require('chrome-location'),
    firefox: require('firefox-location'),
  }
})

import {
  createProtocol,
  installVueDevtools,
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

let template = [
  {
    label: '查看',
    submenu: [
      {
        label: '重载',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow) {
            // 重载之后, 刷新并关闭所有的次要窗体
            if (focusedWindow.id === 1) {
              BrowserWindow.getAllWindows().forEach(function(win) {
                if (win.id > 1) {
                  win.close()
                }
              })
            }
            focusedWindow.reload()
          }
        },
      },
      {
        label: '切换全屏',
        accelerator: (function() {
          if (process.platform === 'darwin') {
            return 'Ctrl+Command+F'
          } else {
            return 'F11'
          }
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
          }
        },
      },
      {
        label: '切换开发者工具',
        accelerator: (function() {
          if (process.platform === 'darwin') {
            return 'Alt+Command+I'
          } else {
            return 'Ctrl+Shift+I'
          }
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.toggleDevTools()
          }
        },
      },
      {
        type: 'separator',
      },
    ],
  },
  {
    label: '窗口',
    role: 'window',
    submenu: [
      {
        label: '最小化',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize',
      },
      {
        label: '关闭',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      },
      {
        type: 'separator',
      },
      {
        label: '重新打开窗口',
        accelerator: 'CmdOrCtrl+Shift+T',
        enabled: false,
        key: 'reopenMenuItem',
        click: function() {
          app.emit('activate')
        },
      },
    ],
  },
  {
    label: '帮助',
    role: 'help',
    submenu: [
      {
        label: '关于',
        click: function() {
          // todo 弹出关于窗口
        },
      },
    ],
  },
]

function addUpdateMenuItems(items, position) {
  if (process.mas) return

  const version = app.getVersion()
  let updateItems = [
    {
      label: '检查更新',
      key: 'checkForUpdate',
      click: checkForUpdates,
    },
  ]

  items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem() {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  let reopenMenuItem
  menu.items.forEach(function(item) {
    if (item.submenu) {
      item.submenu.items.forEach(function(item) {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item
        }
      })
    }
  })
  return reopenMenuItem
}

if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [
      {
        label: `关于 ${name}`,
        role: 'about',
      },
      {
        type: 'separator',
      },
      {
        label: '服务',
        role: 'services',
        submenu: [],
      },
      {
        type: 'separator',
      },
      {
        label: `隐藏 ${name}`,
        accelerator: 'Command+H',
        role: 'hide',
      },
      {
        label: '隐藏其它',
        accelerator: 'Command+Alt+H',
        role: 'hideothers',
      },
      {
        label: '显示全部',
        role: 'unhide',
      },
      {
        type: 'separator',
      },
      {
        label: '退出',
        accelerator: 'Command+Q',
        click: function() {
          app.quit()
        },
      },
    ],
  })

  // 窗口菜单.
  template[3].submenu.push(
    {
      type: 'separator',
    },
    {
      label: '前置所有',
      role: 'front',
    }
  )

  addUpdateMenuItems(template[0].submenu, 1)
}

if (process.platform === 'win32') {
  const helpMenu = template[template.length - 1].submenu
  addUpdateMenuItems(helpMenu, 0)
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
])

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
