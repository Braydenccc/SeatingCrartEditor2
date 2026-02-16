<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h3>座位联系编辑</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <!-- 联系关系列表 -->
        <div class="relation-list">
          <h4>当前联系关系 <span class="relation-count" v-if="relations.length > 0">({{ relations.length }})</span></h4>
          <div v-if="relations.length === 0" class="empty-relation">
            暂无联系关系，请在下方添加
          </div>
          <div v-for="relation in relations" :key="relation.id" class="relation-item"
            :style="{ '--rel-color': RELATION_COLORS[relation.relationType] }">
            <div class="relation-badge" :style="{ background: RELATION_COLORS[relation.relationType] }">
              {{ RELATION_LABELS[relation.relationType] }}
            </div>
            <div class="relation-students">
              <span class="student-name-tag">{{ getStudentName(relation.studentId1) }}</span>
              <span class="relation-sep">—</span>
              <span class="student-name-tag">{{ getStudentName(relation.studentId2) }}</span>
            </div>
            <div class="relation-meta">
              <span class="strength-pill"
                :style="{ background: STRENGTH_COLORS[relation.strength], color: relation.strength === 'low' ? '#fff' : '#fff' }">
                {{ STRENGTH_LABELS[relation.strength] }}
              </span>
              <span v-if="relation.relationType === 'repulsion'" class="distance-info">
                距离≥{{ relation.metadata?.minDistance || 2 }}
              </span>
            </div>
            <button class="delete-relation-btn" :class="{ confirming: isDeletingRelation(relation.id).value }"
              @click="handleDeleteRelation(relation)">
              {{ isDeletingRelation(relation.id).value ? '确认' : '×' }}
            </button>
          </div>
        </div>

        <!-- 添加联系表单 -->
        <div class="add-relation-form">
          <h4>添加新联系</h4>

          <!-- 关系类型选择器（卡片式） -->
          <div class="type-cards">
            <div v-for="typeKey in relationTypeKeys" :key="typeKey" class="type-card"
              :class="{ active: selectedRelationType === typeKey }"
              :style="{ '--card-color': RELATION_COLORS[typeKey] }" @click="selectRelationType(typeKey)">
              <span class="type-icon" v-html="TYPE_SVGS[typeKey]"></span>
              <span class="type-label">{{ RELATION_LABELS[typeKey] }}</span>
              <span class="type-desc">{{ RELATION_DESCRIPTIONS[typeKey] }}</span>
            </div>
          </div>

          <!-- 学生选择行 -->
          <div class="student-row">
            <div class="student-select-wrapper">
              <label>学生 A</label>
              <select v-model="selectedStudent1" class="student-select">
                <option :value="null">选择学生</option>
                <option v-for="student in availableStudents" :key="student.id" :value="student.id">
                  {{ student.studentNumber || '-' }} {{ student.name || '未命名' }}
                </option>
              </select>
            </div>

            <div class="student-select-wrapper">
              <label>学生 B</label>
              <select v-model="selectedStudent2" class="student-select">
                <option :value="null">选择学生</option>
                <option v-for="student in availableStudents2" :key="student.id" :value="student.id">
                  {{ student.studentNumber || '-' }} {{ student.name || '未命名' }}
                </option>
              </select>
            </div>
          </div>

          <!-- 高级选项 -->
          <div class="advanced-options">
            <!-- 优先级（非硬约束时可选） -->
            <div class="option-row">
              <label class="option-label">优先级：</label>
              <div class="strength-selector">
                <label v-for="strength in ['high', 'medium', 'low']" :key="strength" class="strength-option" :class="{
                  active: currentStrength === strength,
                  disabled: isHardConstraint
                }"
                  :style="currentStrength === strength ? { background: STRENGTH_COLORS[strength], borderColor: STRENGTH_COLORS[strength] } : {}">
                  <input type="radio" v-model="selectedStrength" :value="strength" :disabled="isHardConstraint" />
                  <span class="strength-label">{{ STRENGTH_LABELS[strength] }}</span>
                  <span class="strength-desc">{{ STRENGTH_DESCRIPTIONS[strength] }}</span>
                </label>
              </div>
              <span v-if="isHardConstraint" class="hard-hint">此类型为硬约束，优先级固定为"必须"</span>
            </div>

            <!-- 排斥关系的最小距离 -->
            <div v-if="selectedRelationType === 'repulsion'" class="option-row">
              <label class="option-label">最小距离：</label>
              <select v-model.number="minDistance" class="distance-select">
                <option :value="2">2个座位</option>
                <option :value="3">3个座位</option>
                <option :value="4">4个座位</option>
                <option :value="5">5个座位</option>
              </select>
              <span class="distance-hint">（按座位图距离计算）</span>
            </div>
          </div>

          <!-- 冲突警告 -->
          <div v-if="conflictWarning" class="conflict-warning">
            ⚠️ {{ conflictWarning }}
          </div>

          <button class="add-relation-btn"
            :style="canAddRelation ? { background: RELATION_COLORS[selectedRelationType] } : {}"
            :disabled="!canAddRelation" @click="handleAddRelation">
            添加{{ RELATION_LABELS[selectedRelationType] }}联系
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <span class="footer-stats" v-if="relations.length > 0">
          共 {{ relations.length }} 条联系
        </span>
        <button class="btn-secondary" @click="close">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStudentData } from '@/composables/useStudentData'
import { useSeatRelation } from '@/composables/useSeatRelation'
import { useConfirmAction } from '@/composables/useConfirmAction'
import { useLogger } from '@/composables/useLogger'
import {
  RelationType,
  RelationStrength,
  RELATION_LABELS,
  RELATION_ICONS,
  RELATION_COLORS,
  RELATION_DESCRIPTIONS,
  STRENGTH_LABELS,
  STRENGTH_DESCRIPTIONS,
  STRENGTH_COLORS,
  IS_HARD_CONSTRAINT
} from '@/constants/relationTypes.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const { students } = useStudentData()
const {
  relations,
  addRelation,
  deleteRelation,
  hasRelation,
  getRelationBetween
} = useSeatRelation()
const { requestConfirm, isConfirming } = useConfirmAction()
const { warning } = useLogger()

// 关系类型 keys
const relationTypeKeys = Object.values(RelationType)

// 卡片 SVG 图标
const TYPE_SVGS = {
  // 吸引：双箭头相向
  attraction: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 12h10"/>
    <path d="M3 12l4 4M3 12l4-4"/>
    <path d="M21 12l-4-4M21 12l-4 4"/>
  </svg>`,
  // 排斥：两个箭头相背
  repulsion: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 12h10"/>
    <path d="M10 8l-4 4 4 4"/>
    <path d="M14 8l4 4-4 4"/>
  </svg>`,
  // 同桌绑定：锁链
  seatmate_binding: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>`,
  // 同桌排斥：断开的锁链
  seatmate_repulsion: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    <line x1="4" y1="4" x2="20" y2="20" stroke-width="2.5"/>
  </svg>`
}

// 表单状态
const selectedStudent1 = ref(null)
const selectedStudent2 = ref(null)
const selectedRelationType = ref(RelationType.ATTRACTION)
const selectedStrength = ref(RelationStrength.HIGH)
const minDistance = ref(2)

// 是否为硬约束
const isHardConstraint = computed(() => IS_HARD_CONSTRAINT[selectedRelationType.value])

// 当前实际使用的强度（硬约束强制 HIGH）
const currentStrength = computed(() =>
  isHardConstraint.value ? RelationStrength.HIGH : selectedStrength.value
)

// 选择关系类型
const selectRelationType = (type) => {
  selectedRelationType.value = type
  if (IS_HARD_CONSTRAINT[type]) {
    selectedStrength.value = RelationStrength.HIGH
  }
}

// 重置表单
const resetForm = () => {
  selectedStudent1.value = null
  selectedStudent2.value = null
  selectedRelationType.value = RelationType.ATTRACTION
  selectedStrength.value = RelationStrength.HIGH
  minDistance.value = 2
}

// 当模态框关闭时重置表单
watch(() => props.visible, (visible) => {
  if (!visible) {
    resetForm()
  }
})

// 获取学生姓名
const getStudentName = (studentId) => {
  const student = students.value.find(s => s.id === studentId)
  if (!student) return '未知学生'
  const number = student.studentNumber ? `${student.studentNumber}` : '-'
  const name = student.name || '未命名'
  return `${number} ${name}`
}

// 可选学生列表
const availableStudents = computed(() => {
  return students.value.filter(s => s.id !== selectedStudent2.value)
})

const availableStudents2 = computed(() => {
  return students.value.filter(s => s.id !== selectedStudent1.value)
})

// 冲突警告
const conflictWarning = computed(() => {
  if (!selectedStudent1.value || !selectedStudent2.value) return ''

  const existingRelation = getRelationBetween(
    selectedStudent1.value,
    selectedStudent2.value
  )

  if (existingRelation) {
    if (existingRelation.relationType === selectedRelationType.value) {
      return '该联系关系已存在'
    } else {
      return `已存在"${RELATION_LABELS[existingRelation.relationType]}"关系，添加后可能产生冲突`
    }
  }

  return ''
})

// 是否可以添加联系
const canAddRelation = computed(() => {
  if (!selectedStudent1.value || !selectedStudent2.value) return false
  if (selectedStudent1.value === selectedStudent2.value) return false

  const exists = hasRelation(
    selectedStudent1.value,
    selectedStudent2.value,
    selectedRelationType.value
  )

  return !exists
})

// 添加联系
const handleAddRelation = () => {
  if (!canAddRelation.value) return

  let metadata = {}

  if (selectedRelationType.value === RelationType.REPULSION) {
    metadata = { minDistance: minDistance.value, allowAdjacent: false, allowCrossGroup: true }
  } else if (selectedRelationType.value === RelationType.ATTRACTION) {
    metadata = { allowAdjacent: true, minDistance: 0, allowCrossGroup: true }
  } else if (selectedRelationType.value === RelationType.SEATMATE_BINDING) {
    metadata = { allowCrossGroup: false }
  } else if (selectedRelationType.value === RelationType.SEATMATE_REPULSION) {
    metadata = { allowCrossGroup: true }
  }

  const result = addRelation(
    selectedStudent1.value,
    selectedStudent2.value,
    selectedRelationType.value,
    currentStrength.value,
    metadata
  )

  if (result) {
    resetForm()
  } else {
    alert('添加联系关系失败')
  }
}

// 删除联系
const getDeletingKey = (relationId) => `deleteRelation-${relationId}`
const isDeletingRelation = (relationId) => isConfirming(getDeletingKey(relationId))

const handleDeleteRelation = (relation) => {
  const student1Name = getStudentName(relation.studentId1)
  const student2Name = getStudentName(relation.studentId2)
  const relationType = RELATION_LABELS[relation.relationType]

  const confirmed = requestConfirm(
    getDeletingKey(relation.id),
    () => deleteRelation(relation.id),
    `确定要删除"${student1Name}"和"${student2Name}"的${relationType}关系吗？`
  )

  if (!confirmed) {
    warning(`请再次点击删除按钮以确认删除联系关系`)
  }
}

// 关闭模态框
const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #23587b;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.modal-body h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #23587b;
}

.relation-count {
  font-weight: 400;
  color: #999;
  font-size: 13px;
}

/* ==================== 关系列表 ==================== */
.relation-list {
  margin-bottom: 24px;
}

.empty-relation {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #e0e0e0;
}

.relation-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 6px;
  background: #fafafa;
  border: 1px solid #eee;
  border-left: 3px solid var(--rel-color);
  border-radius: 6px;
  transition: all 0.15s;
  gap: 10px;
}

.relation-item:hover {
  background: #f0f4f8;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.relation-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  flex-shrink: 0;
}

.relation-students {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.student-name-tag {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.relation-sep {
  font-size: 13px;
  color: #ccc;
  flex-shrink: 0;
}

.relation-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.strength-pill {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.distance-info {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
}

.delete-relation-btn {
  width: 26px;
  height: 26px;
  background: transparent;
  color: #ccc;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  line-height: 1;
}

.delete-relation-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #dc2626;
}

.delete-relation-btn.confirming {
  background: #fff7ed !important;
  color: #ea580c !important;
  border-color: #ea580c !important;
  animation: pulse-rel 0.6s ease-in-out infinite;
  font-size: 11px;
}

@keyframes pulse-rel {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.15);
  }
}

/* ==================== 添加表单 ==================== */
.add-relation-form {
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

/* 关系类型卡片 */
.type-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  background: white;
  gap: 4px;
}

.type-card:hover {
  border-color: var(--card-color);
  background: color-mix(in srgb, var(--card-color) 5%, #fff);
}

.type-card.active {
  border-color: var(--card-color);
  background: color-mix(in srgb, var(--card-color) 10%, #fff);
  box-shadow: 0 0 0 1px var(--card-color);
}

.type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--card-color);
  line-height: 1;
}

.type-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.type-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.type-desc {
  font-size: 10px;
  color: #999;
  line-height: 1.3;
}

/* 学生选择行 */
.student-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 16px;
}

.student-select-wrapper {
  flex: 1;
}

.student-select-wrapper label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  font-weight: 500;
}

.relation-arrow {
  font-size: 20px;
  font-weight: 700;
  padding-bottom: 8px;
  flex-shrink: 0;
}

.student-select {
  width: 100%;
  padding: 9px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.student-select:focus {
  border-color: #23587b;
}

/* 高级选项 */
.advanced-options {
  background: #f8f9fa;
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 14px;
}

.option-row {
  margin-bottom: 10px;
}

.option-row:last-child {
  margin-bottom: 0;
}

.option-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

/* 优先级选择器 */
.strength-selector {
  display: flex;
  gap: 6px;
}

.strength-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  background: white;
  gap: 2px;
}

.strength-option input[type="radio"] {
  display: none;
}

.strength-option.active {
  color: white;
  border-color: transparent;
}

.strength-option.active .strength-label,
.strength-option.active .strength-desc {
  color: white;
}

.strength-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.strength-option.disabled.active {
  opacity: 1;
}

.strength-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

.strength-desc {
  font-size: 10px;
  color: #999;
  line-height: 1.2;
}

.hard-hint {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 6px;
  font-style: italic;
}

/* 距离选择 */
.distance-select {
  padding: 6px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.distance-select:focus {
  border-color: #23587b;
}

.distance-hint {
  font-size: 11px;
  color: #999;
  margin-left: 8px;
}

/* 冲突警告 */
.conflict-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #856404;
}

/* 添加按钮 */
.add-relation-btn {
  width: 100%;
  padding: 11px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  background: #ccc;
}

.add-relation-btn:hover:not(:disabled) {
  filter: brightness(0.9);
  transform: translateY(-1px);
}

.add-relation-btn:disabled {
  background: #ccc !important;
  cursor: not-allowed;
  transform: none !important;
}

/* ==================== Modal Footer ==================== */
.modal-footer {
  padding: 14px 24px;
  border-top: 2px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-stats {
  font-size: 12px;
  color: #999;
}

.btn-secondary {
  padding: 9px 18px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header {
    padding: 16px 18px;
  }

  .modal-header h3 {
    font-size: 18px;
  }

  .modal-body {
    padding: 16px 18px;
  }

  .type-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .student-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .relation-arrow {
    text-align: center;
    padding: 0;
  }

  .student-select {
    min-height: 44px;
    font-size: 15px;
    padding: 10px 12px;
  }

  .strength-selector {
    flex-wrap: wrap;
  }

  .strength-option {
    min-height: 44px;
  }

  .relation-item {
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 12px;
    min-height: 44px;
  }

  .relation-students {
    width: 100%;
    order: 1;
  }

  .relation-meta {
    order: 2;
  }

  .delete-relation-btn {
    order: 3;
    margin-left: auto;
    width: 32px;
    height: 32px;
  }

  .add-relation-btn {
    min-height: 44px;
    font-size: 15px;
  }

  .distance-select {
    min-height: 44px;
    font-size: 15px;
  }

  .modal-footer {
    padding: 14px 18px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom, 0));
  }
}

@media (max-width: 480px) {
  .modal-header h3 {
    font-size: 16px;
  }

  .modal-body h4 {
    font-size: 14px;
  }

  .type-card {
    padding: 10px 4px;
  }

  .type-icon {
    font-size: 18px;
  }

  .type-label {
    font-size: 12px;
  }

  .type-desc {
    font-size: 9px;
  }

  .strength-option {
    padding: 6px 4px;
  }

  .strength-label {
    font-size: 13px;
  }

  .option-row .distance-select,
  .option-row .distance-hint {
    display: inline;
  }
}
</style>
