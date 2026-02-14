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
          <h4>当前联系关系</h4>
          <div v-if="relations.length === 0" class="empty-relation">
            暂无联系关系
          </div>
          <div
            v-for="relation in relations"
            :key="relation.id"
            class="relation-item"
            :class="[`relation-${relation.relationType}`]"
          >
            <div class="relation-badge" :class="[`badge-${relation.relationType}`]">
              {{ RELATION_LABELS[relation.relationType] }}
            </div>
            <div class="relation-students">
              <span class="student-name">{{ getStudentName(relation.studentId1) }}</span>
              <span class="relation-icon" :class="[`icon-${relation.relationType}`]">
                {{ RELATION_ICONS[relation.relationType] }}
              </span>
              <span class="student-name">{{ getStudentName(relation.studentId2) }}</span>
            </div>
            <div class="relation-info">
              <span class="strength-tag" :class="[`strength-${relation.strength}`]">
                {{ STRENGTH_LABELS[relation.strength] }}
              </span>
              <span v-if="relation.relationType === 'repulsion'" class="distance-info">
                距离≥{{ relation.metadata?.minDistance || 2 }}
              </span>
            </div>
            <button
              class="delete-relation-btn"
              :class="{ confirming: isDeletingRelation(relation.id).value }"
              @click="handleDeleteRelation(relation)"
            >
              {{ isDeletingRelation(relation.id).value ? '再次点击' : '删除' }}
            </button>
          </div>
        </div>

        <!-- 添加联系表单 -->
        <div class="add-relation-form">
          <h4>添加新联系</h4>

          <!-- 学生选择行 -->
          <div class="form-row">
            <select v-model="selectedStudent1" class="student-select">
              <option :value="null">选择学生1</option>
              <option
                v-for="student in availableStudents"
                :key="student.id"
                :value="student.id"
              >
                {{ student.studentNumber || '-' }} {{ student.name || '未命名' }}
              </option>
            </select>

            <!-- 关系类型切换 -->
            <div class="relation-type-selector">
              <label class="radio-label" :class="{ active: selectedRelationType === 'attraction' }">
                <input
                  type="radio"
                  v-model="selectedRelationType"
                  value="attraction"
                />
                <span class="radio-text">吸引</span>
              </label>
              <label class="radio-label" :class="{ active: selectedRelationType === 'repulsion' }">
                <input
                  type="radio"
                  v-model="selectedRelationType"
                  value="repulsion"
                />
                <span class="radio-text">排斥</span>
              </label>
            </div>

            <select v-model="selectedStudent2" class="student-select">
              <option :value="null">选择学生2</option>
              <option
                v-for="student in availableStudents2"
                :key="student.id"
                :value="student.id"
              >
                {{ student.studentNumber || '-' }} {{ student.name || '未命名' }}
              </option>
            </select>
          </div>

          <!-- 高级选项 -->
          <div class="advanced-options">
            <div class="option-row">
              <label class="option-label">优先级：</label>
              <div class="strength-selector">
                <label
                  v-for="strength in ['high', 'medium', 'low']"
                  :key="strength"
                  class="strength-option"
                  :class="{ active: selectedStrength === strength }"
                >
                  <input
                    type="radio"
                    v-model="selectedStrength"
                    :value="strength"
                  />
                  <span>{{ STRENGTH_LABELS[strength] }}</span>
                </label>
              </div>
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
              <span class="distance-hint">（不同大组视为满足）</span>
            </div>
          </div>

          <!-- 冲突警告 -->
          <div v-if="conflictWarning" class="conflict-warning">
            ⚠️ {{ conflictWarning }}
          </div>

          <button
            class="add-relation-btn"
            :class="[`btn-${selectedRelationType}`]"
            :disabled="!canAddRelation"
            @click="handleAddRelation"
          >
            添加联系
          </button>
        </div>
      </div>

      <div class="modal-footer">
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
  STRENGTH_LABELS
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

// 表单状态
const selectedStudent1 = ref(null)
const selectedStudent2 = ref(null)
const selectedRelationType = ref(RelationType.ATTRACTION)
const selectedStrength = ref(RelationStrength.HIGH)
const minDistance = ref(2)

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
      return `已存在相反的${RELATION_LABELS[existingRelation.relationType]}关系，添加后可能产生冲突`
    }
  }

  return ''
})

// 是否可以添加联系
const canAddRelation = computed(() => {
  if (!selectedStudent1.value || !selectedStudent2.value) return false
  if (selectedStudent1.value === selectedStudent2.value) return false

  // 检查是否已存在完全相同的关系
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

  const metadata = selectedRelationType.value === RelationType.REPULSION
    ? { minDistance: minDistance.value, allowAdjacent: false }
    : { allowAdjacent: true, minDistance: 0 }

  const result = addRelation(
    selectedStudent1.value,
    selectedStudent2.value,
    selectedRelationType.value,
    selectedStrength.value,
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
  max-width: 700px;
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
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.modal-body h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #23587b;
}

.relation-list {
  margin-bottom: 30px;
}

.empty-relation {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.relation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border: 2px solid;
  border-radius: 8px;
  transition: all 0.2s;
  gap: 12px;
}

.relation-item.relation-attraction {
  border-color: #4CAF50;
}

.relation-item.relation-repulsion {
  border-color: #F44336;
}

.relation-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.relation-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  min-width: 42px;
  text-align: center;
}

.badge-attraction {
  background: #4CAF50;
}

.badge-repulsion {
  background: #F44336;
}

.relation-students {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.student-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.relation-icon {
  font-size: 16px;
  font-weight: 700;
}

.icon-attraction {
  color: #4CAF50;
}

.icon-repulsion {
  color: #F44336;
}

.relation-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-tag {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}

.strength-tag.strength-high {
  background: #ffeb3b;
  color: #333;
}

.strength-tag.strength-medium {
  background: #ffc107;
  color: #333;
}

.strength-tag.strength-low {
  background: #ff9800;
  color: white;
}

.distance-info {
  font-size: 11px;
  color: #666;
}

.delete-relation-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.delete-relation-btn:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
}

.delete-relation-btn.confirming {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%) !important;
  animation: pulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.3);
  }
}

.add-relation-form {
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.student-select {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.student-select:focus {
  border-color: #23587b;
}

.relation-type-selector {
  display: flex;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-label input[type="radio"] {
  display: none;
}

.radio-label .radio-text {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.radio-label.active {
  font-weight: 600;
}

.radio-label.active .radio-text {
  color: white;
}

.radio-label.active:has(input[value="attraction"]) {
  background: #4CAF50;
  border-color: #4CAF50;
}

.radio-label.active:has(input[value="repulsion"]) {
  background: #F44336;
  border-color: #F44336;
}

.advanced-options {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.option-row:last-child {
  margin-bottom: 0;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  min-width: 70px;
}

.strength-selector {
  display: flex;
  gap: 8px;
}

.strength-option {
  padding: 6px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.strength-option input[type="radio"] {
  display: none;
}

.strength-option.active {
  background: #23587b;
  border-color: #23587b;
  color: white;
  font-weight: 600;
}

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
  font-size: 12px;
  color: #999;
}

.conflict-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #856404;
}

.add-relation-btn {
  width: 100%;
  padding: 12px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.add-relation-btn.btn-attraction {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.add-relation-btn.btn-attraction:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
}

.add-relation-btn.btn-repulsion {
  background: linear-gradient(135deg, #F44336 0%, #d32f2f 100%);
}

.add-relation-btn.btn-repulsion:hover:not(:disabled) {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
}

.add-relation-btn:disabled {
  background: #ccc !important;
  cursor: not-allowed;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 2px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* 响应式设计 - 移动设备 */
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

  .form-row {
    flex-direction: column;
    gap: 10px;
  }

  .relation-type-selector {
    width: 100%;
    justify-content: center;
  }

  .student-select {
    width: 100%;
  }

  .option-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .strength-selector {
    width: 100%;
    justify-content: flex-start;
  }

  .relation-item {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 12px;
  }

  .relation-students {
    width: 100%;
  }

  .relation-info {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .modal-header h3 {
    font-size: 16px;
  }

  .modal-body h4 {
    font-size: 14px;
  }

  .radio-label {
    padding: 6px 10px;
  }

  .strength-option {
    padding: 5px 10px;
    font-size: 12px;
  }
}
</style>
