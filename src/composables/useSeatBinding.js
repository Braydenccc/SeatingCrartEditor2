import { ref } from 'vue'

// 座位绑定关系管理
const bindings = ref([])
let nextBindingId = 1

export function useSeatBinding() {
  // 添加绑定关系
  const addBinding = (studentId1, studentId2) => {
    // 检查是否已存在绑定
    const exists = bindings.value.some(b =>
      (b.studentId1 === studentId1 && b.studentId2 === studentId2) ||
      (b.studentId1 === studentId2 && b.studentId2 === studentId1)
    )

    if (exists) {
      return null
    }

    const newBinding = {
      id: nextBindingId++,
      studentId1,
      studentId2,
      type: 'deskmate'
    }
    bindings.value.push(newBinding)
    return newBinding
  }

  // 删除绑定关系
  const deleteBinding = (bindingId) => {
    bindings.value = bindings.value.filter(b => b.id !== bindingId)
  }

  // 查找学生的绑定关系
  const findBindingForStudent = (studentId) => {
    return bindings.value.find(b =>
      b.studentId1 === studentId || b.studentId2 === studentId
    ) || null
  }

  // 获取学生的绑定伙伴ID
  const getPartnerStudentId = (binding, studentId) => {
    if (!binding) return null
    return binding.studentId1 === studentId ? binding.studentId2 : binding.studentId1
  }

  // 获取学生的绑定伙伴ID(简化版)
  const getPartner = (studentId) => {
    const binding = findBindingForStudent(studentId)
    return binding ? getPartnerStudentId(binding, studentId) : null
  }

  // 检查两个学生是否有绑定关系
  const hasBinding = (studentId1, studentId2) => {
    return bindings.value.some(b =>
      (b.studentId1 === studentId1 && b.studentId2 === studentId2) ||
      (b.studentId1 === studentId2 && b.studentId2 === studentId1)
    )
  }

  // 清理无效的绑定关系(学生被删除后)
  const cleanupInvalidBindings = (validStudentIds) => {
    const validSet = new Set(validStudentIds)
    bindings.value = bindings.value.filter(b =>
      validSet.has(b.studentId1) && validSet.has(b.studentId2)
    )
  }

  // 获取所有绑定关系
  const getAllBindings = () => {
    return bindings.value
  }

  // 清空所有绑定关系
  const clearAllBindings = () => {
    bindings.value = []
  }

  return {
    bindings,
    addBinding,
    deleteBinding,
    findBindingForStudent,
    getPartnerStudentId,
    getPartner,
    hasBinding,
    cleanupInvalidBindings,
    getAllBindings,
    clearAllBindings
  }
}
