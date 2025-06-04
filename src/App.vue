<!--
 * @Author: Gavin970
 * @Date: 2025-05-19 16:49:12
 * @LastEditors: Gavin970 1594485894@qq.com
 * @LastEditTime: 2025-05-30 15:02:07
 * @FilePath: \vue3-electron-print\src\App.vue
-->
<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <!-- <div>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div> -->
  <HelloWorld />
</template>

<style>
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo.electron:hover {
  filter: drop-shadow(0 0 2em #9FEAF9);
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
