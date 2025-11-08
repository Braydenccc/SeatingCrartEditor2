<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h3>座位绑定编辑</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <!-- 绑定关系列表 -->
        <div class="binding-list">
          <h4>当前绑定关系</h4>
          <div v-if="bindings.length === 0" class="empty-binding">
            暂无绑定关系
          </div>
          <div
            v-for="binding in bindings"
            :key="binding.id"
            class="binding-item"
          >
            <div class="binding-students">
              <span class="student-name">{{ getStudentName(binding.studentId1) }}</span>
              <span class="binding-separator">⇄</span>
              <span class="student-name">{{ getStudentName(binding.studentId2) }}</span>
            </div>
            <button class="delete-binding-btn" @click="handleDeleteBinding(binding.id)">
              删除
            </button>
          </div>
        </div>

        <!-- 添加绑定表单 -->
        <div class="add-binding-form">
          <h4>添加新绑定</h4>
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
            <span class="form-separator">同桌</span>
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
          <button
            class="add-binding-btn"
            :disabled="!canAddBinding"
            @click="handleAddBinding"
          >
            添加绑定
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
import { useSeatBinding } from '@/composables/useSeatBinding'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const { students } = useStudentData()
const { bindings, addBinding, deleteBinding, hasBinding } = useSeatBinding()

const selectedStudent1 = ref(null)
const selectedStudent2 = ref(null)

// 重置表单
const resetForm = () => {
  selectedStudent1.value = null
  selectedStudent2.value = null
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

// 可选学生列表(排除已有绑定的)
const availableStudents = computed(() => {
  return students.value.filter(s => s.id !== selectedStudent2.value)
})

const availableStudents2 = computed(() => {
  return students.value.filter(s => s.id !== selectedStudent1.value)
})

// 是否可以添加绑定
const canAddBinding = computed(() => {
  if (!selectedStudent1.value || !selectedStudent2.value) return false
  if (selectedStudent1.value === selectedStudent2.value) return false
  // 检查是否已存在绑定
  return !hasBinding(selectedStudent1.value, selectedStudent2.value)
})

// 添加绑定
const handleAddBinding = () => {
  if (!canAddBinding.value) return

  const result = addBinding(selectedStudent1.value, selectedStudent2.value)
  if (result) {
    resetForm()
  } else {
    alert('该绑定关系已存在')
  }
}

// 删除绑定
const handleDeleteBinding = (bindingId) => {
  if (confirm('确定要删除这个绑定关系吗?')) {
    deleteBinding(bindingId)
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
  max-width: 600px;
  max-height: 80vh;
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

.binding-list {
  margin-bottom: 30px;
}

.empty-binding {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.binding-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.binding-item:hover {
  background: #e8f4f8;
  border-color: #23587b;
}

.binding-students {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.student-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.binding-separator {
  color: #23587b;
  font-size: 16px;
  font-weight: 700;
}

.delete-binding-btn {
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

.delete-binding-btn:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
}

.add-binding-form {
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

.form-separator {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.add-binding-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #23587b 0%, #2d6a94 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.add-binding-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1a4460 0%, #234e6d 100%);
}

.add-binding-btn:disabled {
  background: #ccc;
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
</style>
