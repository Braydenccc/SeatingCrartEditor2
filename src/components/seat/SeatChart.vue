<template>
  <div class="seat-chart-container">
    <div class="seat-chart-info">
      <span class="info-item">{{ seatConfig.groupCount }} 大组</span>
      <span class="info-separator">·</span>
      <span class="info-item">每组 {{ seatConfig.columnsPerGroup }} 列</span>
      <span class="info-separator">·</span>
      <span class="info-item">每列 {{ seatConfig.seatsPerColumn }} 座</span>
      <span class="info-separator">·</span>
      <span class="info-item">共 {{ totalSeats }} 个座位</span>
    </div>

    <div class="seat-chart">
      <div
        v-for="(group, groupIndex) in organizedSeats"
        :key="groupIndex"
        class="seat-group"
      >
        <div class="group-label">第 {{ groupIndex + 1 }} 组</div>
        <div class="group-content">
          <div
            v-for="(column, columnIndex) in group"
            :key="columnIndex"
            class="seat-column"
          >
            <SeatItem
              v-for="seat in column"
              :key="seat.id"
              :seat="seat"
              @assign-student="handleAssignStudent"
              @toggle-empty="handleToggleEmpty"
              @clear-seat="handleClearSeat"
              @swap-seat="handleSwapSeat"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import SeatItem from './SeatItem.vue'
import { useSeatChart } from '@/composables/useSeatChart'
import { useEditMode } from '@/composables/useEditMode'
import { useStudentData } from '@/composables/useStudentData'

const {
  seatConfig,
  organizedSeats,
  initializeSeats,
  assignStudent,
  toggleEmpty,
  clearSeat,
  swapSeats,
  findSeatByStudent
} = useSeatChart()

const { firstSelectedSeat, setFirstSelectedSeat, clearFirstSelectedSeat } = useEditMode()
const { clearSelection } = useStudentData()

// 初始化座位表
onMounted(() => {
  initializeSeats()
})

// 计算总座位数
const totalSeats = computed(() => {
  return seatConfig.value.groupCount *
         seatConfig.value.columnsPerGroup *
         seatConfig.value.seatsPerColumn
})

// 处理分配学生
const handleAssignStudent = (seatId, studentId) => {
  // 先检查学生是否已经坐在其他座位上
  const existingSeat = findSeatByStudent(studentId)
  if (existingSeat) {
    // 清空原座位
    clearSeat(existingSeat.id)
  }

  // 分配到新座位
  assignStudent(seatId, studentId)

  // 清除学生选中状态
  clearSelection()
}

// 处理切换空置状态
const handleToggleEmpty = (seatId) => {
  toggleEmpty(seatId)
}

// 处理清空座位
const handleClearSeat = (seatId) => {
  clearSeat(seatId)
}

// 处理交换座位
const handleSwapSeat = (seatId) => {
  if (!firstSelectedSeat.value) {
    // 第一次点击:选中座位
    setFirstSelectedSeat(seatId)
  } else if (firstSelectedSeat.value === seatId) {
    // 点击同一个座位:取消选中
    clearFirstSelectedSeat()
  } else {
    // 第二次点击:交换座位
    swapSeats(firstSelectedSeat.value, seatId)
    clearFirstSelectedSeat()
  }
}
</script>

<style scoped>
.seat-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  overflow: auto;
}

.seat-chart-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border-bottom: 2px solid #23587b;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.info-item {
  font-weight: 500;
  color: #23587b;
}

.info-separator {
  color: #ccc;
}

.seat-chart {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  padding: 30px 20px;
  overflow: auto;
}

.seat-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

.group-label {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #23587b;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.group-content {
  display: flex;
  gap: 16px;
}

.seat-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 200px;
}

/* 滚动条样式 */
.seat-chart-container::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.seat-chart-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.seat-chart-container::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 5px;
  transition: background 0.3s;
}

.seat-chart-container::-webkit-scrollbar-thumb:hover {
  background: #888;
}

.seat-chart::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.seat-chart::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.seat-chart::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 5px;
  transition: background 0.3s;
}

.seat-chart::-webkit-scrollbar-thumb:hover {
  background: #888;
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .seat-chart {
    gap: 30px;
  }

  .group-content {
    gap: 12px;
  }

  .seat-column {
    width: 80px;
    gap: 10px;
  }
}

@media (max-width: 1200px) {
  .seat-chart {
    gap: 20px;
  }

  .group-content {
    gap: 10px;
  }

  .seat-column {
    width: 70px;
    gap: 8px;
  }
}
</style>
