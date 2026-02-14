<template>
  <div
    class="seat-item"
    :class="{
      empty: seat.isEmpty,
      occupied: hasStudent,
      selected: isFirstSelected,
      clickable: isClickable,
      'zone-highlight': zoneHighlight
    }"
    :style="zoneHighlightStyle"
    @click="handleClick"
  >
    <div v-if="seat.isEmpty" class="empty-indicator">
      <span class="empty-text">空置</span>
    </div>
    <div v-else-if="hasStudent" class="student-display">
      <div class="student-name">{{ studentInfo.name || '未命名' }}</div>
      <div class="student-number">{{ studentInfo.studentNumber || '-' }}</div>
    </div>
    <div v-else class="empty-seat">
      <span class="seat-placeholder">空位</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStudentData } from '@/composables/useStudentData'
import { useEditMode } from '@/composables/useEditMode'
import { useZoneData } from '@/composables/useZoneData'

const props = defineProps({
  seat: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['assign-student', 'toggle-empty', 'clear-seat', 'swap-seat', 'toggle-zone-seat'])

const { students, selectedStudentId } = useStudentData()
const { currentMode, firstSelectedSeat, EditMode } = useEditMode()
const { visibleZoneSeats, selectedZoneId, toggleSeatInZone } = useZoneData()

// 是否有学生
const hasStudent = computed(() => {
  return props.seat.studentId !== null && !props.seat.isEmpty
})

// 获取学生信息
const studentInfo = computed(() => {
  if (!hasStudent.value) return null
  return students.value.find(s => s.id === props.seat.studentId) || { name: '未知', studentNumber: null }
})

// 是否是交换模式下第一个选中的座位
const isFirstSelected = computed(() => {
  return currentMode.value === EditMode.SWAP && firstSelectedSeat.value === props.seat.id
})

// 选区高亮相关
const zoneHighlight = computed(() => {
  return visibleZoneSeats.value.has(props.seat.id)
})

const zoneHighlightStyle = computed(() => {
  if (!zoneHighlight.value) return {}
  const color = visibleZoneSeats.value.get(props.seat.id)
  return {
    '--zone-color': color
  }
})

// 是否可点击
const isClickable = computed(() => {
  // 普通模式下,有选中学生且座位未空置时可点击
  if (currentMode.value === EditMode.NORMAL) {
    return selectedStudentId.value !== null && !props.seat.isEmpty
  }
  // 空置编辑模式下总是可点击
  if (currentMode.value === EditMode.EMPTY_EDIT) {
    return true
  }
  // 交换模式下总是可点击
  if (currentMode.value === EditMode.SWAP) {
    return true
  }
  // 清空模式下,有学生的座位可点击
  if (currentMode.value === EditMode.CLEAR) {
    return hasStudent.value
  }
  // 选区编辑模式下总是可点击
  if (currentMode.value === EditMode.ZONE_EDIT) {
    return true
  }
  return false
})

// 处理点击
const handleClick = () => {
  if (!isClickable.value) return

  switch (currentMode.value) {
    case EditMode.NORMAL:
      // 普通模式:分配学生
      if (selectedStudentId.value && !props.seat.isEmpty) {
        emit('assign-student', props.seat.id, selectedStudentId.value)
      }
      break

    case EditMode.EMPTY_EDIT:
      // 空置编辑模式:切换空置状态
      emit('toggle-empty', props.seat.id)
      break

    case EditMode.SWAP:
      // 交换模式:选择座位进行交换
      emit('swap-seat', props.seat.id)
      break

    case EditMode.CLEAR:
      // 清空模式:清空座位
      if (hasStudent.value) {
        emit('clear-seat', props.seat.id)
      }
      break

    case EditMode.ZONE_EDIT:
      // 选区编辑模式:切换座位在选区中的状态
      if (selectedZoneId.value) {
        toggleSeatInZone(selectedZoneId.value, props.seat.id)
      }
      break
  }
}
</script>

<style scoped>
.seat-item {
  width: 100%;
  height: 80px;
  aspect-ratio: 3 / 4;
  border: 2px solid #d0d7dc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.seat-item.clickable {
  cursor: pointer;
}

.seat-item.clickable:hover {
  border-color: #23587b;
  box-shadow: 0 2px 8px rgba(35, 88, 123, 0.2);
  transform: translateY(-2px);
}

/* 空置座位样式 */
.seat-item.empty {
  background: repeating-linear-gradient(
    45deg,
    #f5f5f5,
    #f5f5f5 10px,
    #e0e0e0 10px,
    #e0e0e0 20px
  );
  border-color: #bbb;
}

.seat-item.empty .empty-indicator {
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #999;
}

.empty-text {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

/* 已分配学生的座位 */
.seat-item.occupied {
  background: linear-gradient(135deg, #e8f4f8 0%, #d0e9f2 100%);
  border-color: #23587b;
}

.student-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  width: 100%;
}

.student-number {
  font-size: 12px;
  font-weight: 700;
  color: #23587b;
  background: white;
  padding: 2px 10px;
  border-radius: 6px;
  min-width: 40px;
  text-align: center;
}

.student-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
  max-width: 100%;
}

/* 空座位 */
.empty-seat {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seat-placeholder {
  font-size: 13px;
  color: #999;
  font-weight: 400;
}

/* 交换模式下第一个选中的座位 */
.seat-item.selected {
  border-color: #ff9800;
  border-width: 3px;
  box-shadow: 0 0 12px rgba(255, 152, 0, 0.4);
}

/* 选区高亮 */
.seat-item.zone-highlight {
  background: linear-gradient(135deg,
    var(--zone-color, #E0E0E0) 0%,
    color-mix(in srgb, var(--zone-color, #E0E0E0) 60%, white) 100%
  );
  border-color: var(--zone-color, #E0E0E0);
  box-shadow: 0 0 8px color-mix(in srgb, var(--zone-color, #E0E0E0) 50%, transparent);
}

.seat-item.zone-highlight.occupied {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--zone-color, #E0E0E0) 40%, #e8f4f8) 0%,
    color-mix(in srgb, var(--zone-color, #E0E0E0) 30%, #d0e9f2) 100%
  );
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .student-number {
    font-size: 14px;
    padding: 3px 8px;
  }

  .student-name {
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .seat-item {
    height: 70px;
  }

  .student-name {
    font-size: 12px;
  }

  .student-number {
    font-size: 11px;
    padding: 2px 6px;
  }

  .empty-text,
  .seat-placeholder {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .seat-item {
    height: 65px;
  }

  .student-name {
    font-size: 11px;
  }

  .student-number {
    font-size: 10px;
  }
}
</style>
