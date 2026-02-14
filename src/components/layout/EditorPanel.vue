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
    flex: 3;
    min-height: 300px;
  }

  .student-list-area {
    flex: 2;
    min-height: 250px;
    height: auto;
  }
}

/* 响应式设计 - 移动设备 */
@media (max-width: 768px) {
  .editor-panel {
    min-height: auto;
  }

  .editor {
    flex: none;
    min-height: 280px;
    height: 45vh;
  }

  .student-list-area {
    flex: none;
    min-height: 250px;
    height: auto;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .editor {
    min-height: 220px;
    height: 40vh;
  }

  .student-list-area {
    min-height: 200px;
  }
}
</style>
