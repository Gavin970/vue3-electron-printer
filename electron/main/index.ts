/*
 * @Author: Gavin970
 * @Date: 2025-05-19 16:49:12
 * @LastEditors: Gavin970 1594485894@qq.com
 * @LastEditTime: 2025-05-30 13:06:21
 * @FilePath: \vue3-electron-print\electron\main\index.ts
 */
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { WebSocketServer } from 'ws'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')
let currentPrinter = '' // 存储当前选择的打印机

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  // 重定向主进程日志到渲染进程
  console.log = (...args) => {
    win.webContents.send('CONSOLE_LOG', ...args)
  }

  const wss = new WebSocketServer({ port: 4590 })

  // 监听WebSocket连接
  wss.on('connection', (ws) => {
    console.log('Vue客户端已连接')
    ws.on('message', (data) => {
      try {
        const demo = [
          {
            x: 100, // x坐标,无单位是毫米
            y: 100, // y坐标,无单位是毫米
            text: '打印内容1',
            size: 20 // 字体大小
          },
          { 
            x: '200px', // x坐标,有单位是像素
            y: '400px', // y坐标,有单位是像素
            text: '打印内容2',
            size: 16 // 字体大小 
          }
        ]
        // 解析接收到的JSON数据
        // const printData = JSON.parse(data.toString());
        const printData = demo
        console.log('收到打印数据:', printData);
        
        // 将打印数据发送给渲染进程处理
        win?.webContents.send('print-data', printData);
        
        // 发送确认消息
        ws.send('Electron已收到打印数据，准备打印');
      } catch (error) {
        console.error('处理打印数据出错:', error);
        ws.send('Electron处理数据出错: ' + error.message);
      }      
    })
    ws.on('close', () => {
      console.log('Vue客户端断开连接')
    })
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
    win.webContents.getPrintersAsync().then(list => {
      win?.webContents.send('getPrinterList', list)
    })
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

// 添加设置默认打印机的IPC监听器
ipcMain.on('set-default-printer', async (_, printerName) => {
  try {
    // 在Windows系统中，可以使用PowerShell命令设置默认打印机
    if (process.platform === 'win32') {
      win?.webContents.send('loading', true)
      const { exec } = require('child_process')
      exec(`powershell -command "(New-Object -ComObject WScript.Network).SetDefaultPrinter('${printerName}')"`, (error) => {
        if (error) {
          win?.webContents.send('set-default-printer-result', { success: false, error: error.message })
          win?.webContents.send('loading', false)
        } else {
          win?.webContents.send('set-default-printer-result', { success: true, printerName: printerName })
          currentPrinter = printerName
          // 重新获取打印机列表并发送给渲染进程
          win?.webContents.getPrintersAsync().then(list => {
            win?.webContents.send('getPrinterList', list)
            win?.webContents.send('loading', false)
          })
        }
      })
    } else {
      // 对于其他平台，可能需要使用其他方法
      win?.webContents.send('set-default-printer-result', {
        success: false,
        error: '当前平台不支持设置默认打印机'
      })
    }
  } catch (error) {
    console.error('设置默认打印机出错:', error)
    win?.webContents.send('set-default-printer-result', {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// 添加创建打印窗口的函数
function createPrintWindow(printData) {
  // 创建隐藏的打印窗口
  const printWin = new BrowserWindow({
    width: 800,
    height: 600,
    show: true, // 隐藏窗口
    webPreferences: {
      preload: preload,
      nodeIntegration: true,
    },
  });

  // 重定向主进程日志到渲染进程
  console.log = (...args) => {
    printWin.webContents.send('CONSOLE_LOG', ...args)
  }

  // 生成HTML内容
  const htmlContent = generatePrintHTML(printData);
  
  // 加载HTML内容
  printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  console.log('htmlContent', htmlContent);
  
  
  // 等待内容加载完成后打印
  printWin.webContents.on('did-finish-load', async () => {
    console.log('did-finish-load');
    
    setTimeout(() => {
      console.log('did-finish-load2');
      printWin.webContents.print(
        { 
          silent: true,
          printBackground: true,
          deviceName: currentPrinter, // 使用当前选择的打印机
        }, 
        (success, error) => {
          console.log('打印结果:', success, error);
          // 打印完成后关闭窗口
          printWin.close();
          // 通知渲染进程打印结果
          win?.webContents.send('print-result', { success, error });
        }
      );
    }, 300); // 给一点时间让内容渲染
  });
}

// 生成打印HTML内容的函数
function generatePrintHTML(printData) {
  let contentHTML = '';
  
  // 遍历打印数据，生成定位的内容
  printData.forEach(item => {
    // 处理坐标单位
    const x = typeof item.x === 'string' ? item.x : `${item.x}mm`;
    const y = typeof item.y === 'string' ? item.y : `${item.y}mm`;
    const fontSize = item.size || 16;
    
    // 添加定位的文本元素
    contentHTML += `
      <div style="position: absolute; left: ${x}; top: ${y}; font-size: ${fontSize}px;">
        ${item.text}
      </div>
    `;
  });
  
  // 返回完整的HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>打印内容</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          position: relative;
          width: 100%;
          height: 100%;
          background-color: #fff;
        }
        div {
          color: #000;
          font-family: 'Arial', sans-serif; // 设置默认字体为Arial或Sans-Serif
          font-weight: normal; // 设置字体为正常（非粗体）
          font-style: normal; // 设置字体为正常（非斜体）
        }
      </style>
    </head>
    <body id="dynamic-content">
      ${contentHTML}
    </body>
    </html>
  `;
}

// 添加新的IPC监听器处理从渲染进程收到的打印数据
ipcMain.on('print-custom-content', (_, printData) => {
  createPrintWindow(printData);
});
