<template>
  <div
    class="student-item"
    :class="{ selected: isSelected }"
    @click="handleSelectStudent"
  >
    <div class="student-info">
      <div class="student-number-section">
        <input
          v-if="isEditingNumber"
          v-model.number="editStudentNumber"
          type="number"
          min="1"
          class="student-number-input"
          @blur="saveStudentNumber"
          @keyup.enter="saveStudentNumber"
          ref="numberInput"
          placeholder="学号"
        />
        <span
          v-else
          class="student-number"
          :class="{ empty: !student.studentNumber }"
          @dblclick="startEditNumber"
        >
          {{ student.studentNumber || '未设置' }}
        </span>
      </div>

      <div class="student-name-section">
        <input
          v-if="isEditingName"
          v-model="editName"
          type="text"
          class="student-name-input"
          @blur="saveName"
          @keyup.enter="saveName"
          ref="nameInput"
          placeholder="姓名"
        />
        <span
          v-else
          class="student-name"
          :class="{ empty: !student.name }"
          @dblclick="startEditName"
        >
          {{ student.name || '未命名' }}
        </span>
      </div>

      <div class="student-tags">
        <span
          v-for="tagId in student.tags"
          :key="tagId"
          class="student-tag"
          :style="{ background: getTagColor(tagId) }"
        >
          {{ getTagName(tagId) }}
          <button class="remove-tag-btn" @click="removeTag(tagId)">×</button>
        </span>
        <button ref="addBtnRef" class="add-tag-to-student-btn" @click.stop="toggleTagPicker">+</button>
      </div>
    </div>

    <div class="student-actions">
      <button class="delete-student-btn" @click="deleteHandler">删除</button>
    </div>

    <!-- 标签选择器 (teleport 到 body 避免被父容器裁剪) -->
    <teleport to="body">
      <div v-if="showTagPicker" class="tag-picker" ref="tagPickerRef" :style="tagPickerStyle" @click.stop>
        <div
          v-for="tag in availableTagsForStudent"
          :key="tag.id"
          class="tag-option"
          @click="addTagToStudent(tag.id)"
        >
          <span class="tag-dot" :style="{ background: tag.color }"></span>
          <span>{{ tag.name }}</span>
        </div>
        <div v-if="availableTagsForStudent.length === 0" class="no-tags">
          暂无可添加的标签
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useStudentData } from '@/composables/useStudentData'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  availableTags: {
    type: Array,
    required: false,
    default: () => []
  }
})

const emit = defineEmits(['update-student', 'delete-student'])

const { selectedStudentId, selectStudent } = useStudentData()

const isEditingName = ref(false)
const isEditingNumber = ref(false)
const editName = ref('')
const editStudentNumber = ref(null)
const nameInput = ref(null)
const numberInput = ref(null)
const showTagPicker = ref(false)
const tagPickerRef = ref(null)
const addBtnRef = ref(null)
const tagPickerStyle = ref({})

// 获取可以添加的标签(排除已添加的)
const availableTagsForStudent = computed(() => {
  return props.availableTags.filter(tag => !props.student.tags.includes(tag.id))
})

const getTagName = (tagId) => {
  const tag = props.availableTags.find(t => t.id === tagId)
  return tag ? tag.name : ''
}

const getTagColor = (tagId) => {
  const tag = props.availableTags.find(t => t.id === tagId)
  return tag ? tag.color : '#999'
}

// 是否为当前选中的学生
const isSelected = computed(() => {
  return selectedStudentId.value === props.student.id
})

// 点击学生项进行选中
const handleSelectStudent = (event) => {
  // 如果点击的是按钮或输入框,不触发选中
  const target = event.target
  if (target.closest('button') || target.tagName === 'INPUT') {
    return
  }

  // 切换选中状态
  if (isSelected.value) {
    selectStudent(null)
  } else {
    selectStudent(props.student.id)
  }
}

// 点击外部关闭标签选择器
const handleClickOutside = (event) => {
  if (!showTagPicker.value) return

  const clickedInsidePicker = tagPickerRef.value && tagPickerRef.value.contains(event.target)
  const clickedAddBtn = event.target.closest && event.target.closest('.add-tag-to-student-btn')

  if (!clickedInsidePicker && !clickedAddBtn) {
    showTagPicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
})

// 学号编辑
const startEditNumber = () => {
  isEditingNumber.value = true
  editStudentNumber.value = props.student.studentNumber
  nextTick(() => {
    numberInput.value?.focus()
  })
}

const saveStudentNumber = () => {
  if (editStudentNumber.value !== props.student.studentNumber) {
    emit('update-student', props.student.id, {
      name: props.student.name,
      studentNumber: editStudentNumber.value || null,
      tags: props.student.tags
    })
  }
  isEditingNumber.value = false
}

// 姓名编辑
const startEditName = () => {
  isEditingName.value = true
  editName.value = props.student.name
  nextTick(() => {
    nameInput.value?.focus()
  })
}

const saveName = () => {
  if (editName.value !== props.student.name) {
    emit('update-student', props.student.id, {
      name: editName.value,
      studentNumber: props.student.studentNumber,
      tags: props.student.tags
    })
  }
  isEditingName.value = false
}

const computeTagPickerPosition = () => {
  const btn = addBtnRef.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const width = 220
  const margin = 8
  let left = rect.left + window.scrollX
  // avoid overflow to the right
  if (left + width + margin > window.innerWidth) {
    left = Math.max(margin, window.innerWidth - width - margin)
  }
  // avoid overflow to the left
  if (left < margin) left = margin
  tagPickerStyle.value = {
    position: 'absolute',
    top: `${rect.bottom + window.scrollY + 6}px`,
    left: `${left}px`,
    minWidth: `${width}px`,
    zIndex: 9999
  }
}

const onWindowChange = () => {
  computeTagPickerPosition()
}

const toggleTagPicker = async () => {
  showTagPicker.value = !showTagPicker.value
  if (showTagPicker.value) {
    await nextTick()
    computeTagPickerPosition()
    window.addEventListener('resize', onWindowChange)
    window.addEventListener('scroll', onWindowChange, true)
  } else {
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('scroll', onWindowChange, true)
  }
}

const addTagToStudent = (tagId) => {
  const newTags = [...props.student.tags, tagId]
  emit('update-student', props.student.id, {
    name: props.student.name,
    studentNumber: props.student.studentNumber,
    tags: newTags
  })
  showTagPicker.value = false
}

const removeTag = (tagId) => {
  const newTags = props.student.tags.filter(tid => tid !== tagId)
  emit('update-student', props.student.id, {
    name: props.student.name,
    studentNumber: props.student.studentNumber,
    tags: newTags
  })
}

const deleteHandler = () => {
  const displayName = props.student.name || '未命名学生'
  if (confirm(`确定要删除"${displayName}"吗?`)) {
    emit('delete-student', props.student.id)
  }
}
</script>

<style scoped>
.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  margin-bottom: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  position: relative;
  border: 1px solid #f0f0f0;
  cursor: pointer;
}

.student-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
  border-color: #e0e0e0;
}

.student-item.selected {
  background: linear-gradient(135deg, #e8f4f8 0%, #d0e9f2 100%);
  border: 2px solid #23587b;
  box-shadow: 0 4px 16px rgba(35, 88, 123, 0.25);
  transform: translateY(-2px);
}

.student-item.selected:hover {
  box-shadow: 0 6px 20px rgba(35, 88, 123, 0.3);
}

.student-info {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
}

.student-number-section {
  min-width: 80px;
  flex-shrink: 0;
}

.student-number {
  display: inline-block;
  padding: 6px 12px;
  font-size: 15px;
  font-weight: 600;
  color: #23587b;
  background: #e8f4f8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
  text-align: center;
}

.student-number:hover {
  background: #d0e9f2;
}

.student-number.empty {
  color: #999;
  background: #f5f5f5;
  font-weight: 400;
  font-size: 13px;
}

.student-number-input {
  width: 80px;
  padding: 6px 12px;
  font-size: 15px;
  font-weight: 600;
  border: 2px solid #23587b;
  border-radius: 6px;
  outline: none;
  text-align: center;
}

.student-number-input::-webkit-inner-spin-button,
.student-number-input::-webkit-outer-spin-button {
  opacity: 1;
}

.student-name-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.student-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
  min-height: 28px;
  display: flex;
  align-items: center;
}

.student-name:hover {
  background: #f0f0f0;
}

.student-name.empty {
  color: #999;
  font-style: italic;
}

.student-name-input {
  padding: 4px 8px;
  font-size: 16px;
  font-weight: 500;
  border: 2px solid #23587b;
  border-radius: 4px;
  outline: none;
}

.student-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
}

.student-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
}

.remove-tag-btn {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  transition: background 0.2s;
}

.remove-tag-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.add-tag-to-student-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e0e0e0;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 0;
  color: #666;
  transition: all 0.2s;
  padding: 0;
}

.add-tag-to-student-btn:hover {
  background: #23587b;
  color: white;
}

.student-actions {
  margin-left: 12px;
}

.delete-student-btn {
  padding: 7px 14px;
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.2);
}

.delete-student-btn:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
  transform: translateY(-1px);
}

.delete-student-btn:active {
  transform: translateY(0);
}

.tag-picker {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  background: white;
  border: 2px solid #23587b;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  min-width: 220px;
  max-height: 240px;
  overflow-y: auto;
}

.tag-picker::-webkit-scrollbar {
  width: 6px;
}

.tag-picker::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.tag-picker::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 3px;
}

.tag-picker::-webkit-scrollbar-thumb:hover {
  background: #888;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  color: #333;
  font-size: 15px;
  font-weight: 500;
}

.tag-option:hover {
  background: #e8f4f8;
}

.tag-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.no-tags {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
