<!--
 * @Author: Gavin970
 * @Date: 2025-05-19 16:49:12
 * @LastEditors: Gavin970 1594485894@qq.com
 * @LastEditTime: 2025-06-04 09:29:12
 * @FilePath: \vue3-electron-print\src\components\HelloWorld.vue
-->
<template>
  <div>
    <el-icon :size="100" color="#666"><Printer /></el-icon>
    <div v-if="printerName">当前打印机：{{ printerName }}</div>
    <div v-else>暂无默认打印机</div>
    <div class="mt-1">
      <!-- <el-button type="primary">打印</el-button> -->
      <check-printer-dialog 
        :printer-list="printerList" 
        :printer-name="printerName"
        @set-printer="setDefaultPrinter"
      />
    </div>
    <div class="tips">
      <span class="red">* 提示：</span>
      <span>打开本插件后, 需要刷新浏览器端才能进行打印</span>
    </div>
  </div>
  <Loading :loading="loading" text="正在切换默认打印机"></Loading>
</template>

<script setup lang="ts">
import CheckPrinterDialog from './components/check-printer-dialog.vue'
import Loading from './Loading.vue'
import { PrinterInfo } from 'electron'
import { ElMessage } from 'element-plus'
import { ref, onMounted } from 'vue'

// ----------------------------------- 打印机列表组件 -----------------------------------
//#region 
const printerName = ref('')
const printerList = ref<Array<PrinterInfo>>([])

// 获取打印机列表
const getPrinterList = () => {
  window.ipcRenderer.on('getPrinterList', (_, list) => {
    printerList.value = list
    console.log('getPrinterList', list)
    for (const item of list) {
      if (item.isDefault) {
        printerName.value = item.name
      }
    }
  })
}

// 设置默认打印机
const setDefaultPrinter = (printer: string) => {
  if (printer && printer !== printerName.value) {
    window.ipcRenderer.send('set-default-printer', printer)
    printerName.value = printer
  }
}

// 监听设置默认打印机结果
const listenSetPrinterResult = () => {
  window.ipcRenderer.on('set-default-printer-result', (_, result) => {
    console.log('设置默认打印机',result);
    if (result.success) {      
      ElMessage.success('默认打印机设置成功')
    } else {
      ElMessage.error(`设置默认打印机失败: ${result.error}`)
    }
  })
}
//#endregion

// ------------------------------------- 打印机组件 -------------------------------------
//#region 
// 监听从主进程接收的打印数据
const listenPrintData = () => {
  window.ipcRenderer.on('print-data', (_, data) => {
    console.log('收到打印数据', data);
    // 发送到主进程进行打印
    window.ipcRenderer.send('print-custom-content', data);
  });
}

// 监听打印结果
const listenPrintResult = () => {
  window.ipcRenderer.on('print-result', (_, result) => {
    console.log('打印结果', result);
    if (result.success) {
      ElMessage.success('打印成功');
    } else {
      ElMessage.error(`打印失败: ${result.error}`);
    }
  });
}
//#endregion

// ------------------------------------- 加载中组件 -------------------------------------
//#region 
const loading = ref(false)
const getLoadingStatus = () => {
  window.ipcRenderer.on('loading', (_, status) => {
    console.log('loading', status)
    loading.value = status
  })
}
//#endregion

onMounted(() => {
  getPrinterList()
  listenSetPrinterResult()
  getLoadingStatus()
  listenPrintData()
  listenPrintResult()
})
</script>

<style scoped lang="scss">
.tips {
  margin-top: 20px;
  color: #999;
  text-align: left;

  .red {
    color: red;
  }
}
</style>