<template>
  <div class="editor-panel">
    <div class="editor">
      <SeatChart />
    </div>
    <div class="student-list-area">
      <StudentList />
    </div>
  </div>
</template>

<script setup>
import StudentList from '../student/StudentList.vue'
import SeatChart from '../seat/SeatChart.vue'
</script>

<style scoped>
.editor-panel {
  width: 80%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.editor {
  flex: 1;
  min-height: 60%;
  background: #ffffff;
  border-bottom: 2px solid #e0e0e0;
  overflow: hidden;
}

.student-list-area {
  height: 40%;
  min-height: 300px;
  overflow: hidden;
}

/* 响应式设计 - 中等屏幕 */
@media (max-width: 1400px) {
  .editor-panel {
    width: 75%;
  }
}

/* 响应式设计 - 平板 */
@media (max-width: 1024px) {
  .editor-panel {
    width: 100%;
    flex: 1;
  }

  .editor {
    min-height: 400px;
    height: 50%;
  }

  .student-list-area {
    height: 50%;
    min-height: 350px;
  }
}

/* 响应式设计 - 移动设备 */
@media (max-width: 768px) {
  .editor-panel {
    min-height: auto;
  }

  .editor {
    min-height: 350px;
    height: auto;
  }

  .student-list-area {
    min-height: 300px;
    height: auto;
  }
}
</style>
