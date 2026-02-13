<template>
  <header class="app-header">
    <h1 class="header-text">BraydenSCE V2</h1>
    <p class="header-subtitle">座位表编辑器 开发版本 <a href="https://afdian.com/a/brayden">byccc</a> 由<a href="https://host.retiehe.com/">热铁盒网络托管</a>提供服务 | <a href="https://github.com/Braydenccc/SeatingCrartEditor2" target="_blank">仓库链接</a></p>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: linear-gradient(135deg, #23587b 0%, #2d6a94 100%);
  height: 100px;
  color: aliceblue;
  padding: 0 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-text {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 1px;
}

.header-subtitle {
  margin: 0;
  font-size: 20px;
  opacity: 0.9;
  font-weight: 300;
}

.header-subtitle a {
  color: #f0f0f0;
  text-decoration: underline;
}
</style>
