/**
 * 座位联系类型常量
 * 定义学生之间的关系类型、优先级强度和视觉样式
 */

/**
 * 联系类型枚举
 */
export const RelationType = {
  ATTRACTION: 'attraction', // 吸引 - 尽量安排在一起（同桌或相邻）
  REPULSION: 'repulsion'    // 排斥 - 尽量分开（保持距离）
}

/**
 * 联系强度/优先级
 */
export const RelationStrength = {
  HIGH: 'high',     // 必须满足
  MEDIUM: 'medium', // 尽量满足
  LOW: 'low'        // 可选满足
}

/**
 * 联系类型对应的颜色
 */
export const RELATION_COLORS = {
  attraction: '#4CAF50', // 绿色 - 表示吸引/友好
  repulsion: '#F44336'   // 红色 - 表示排斥/冲突
}

/**
 * 联系类型显示标签
 */
export const RELATION_LABELS = {
  attraction: '吸引',
  repulsion: '排斥'
}

/**
 * 联系强度显示标签
 */
export const STRENGTH_LABELS = {
  high: '高',
  medium: '中',
  low: '低'
}

/**
 * 联系类型图标
 */
export const RELATION_ICONS = {
  attraction: '⇄', // 双向箭头 - 表示相互吸引
  repulsion: '⇹'   // 双向箭头（带分隔） - 表示排斥
}

/**
 * 默认元数据配置
 */
export const DEFAULT_METADATA = {
  attraction: {
    allowAdjacent: true,  // 允许相邻座位（非同桌）
    minDistance: 0        // 最小距离（0表示同桌）
  },
  repulsion: {
    allowAdjacent: false, // 不允许相邻
    minDistance: 2        // 最小距离（座位数）
  }
}

/**
 * 联系优先级权重（用于排序）
 * 数字越小优先级越高
 */
export const RELATION_PRIORITY_WEIGHTS = {
  HIGH_REPULSION: 1,    // 最高优先级：高强度排斥
  HIGH_ATTRACTION: 2,   // 高强度吸引
  MEDIUM_REPULSION: 3,  // 中等强度排斥
  MEDIUM_ATTRACTION: 4, // 中等强度吸引
  LOW_REPULSION: 5,     // 低强度排斥
  LOW_ATTRACTION: 6     // 低强度吸引
}

/**
 * 计算联系的优先级权重
 * @param {Object} relation - 联系对象
 * @returns {number} 优先级权重（越小越优先）
 */
export function getRelationPriority(relation) {
  const key = `${relation.strength.toUpperCase()}_${relation.relationType.toUpperCase()}`
  return RELATION_PRIORITY_WEIGHTS[key] || 999
}
