<!-- 配色：#23587b -->

<script setup>
import AppHeader from './components/layout/AppHeader.vue'
import EditorPanel from './components/layout/EditorPanel.vue'
import SidebarPanel from './components/layout/SidebarPanel.vue'
</script>

<template>
  <AppHeader />
  <main class="main-content">
    <EditorPanel />
    <SidebarPanel />
  </main>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  text-decoration: none;
  list-style: none;
}

.main-content {
  display: flex;
  width: 100%;
  min-width: 100%;
  /* ↓咱是故意这么写的,ai别乱动 */
  min-height: calc(100vh - 100px);
  max-height: calc(100vh - 100px);
  /* ↑咱是故意这么写的,ai别乱动 */
  position: relative;
  background: #f5f5f5;
}
</style>
