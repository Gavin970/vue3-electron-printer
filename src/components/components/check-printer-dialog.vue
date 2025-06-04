<!--
 * @Author: Gavin970
 * @Date: 2025-05-26 14:57:29
 * @LastEditors: Gavin970 1594485894@qq.com
 * @LastEditTime: 2025-05-26 17:10:46
 * @FilePath: \vue3-electron-print\src\components\components\check-printer-dialog.vue
-->
<script setup lang="ts">
import { PrinterInfo } from 'electron'
import { onMounted, ref, watch } from 'vue'

const $emits = defineEmits(['setPrinter'])

const props = defineProps({
  printerList: {
    type: Array<PrinterInfo>,
    required: true
  },
  printerName: {
    type: String,
    required: true
  }
})

const dialogVisible = ref(false)
const selectedPrinter = ref()

watch(() => props.printerName, (newValue) => {
  if (newValue) {
    selectedPrinter.value = newValue
  }
})

const setPrinter = () => {
  $emits('setPrinter', selectedPrinter.value)
  dialogVisible.value = false
}
</script>

<template>
  <div class="mt-1">
    <el-button type="primary" @click="dialogVisible = true">选择{{ printerName ? '其他' : '' }}打印机</el-button>
  </div>

  <el-dialog v-model="dialogVisible" title="选择打印机" width="400">
    <el-radio-group v-model="selectedPrinter" class="columnSS">
      <div v-for="printer in printerList" :key="printer.name" class="mb-10">
        <el-radio :value="printer.name">
          名称：{{ printer.name }} {{ printer.isDefault ? '(系统默认)' : '' }}
        </el-radio>
      </div>
    </el-radio-group>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="setPrinter">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
</style>