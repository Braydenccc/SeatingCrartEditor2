<template>
  <header class="app-header">
    <h1 class="header-text">BraydenSCE V2</h1>
    <p class="header-subtitle">座位表编辑器 开发版本 <a href="https://afdian.com/a/brayden">byccc</a> 由<a href="https://host.retiehe.com/">热铁盒网页托管</a>提供服务 | <a href="https://github.com/Braydenccc/SeatingCrartEditor2" target="_blank">仓库链接</a></p>
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

/* 响应式设计 - 平板 */
@media (max-width: 1024px) {
  .app-header {
    padding: 0 20px;
    height: 90px;
  }

  .header-text {
    font-size: 28px;
  }

  .header-subtitle {
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 60%;
  }
}

/* 响应式设计 - 移动设备 */
@media (max-width: 768px) {
  .app-header {
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 0;
    height: 48px;
    padding: 0 16px;
  }

  .header-text {
    font-size: 18px;
    letter-spacing: 0.5px;
  }

  .header-subtitle {
    display: none;
  }
}
</style>
