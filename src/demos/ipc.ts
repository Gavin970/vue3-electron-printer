/*
 * @Author: Gavin970
 * @Date: 2025-05-19 16:49:12
 * @LastEditors: Gavin970 1594485894@qq.com
 * @LastEditTime: 2025-05-22 16:42:19
 * @FilePath: \vue3-electron-print\src\demos\ipc.ts
 */
window.ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('[Receive Main-process message]:', ...args)
})
