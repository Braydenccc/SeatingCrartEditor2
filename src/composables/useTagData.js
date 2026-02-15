import { ref } from 'vue'
import { DEFAULT_TAGS, getNextColor } from '@/constants/tagColors'

// 标签数据管理
const tags = ref([])
let nextTagId = 1
let colorIndex = 0

// 初始化默认标签
export function initializeTags() {
  if (tags.value.length === 0) {
    DEFAULT_TAGS.forEach(tag => {
      tags.value.push({
        id: nextTagId++,
        name: tag.name,
        color: tag.color
      })
    })
    colorIndex = DEFAULT_TAGS.length
  }
}

export function useTagData() {
  // 添加标签
  const addTag = (tagData) => {
    const color = tagData.color || getNextColor(colorIndex++)
    tags.value.push({
      id: nextTagId++,
      name: tagData.name,
      color: color
    })
  }

  // 编辑标签
  const editTag = (tagId, tagData) => {
    const tag = tags.value.find(t => t.id === tagId)
    if (tag) {
      tag.name = tagData.name
      tag.color = tagData.color
    }
  }

  // 删除标签
  const deleteTag = (tagId) => {
    tags.value = tags.value.filter(t => t.id !== tagId)
  }

  // 清除所有标签
  const clearAllTags = () => {
    tags.value = []
    nextTagId = 1
    colorIndex = 0
  }

  return {
    tags,
    addTag,
    editTag,
    deleteTag,
    clearAllTags
  }
}
