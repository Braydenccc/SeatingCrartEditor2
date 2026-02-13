import { ref } from 'vue'
import {
  RelationType,
  RelationStrength,
  DEFAULT_METADATA,
  getRelationPriority
} from '../constants/relationTypes.js'

/**
 * 座位联系关系管理
 * 支持吸引（attraction）和排斥（repulsion）两种关系类型
 */

// 联系关系列表（模块级单例状态）
const relations = ref([])
let nextRelationId = 1

export function useSeatRelation() {
  // ==================== 核心 CRUD ====================

  /**
   * 添加联系关系
   * @param {number} studentId1 - 学生1的ID
   * @param {number} studentId2 - 学生2的ID
   * @param {string} relationType - 关系类型 (attraction | repulsion)
   * @param {string} strength - 强度 (high | medium | low)
   * @param {Object} metadata - 额外元数据
   * @returns {Object|null} 新创建的关系对象，如果已存在则返回null
   */
  const addRelation = (
    studentId1,
    studentId2,
    relationType = RelationType.ATTRACTION,
    strength = RelationStrength.HIGH,
    metadata = null
  ) => {
    // 验证参数
    if (!studentId1 || !studentId2 || studentId1 === studentId2) {
      return null
    }

    // 检查是否已存在相同的关系（无论正向还是反向）
    const exists = relations.value.some(r =>
      (r.studentId1 === studentId1 && r.studentId2 === studentId2 && r.relationType === relationType) ||
      (r.studentId1 === studentId2 && r.studentId2 === studentId1 && r.relationType === relationType)
    )

    if (exists) {
      return null
    }

    // 使用默认元数据或自定义元数据
    const defaultMeta = DEFAULT_METADATA[relationType] || {}
    const finalMetadata = metadata || { ...defaultMeta }

    const newRelation = {
      id: nextRelationId++,
      studentId1,
      studentId2,
      relationType,
      strength,
      metadata: finalMetadata
    }

    relations.value.push(newRelation)
    return newRelation
  }

  /**
   * 删除联系关系
   * @param {number} relationId - 关系ID
   */
  const deleteRelation = (relationId) => {
    relations.value = relations.value.filter(r => r.id !== relationId)
  }

  /**
   * 更新联系关系
   * @param {number} relationId - 关系ID
   * @param {Object} updates - 更新的字段
   */
  const updateRelation = (relationId, updates) => {
    const relation = relations.value.find(r => r.id === relationId)
    if (!relation) return false

    // 允许更新的字段
    const allowedFields = ['relationType', 'strength', 'metadata']
    allowedFields.forEach(field => {
      if (field in updates) {
        if (field === 'metadata') {
          relation.metadata = { ...relation.metadata, ...updates.metadata }
        } else {
          relation[field] = updates[field]
        }
      }
    })

    return true
  }

  // ==================== 查询功能 ====================

  /**
   * 查找学生的所有联系关系
   * @param {number} studentId - 学生ID
   * @param {string} relationType - 可选，筛选特定类型
   * @returns {Array} 关系数组
   */
  const findRelationsForStudent = (studentId, relationType = null) => {
    let result = relations.value.filter(r =>
      r.studentId1 === studentId || r.studentId2 === studentId
    )

    if (relationType) {
      result = result.filter(r => r.relationType === relationType)
    }

    return result
  }

  /**
   * 获取学生的联系伙伴ID列表
   * @param {number} studentId - 学生ID
   * @param {string} relationType - 可选，筛选特定类型
   * @returns {Array} 伙伴ID数组
   */
  const getRelationPartners = (studentId, relationType = null) => {
    const studentRelations = findRelationsForStudent(studentId, relationType)
    return studentRelations.map(r =>
      r.studentId1 === studentId ? r.studentId2 : r.studentId1
    )
  }

  /**
   * 检查两个学生之间是否有指定类型的联系
   * @param {number} studentId1 - 学生1的ID
   * @param {number} studentId2 - 学生2的ID
   * @param {string} relationType - 关系类型
   * @returns {boolean}
   */
  const hasRelation = (studentId1, studentId2, relationType = null) => {
    return relations.value.some(r => {
      const isMatch = (r.studentId1 === studentId1 && r.studentId2 === studentId2) ||
                      (r.studentId1 === studentId2 && r.studentId2 === studentId1)
      return relationType ? (isMatch && r.relationType === relationType) : isMatch
    })
  }

  /**
   * 获取两个学生之间的联系关系
   * @param {number} studentId1 - 学生1的ID
   * @param {number} studentId2 - 学生2的ID
   * @returns {Object|null} 关系对象或null
   */
  const getRelationBetween = (studentId1, studentId2) => {
    return relations.value.find(r =>
      (r.studentId1 === studentId1 && r.studentId2 === studentId2) ||
      (r.studentId1 === studentId2 && r.studentId2 === studentId1)
    ) || null
  }

  // ==================== 过滤功能 ====================

  /**
   * 获取所有吸引关系
   * @returns {Array}
   */
  const getAttractionRelations = () => {
    return relations.value.filter(r => r.relationType === RelationType.ATTRACTION)
  }

  /**
   * 获取所有排斥关系
   * @returns {Array}
   */
  const getRepulsionRelations = () => {
    return relations.value.filter(r => r.relationType === RelationType.REPULSION)
  }

  /**
   * 按优先级排序关系（从高到低）
   * @returns {Array} 排序后的关系数组
   */
  const getSortedRelationsByPriority = () => {
    return [...relations.value].sort((a, b) => {
      return getRelationPriority(a) - getRelationPriority(b)
    })
  }

  // ==================== 验证功能 ====================

  /**
   * 验证联系关系是否有效
   * @param {number} studentId1 - 学生1的ID
   * @param {number} studentId2 - 学生2的ID
   * @param {string} relationType - 关系类型
   * @returns {Object} { valid: boolean, reason: string }
   */
  const validateRelation = (studentId1, studentId2, relationType) => {
    if (!studentId1 || !studentId2) {
      return { valid: false, reason: '学生ID不能为空' }
    }

    if (studentId1 === studentId2) {
      return { valid: false, reason: '不能与自己建立联系' }
    }

    // 检查是否已存在相同关系
    if (hasRelation(studentId1, studentId2, relationType)) {
      return { valid: false, reason: '该联系关系已存在' }
    }

    return { valid: true, reason: '' }
  }

  /**
   * 检测冲突的关系（例如A吸引B，同时B排斥A）
   * @returns {Array} 冲突关系对数组 [{ relation1, relation2, conflictType }]
   */
  const detectConflicts = () => {
    const conflicts = []

    for (let i = 0; i < relations.value.length; i++) {
      for (let j = i + 1; j < relations.value.length; j++) {
        const r1 = relations.value[i]
        const r2 = relations.value[j]

        // 检查是否涉及相同的两个学生
        const sameStudents =
          (r1.studentId1 === r2.studentId1 && r1.studentId2 === r2.studentId2) ||
          (r1.studentId1 === r2.studentId2 && r1.studentId2 === r2.studentId1)

        if (sameStudents && r1.relationType !== r2.relationType) {
          conflicts.push({
            relation1: r1,
            relation2: r2,
            conflictType: 'opposite_relations' // 相反的关系类型
          })
        }
      }
    }

    return conflicts
  }

  // ==================== 清理功能 ====================

  /**
   * 清理无效的联系关系（学生被删除后）
   * @param {Array} validStudentIds - 有效的学生ID数组
   */
  const cleanupInvalidRelations = (validStudentIds) => {
    const validSet = new Set(validStudentIds)
    relations.value = relations.value.filter(r =>
      validSet.has(r.studentId1) && validSet.has(r.studentId2)
    )
  }

  /**
   * 清空所有联系关系
   */
  const clearAllRelations = () => {
    relations.value = []
    nextRelationId = 1
  }

  /**
   * 获取所有联系关系
   * @returns {Array}
   */
  const getAllRelations = () => {
    return relations.value
  }

  // ==================== 向后兼容 API ====================

  /**
   * @deprecated 使用 addRelation(..., RelationType.ATTRACTION) 代替
   * 为向后兼容保留的旧API
   */
  const addBinding = (studentId1, studentId2) => {
    console.warn('[useSeatRelation] addBinding() is deprecated. Use addRelation() instead.')
    return addRelation(studentId1, studentId2, RelationType.ATTRACTION, RelationStrength.HIGH)
  }

  /**
   * @deprecated 使用 deleteRelation() 代替
   */
  const deleteBinding = (relationId) => {
    console.warn('[useSeatRelation] deleteBinding() is deprecated. Use deleteRelation() instead.')
    deleteRelation(relationId)
  }

  /**
   * @deprecated 使用 findRelationsForStudent() 代替
   */
  const findBindingForStudent = (studentId) => {
    console.warn('[useSeatRelation] findBindingForStudent() is deprecated. Use findRelationsForStudent() instead.')
    const relations = findRelationsForStudent(studentId, RelationType.ATTRACTION)
    return relations.length > 0 ? relations[0] : null
  }

  /**
   * @deprecated 使用 getRelationPartners() 代替
   */
  const getPartner = (studentId) => {
    console.warn('[useSeatRelation] getPartner() is deprecated. Use getRelationPartners() instead.')
    const partners = getRelationPartners(studentId, RelationType.ATTRACTION)
    return partners.length > 0 ? partners[0] : null
  }

  // 返回所有公开API
  return {
    // 状态
    relations,

    // 核心CRUD
    addRelation,
    deleteRelation,
    updateRelation,

    // 查询
    findRelationsForStudent,
    getRelationPartners,
    hasRelation,
    getRelationBetween,

    // 过滤
    getAttractionRelations,
    getRepulsionRelations,
    getSortedRelationsByPriority,

    // 验证
    validateRelation,
    detectConflicts,

    // 清理
    cleanupInvalidRelations,
    clearAllRelations,
    getAllRelations,

    // 向后兼容API（废弃）
    bindings: relations, // 别名
    addBinding,
    deleteBinding,
    findBindingForStudent,
    getPartner,
    hasBinding: hasRelation,
    cleanupInvalidBindings: cleanupInvalidRelations,
    getAllBindings: getAllRelations,
    clearAllBindings: clearAllRelations
  }
}
