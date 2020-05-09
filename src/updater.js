/**
 * updater.js
 *
 * Please use manual update only when it is really required, otherwise please use recommended non-intrusive auto update.
 *
 * Import steps:
 * 1. create `updater.js` for the code snippet
 * 2. require `updater.js` for menu implementation, and set `checkForUpdates` callback from `updater` for the click property of `Check Updates...` MenuItem.
 */
const { ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')

let updater
let win

ipcMain.on('downloadUpdate', () => {
  autoUpdater.downloadUpdate()
  win.webContents.send('download-update')
})
ipcMain.on('quitAndInstall', () => {
  autoUpdater.quitAndInstall()
})
ipcMain.on('cancelDownloadUpdate', () => {
  updater.enabled = true
  updater = null
})
autoUpdater.autoDownload = false

autoUpdater.on('error', error => {
  win.webContents.send('update-available')
})

autoUpdater.on('update-available', () => {
  win.webContents.send('update-available')
})

autoUpdater.on('update-not-available', () => {
  win.webContents.send('update-not-available')
  updater.enabled = true
  updater = null
})

autoUpdater.on('download-progress', value => {
  win.webContents.send('download-progress', value)
})

// export this to MenuItem click callback
function checkForUpdates(menuItem, focusedWindow, event) {
  updater = menuItem
  win = focusedWindow
  updater.enabled = false
  autoUpdater.checkForUpdates()
}
module.exports.checkForUpdates = checkForUpdates
