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
</style>
