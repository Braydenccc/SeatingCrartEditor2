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

    <div ref="viewportRef" class="seat-chart-viewport" :class="{ 'is-panning': isPanning }" @wheel.prevent="handleWheel"
      @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp"
      @touchstart="handleTouchStart" @touchmove.prevent="handleTouchMove" @touchend="handleTouchEnd"
      @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
      <div ref="chartRef" class="seat-chart" :style="chartTransformStyle">
        <div v-for="(group, groupIndex) in organizedSeats" :key="groupIndex" class="seat-group">
          <div class="group-label">第 {{ groupIndex + 1 }} 组</div>
          <div class="group-content">
            <div v-for="(column, columnIndex) in group" :key="columnIndex" class="seat-column">
              <SeatItem v-for="seat in column" :key="seat.id" :seat="seat" @assign-student="handleAssignStudent"
                @toggle-empty="handleToggleEmpty" @clear-seat="handleClearSeat" @swap-seat="handleSwapSeat" />
            </div>
          </div>
        </div>
      </div>

      <!-- 缩放控件 -->
      <div class="zoom-controls">
        <button class="zoom-btn" @click.stop="zoomOut" :disabled="scale <= MIN_SCALE" title="缩小">
          <span>−</span>
        </button>
        <button class="zoom-label" @click.stop="handleFitZoom" title="自适应大小">
          {{ Math.round(scale * 100) }}%
        </button>
        <button class="zoom-btn" @click.stop="zoomIn" :disabled="scale >= MAX_SCALE" title="放大">
          <span>+</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import SeatItem from './SeatItem.vue'
import { useSeatChart } from '@/composables/useSeatChart'
import { useEditMode } from '@/composables/useEditMode'
import { useStudentData } from '@/composables/useStudentData'
import { useZoom } from '@/composables/useZoom'

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
const { scale, panX, panY, zoomIn, zoomOut, setScale, setPan, MIN_SCALE, MAX_SCALE } = useZoom()

const viewportRef = ref(null)
const chartRef = ref(null)
const isPanning = ref(false)

// ==================== 变换样式 ====================
const chartTransformStyle = computed(() => ({
  transform: `translate(calc(-50% + ${panX.value}px), calc(-50% + ${panY.value}px)) scale(${scale.value})`,
  transformOrigin: 'center center',
  willChange: 'transform' // 提示浏览器优化渲染
}))

// ==================== 自适应缩放 ====================
const fitToViewport = () => {
  if (!viewportRef.value || !chartRef.value) return

  // 暂时重置以获取真实尺寸
  const prevTransform = chartRef.value.style.transform
  chartRef.value.style.transform = 'none'

  nextTick(() => {
    if (!viewportRef.value || !chartRef.value) return

    const vpRect = viewportRef.value.getBoundingClientRect()
    const chartRect = chartRef.value.getBoundingClientRect()

    // 还原
    chartRef.value.style.transform = prevTransform

    if (chartRect.width === 0 || chartRect.height === 0) return

    const padH = 40 // 水平留白
    const padV = 30 // 垂直留白
    const availW = vpRect.width - padH
    const availH = vpRect.height - padV

    const fitScale = Math.min(
      availW / chartRect.width,
      availH / chartRect.height,
      1.0 // 不超过 100%
    )

    setScale(Math.max(MIN_SCALE, fitScale))
    setPan(0, 0)
  })
}

const handleFitZoom = () => {
  fitToViewport()
}

// ==================== 鼠标拖拽平移 ====================
let mouseDown = false
let startMouseX = 0
let startMouseY = 0
let startPanX = 0
let startPanY = 0
let mouseMoved = false
let panRafId = null

// rAF 批量更新 pan（避免每次 mousemove 都触发 Vue 重新渲染）
const schedulePanUpdate = (x, y) => {
  if (panRafId) return // 已有待处理帧
  panRafId = requestAnimationFrame(() => {
    panRafId = null
    panX.value = x
    panY.value = y
  })
}

// 立即刷新 pan（用于最终位置）
const flushPan = (x, y) => {
  if (panRafId) { cancelAnimationFrame(panRafId); panRafId = null }
  panX.value = x
  panY.value = y
}

let pendingPanX = 0
let pendingPanY = 0

const handleMouseDown = (e) => {
  // 不拦截对座位等可交互元素的点击
  // 只在空白区域或按住中键时启动拖拽
  if (e.button === 1 || (e.button === 0 && !isInteractiveTarget(e.target))) {
    mouseDown = true
    mouseMoved = false
    startMouseX = e.clientX
    startMouseY = e.clientY
    startPanX = panX.value
    startPanY = panY.value
    e.preventDefault()
  }
}

const handleMouseMove = (e) => {
  if (!mouseDown) return
  const dx = e.clientX - startMouseX
  const dy = e.clientY - startMouseY
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    mouseMoved = true
    isPanning.value = true
  }
  pendingPanX = startPanX + dx
  pendingPanY = startPanY + dy
  schedulePanUpdate(pendingPanX, pendingPanY)
}

const handleMouseUp = () => {
  if (mouseDown && mouseMoved) {
    flushPan(pendingPanX, pendingPanY)
  }
  mouseDown = false
  isPanning.value = false
}

// 判断是否为可交互元素（座位、按钮等）
const isInteractiveTarget = (el) => {
  let cur = el
  while (cur && cur !== viewportRef.value) {
    if (cur.dataset?.seatId || cur.tagName === 'BUTTON' || cur.tagName === 'INPUT') {
      return true
    }
    if (cur.classList?.contains('seat-item') || cur.classList?.contains('zoom-controls')) {
      return true
    }
    cur = cur.parentElement
  }
  return false
}

// ==================== 触摸手势 ====================
let lastTouchDistance = 0
let lastTouchScale = 1
let touchPanStartX = 0
let touchPanStartY = 0
let touchStartPanX = 0
let touchStartPanY = 0
let touchMode = '' // 'pan' | 'pinch' | ''
let touchRafId = null

const getTouchDistance = (touches) => {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

const handleTouchStart = (e) => {
  if (e.touches.length === 2) {
    // 双指缩放
    touchMode = 'pinch'
    lastTouchDistance = getTouchDistance(e.touches)
    lastTouchScale = scale.value
  } else if (e.touches.length === 1 && !isInteractiveTarget(e.target)) {
    // 单指拖拽平移（仅空白区域）
    touchMode = 'pan'
    touchPanStartX = e.touches[0].clientX
    touchPanStartY = e.touches[0].clientY
    touchStartPanX = panX.value
    touchStartPanY = panY.value
  }
}

const handleTouchMove = (e) => {
  if (touchMode === 'pinch' && e.touches.length === 2) {
    const currentDistance = getTouchDistance(e.touches)
    const ratio = currentDistance / lastTouchDistance
    const newScale = lastTouchScale * ratio
    if (touchRafId) cancelAnimationFrame(touchRafId)
    touchRafId = requestAnimationFrame(() => {
      touchRafId = null
      setScale(newScale)
    })
  } else if (touchMode === 'pan' && e.touches.length === 1) {
    const dx = e.touches[0].clientX - touchPanStartX
    const dy = e.touches[0].clientY - touchPanStartY
    pendingPanX = touchStartPanX + dx
    pendingPanY = touchStartPanY + dy
    isPanning.value = true
    schedulePanUpdate(pendingPanX, pendingPanY)
  }
}

const handleTouchEnd = () => {
  if (touchMode === 'pan') {
    flushPan(pendingPanX, pendingPanY)
  }
  if (touchRafId) { cancelAnimationFrame(touchRafId); touchRafId = null }
  touchMode = ''
  lastTouchDistance = 0
  isPanning.value = false
}

// ==================== 鼠标滚轮缩放 ====================
let wheelRafId = null

const handleWheel = (e) => {
  if (e.ctrlKey || e.metaKey) {
    // Ctrl+滚轮 = 缩放
    if (e.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  } else {
    // 普通滚轮 = 平移（rAF 节流）
    pendingPanX = panX.value - e.deltaX
    pendingPanY = panY.value - e.deltaY
    if (wheelRafId) cancelAnimationFrame(wheelRafId)
    wheelRafId = requestAnimationFrame(() => {
      wheelRafId = null
      panX.value = pendingPanX
      panY.value = pendingPanY
    })
  }
}

// ==================== 拖放处理 ====================
const handleDragOver = (e) => {
  e.dataTransfer.dropEffect = 'move'
}

const handleDrop = (e) => {
  const raw = e.dataTransfer.getData('application/json')
  if (!raw) return

  try {
    const data = JSON.parse(raw)
    const targetEl = findSeatElement(e.target)
    if (!targetEl) return
    const targetSeatId = targetEl.dataset.seatId
    if (!targetSeatId) return

    if (data.type === 'student') {
      handleAssignStudent(targetSeatId, data.studentId)
    } else if (data.type === 'seat') {
      if (data.seatId !== targetSeatId) {
        swapSeats(data.seatId, targetSeatId)
      }
    }
  } catch {
    // ignore
  }
}

const findSeatElement = (el) => {
  let current = el
  while (current && current !== viewportRef.value) {
    if (current.dataset && current.dataset.seatId) {
      return current
    }
    current = current.parentElement
  }
  return null
}

// ==================== 触摸自定义事件 ====================
const handleTouchSeatDrop = (e) => {
  const { sourceSeatId, targetSeatId } = e.detail
  if (sourceSeatId !== targetSeatId) {
    swapSeats(sourceSeatId, targetSeatId)
  }
}

const handleTouchStudentDrop = (e) => {
  const { studentId, targetSeatId } = e.detail
  handleAssignStudent(targetSeatId, studentId)
}

// ==================== 初始化 ====================
onMounted(() => {
  initializeSeats()

  if (viewportRef.value) {
    viewportRef.value.addEventListener('touch-seat-drop', handleTouchSeatDrop)
  }
  document.addEventListener('touch-student-drop', handleTouchStudentDrop)

  // 首次自适应
  nextTick(() => {
    setTimeout(fitToViewport, 100)
  })
})

onUnmounted(() => {
  if (viewportRef.value) {
    viewportRef.value.removeEventListener('touch-seat-drop', handleTouchSeatDrop)
  }
  document.removeEventListener('touch-student-drop', handleTouchStudentDrop)
})

// 配置变化时重新自适应
watch(
  () => [seatConfig.value.groupCount, seatConfig.value.columnsPerGroup, seatConfig.value.seatsPerColumn],
  () => {
    nextTick(() => {
      setTimeout(fitToViewport, 100)
    })
  }
)

// 窗口大小变化时重新自适应
let resizeObserver = null
onMounted(() => {
  if (viewportRef.value) {
    resizeObserver = new ResizeObserver(() => {
      fitToViewport()
    })
    resizeObserver.observe(viewportRef.value)
  }
})
onUnmounted(() => {
  resizeObserver?.disconnect()
})

// 计算总座位数
const totalSeats = computed(() => {
  return seatConfig.value.groupCount *
    seatConfig.value.columnsPerGroup *
    seatConfig.value.seatsPerColumn
})

// 处理分配学生
const handleAssignStudent = (seatId, studentId) => {
  const existingSeat = findSeatByStudent(studentId)
  if (existingSeat) {
    clearSeat(existingSeat.id)
  }
  assignStudent(seatId, studentId)
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
    setFirstSelectedSeat(seatId)
  } else if (firstSelectedSeat.value === seatId) {
    clearFirstSelectedSeat()
  } else {
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
  overflow: hidden;
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

/* 缩放视口 — 无滚动条 */
.seat-chart-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.seat-chart-viewport.is-panning {
  cursor: grabbing;
}

.seat-chart {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  padding: 30px 20px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  /* 默认居中，由 JS 控制 transform */
  margin-left: 0;
  margin-top: 0;
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
  width: 120px;
}

/* ==================== 缩放控件 ==================== */
.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 10;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #23587b;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.zoom-btn:hover:not(:disabled) {
  background: #e8f4f8;
}

.zoom-btn:active:not(:disabled) {
  background: #d0e9f2;
  transform: scale(0.92);
}

.zoom-btn:disabled {
  color: #bbb;
  cursor: not-allowed;
}

.zoom-label {
  min-width: 52px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.zoom-label:hover {
  background: #f0f0f0;
  color: #23587b;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .seat-chart-info {
    flex-wrap: wrap;
    justify-content: center;
    padding: 10px 15px;
    font-size: 12px;
    gap: 4px;
  }

  .seat-chart {
    gap: 20px;
    padding: 20px 12px;
  }

  .group-label {
    font-size: 13px;
    padding: 6px 10px;
  }

  .group-content {
    gap: 10px;
  }

  .seat-column {
    width: 100px;
    gap: 8px;
  }

  .zoom-controls {
    bottom: 10px;
    right: 10px;
  }
}

@media (max-width: 480px) {
  .seat-chart-info {
    font-size: 11px;
    padding: 8px 10px;
  }

  .seat-chart {
    gap: 12px;
    padding: 14px 8px;
  }

  .group-label {
    font-size: 12px;
    padding: 5px 8px;
    border-radius: 6px;
  }

  .seat-group {
    gap: 8px;
  }

  .group-content {
    gap: 8px;
  }

  .seat-column {
    width: 90px;
    gap: 6px;
  }

  .zoom-controls {
    bottom: 8px;
    right: 8px;
    padding: 3px;
  }

  .zoom-btn {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }

  .zoom-label {
    min-width: 44px;
    height: 28px;
    font-size: 11px;
  }
}
</style>
