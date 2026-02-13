<template>
  <div class="tag-manager">
    <div class="tag-header">
      <h4>标签管理</h4>
      <button class="add-tag-btn" @click="showAddDialog">+ 新建标签</button>
    </div>
    <div class="tag-list">
      <EmptyState
        v-if="tags.length === 0"
        type="tag"
        message="暂无标签"
        hint="点击右上角添加标签"
      />
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="tag-item"
        :style="{ borderColor: tag.color }"
      >
        <span class="tag-dot" :style="{ background: tag.color }"></span>
        <span class="tag-name">{{ tag.name }}</span>
        <div class="tag-actions">
          <button class="tag-action-btn" @click="editTagHandler(tag)">编辑</button>
          <button
            class="tag-action-btn delete"
            :class="{ confirming: isDeletingTag(tag.id).value }"
            @click="deleteTagHandler(tag.id, tag.name)"
          >
            {{ isDeletingTag(tag.id).value ? '再次点击' : '删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑标签对话框 -->
    <div v-if="dialogVisible" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <h3>{{ isEditing ? '编辑标签' : '新建标签' }}</h3>
        <div class="form-group">
          <label>标签名称:</label>
          <input
            v-model="currentTag.name"
            type="text"
            placeholder="请输入标签名称"
            @keyup.enter="saveTag"
            ref="nameInputRef"
          />
        </div>
        <div class="form-group">
          <label>标签颜色:</label>
          <div class="color-picker">
            <input
              v-model="currentTag.color"
              type="color"
            />
            <span class="color-value">{{ currentTag.color }}</span>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="closeDialog">取消</button>
          <button class="btn-confirm" @click="saveTag">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import EmptyState from '../ui/EmptyState.vue'
import { getNextColor } from '@/constants/tagColors'
import { useConfirmAction } from '@/composables/useConfirmAction'
import { useLogger } from '@/composables/useLogger'

const props = defineProps({
  tags: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['add-tag', 'edit-tag', 'delete-tag'])

const { requestConfirm, isConfirming } = useConfirmAction()
const { warning } = useLogger()

const dialogVisible = ref(false)
const isEditing = ref(false)
const currentTag = ref({ id: null, name: '', color: '#23587b' })
const nameInputRef = ref(null)

const showAddDialog = () => {
  isEditing.value = false
  // 为新标签自动选择下一个颜色
  const nextColor = getNextColor(props.tags.length)
  currentTag.value = { id: null, name: '', color: nextColor }
  dialogVisible.value = true

  // 聚焦到输入框
  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

const editTagHandler = (tag) => {
  isEditing.value = true
  currentTag.value = { ...tag }
  dialogVisible.value = true

  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

const closeDialog = () => {
  dialogVisible.value = false
  currentTag.value = { id: null, name: '', color: '#23587b' }
}

const saveTag = () => {
  if (!currentTag.value.name.trim()) {
    alert('请输入标签名称')
    return
  }

  if (isEditing.value) {
    emit('edit-tag', currentTag.value.id, {
      name: currentTag.value.name,
      color: currentTag.value.color
    })
  } else {
    emit('add-tag', {
      name: currentTag.value.name,
      color: currentTag.value.color
    })
  }
  closeDialog()
}

// 删除标签确认状态
const getDeletingKey = (tagId) => `deleteTag-${tagId}`
const isDeletingTag = (tagId) => isConfirming(getDeletingKey(tagId))

const deleteTagHandler = (tagId, tagName) => {
  const confirmed = requestConfirm(
    getDeletingKey(tagId),
    () => emit('delete-tag', tagId),
    `确定要删除标签"${tagName}"吗？将从所有学生中移除`
  )

  if (!confirmed) {
    warning(`请再次点击删除按钮以确认删除标签"${tagName}"`)
  }
}
</script>

<style scoped>
.tag-manager {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.tag-header h4 {
  margin: 0;
  color: #23587b;
  font-size: 16px;
  font-weight: 600;
}

.add-tag-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

.add-tag-btn:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  transform: translateY(-1px);
}

.add-tag-btn:active {
  transform: translateY(0);
}

.tag-list {
  padding: 10px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 80px;
  max-height: 140px;
  overflow-y: auto;
}

.tag-list::-webkit-scrollbar {
  height: 6px;
}

.tag-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.tag-list::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 3px;
}

.tag-list::-webkit-scrollbar-thumb:hover {
  background: #888;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #f8f9fa;
  border: 2px solid;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.tag-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.tag-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
  color: #333;
  font-weight: 500;
}

.tag-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.tag-action-btn {
  padding: 3px 10px;
  background: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  font-weight: 500;
}

.tag-action-btn:hover {
  background: #d0d0d0;
}

.tag-action-btn.delete:hover {
  background: #f44336;
  color: white;
}

.tag-action-btn.delete.confirming {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%) !important;
  color: white !important;
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

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog {
  background: white;
  padding: 28px;
  border-radius: 12px;
  min-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog h3 {
  margin: 0 0 24px 0;
  color: #23587b;
  font-size: 20px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: #23587b;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 14px;
}

.color-picker input[type="color"] {
  width: 70px;
  height: 40px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.color-picker input[type="color"]:hover {
  border-color: #23587b;
}

.color-value {
  color: #666;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #e0e0e0;
  color: #333;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

.btn-confirm {
  background: linear-gradient(135deg, #23587b 0%, #2d6a94 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(35, 88, 123, 0.2);
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #1a4460 0%, #234e6d 100%);
  box-shadow: 0 4px 10px rgba(35, 88, 123, 0.3);
  transform: translateY(-1px);
}

.btn-confirm:active {
  transform: translateY(0);
}
</style>
