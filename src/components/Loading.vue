<!--
 * @Author: Gavin970
 * @Date: 2025-05-26 17:21:13
 * @LastEditors: Gavin970 1594485894@qq.com
 * @LastEditTime: 2025-05-26 17:22:16
 * @FilePath: \vue3-electron-print\src\components\Loading.vue
-->
<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<template>
  <div class="loading" v-show="loading">
    <div class="loading-mask"></div>
    <div class="loading-content">
      <div class="loading-icon"></div>
      <div class="loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<style scoped>
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999999;
}
.loading-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999999;
}
.loading-icon {
  width: 50px;
  height: 50px;
  background: url('../assets/images/loading.png') no-repeat;
  background-size: 100% 100%;
  animation: rotate 1s linear infinite;
}
.loading-text {
  margin-top: 10px;
  font-size: 16px;
  color: #fff;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>