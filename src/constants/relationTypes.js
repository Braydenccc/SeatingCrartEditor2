/**
 * 座位联系类型常量
 * 定义学生之间的关系类型、优先级强度和视觉样式
 */

/**
 * 联系类型枚举
 */
export const RelationType = {
  ATTRACTION: 'attraction',               // 吸引 - 尽量安排在一起（同桌或相邻）
  REPULSION: 'repulsion',                 // 排斥 - 尽量分开（保持距离）
  SEATMATE_BINDING: 'seatmate_binding',   // 同桌绑定 - 必须同桌
  SEATMATE_REPULSION: 'seatmate_repulsion' // 同桌排斥 - 禁止同桌
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
  attraction: '#4CAF50',           // 绿色 - 表示吸引/友好
  repulsion: '#F44336',            // 红色 - 表示排斥/冲突
  seatmate_binding: '#2196F3',     // 蓝色 - 表示同桌绑定
  seatmate_repulsion: '#FF9800'    // 橙色 - 表示同桌排斥
}

/**
 * 联系类型显示标签
 */
export const RELATION_LABELS = {
  attraction: '吸引',
  repulsion: '排斥',
  seatmate_binding: '同桌绑定',
  seatmate_repulsion: '同桌排斥'
}

/**
 * 联系类型描述（用于 UI 展示）
 */
export const RELATION_DESCRIPTIONS = {
  attraction: '尽量安排在附近座位',
  repulsion: '尽量保持距离',
  seatmate_binding: '必须安排为同桌',
  seatmate_repulsion: '禁止安排为同桌'
}

/**
 * 联系强度显示标签（增强可读性）
 */
export const STRENGTH_LABELS = {
  high: '必须',
  medium: '尽量',
  low: '可选'
}

/**
 * 联系强度描述
 */
export const STRENGTH_DESCRIPTIONS = {
  high: '未满足时标记警告',
  medium: '优先满足但可降级',
  low: '有空位再安排'
}

/**
 * 联系强度颜色
 */
export const STRENGTH_COLORS = {
  high: '#F44336',
  medium: '#FF9800',
  low: '#4CAF50'
}

/**
 * 联系类型图标
 */
export const RELATION_ICONS = {
  attraction: '🧲',
  repulsion: '🚷',
  seatmate_binding: '🔗',
  seatmate_repulsion: '✂️'
}

/**
 * 默认元数据配置
 */
export const DEFAULT_METADATA = {
  attraction: {
    allowAdjacent: true,    // 允许相邻座位（非同桌）
    allowCrossGroup: true,  // 允许跨大组
    minDistance: 0           // 最小距离（0表示同桌）
  },
  repulsion: {
    allowAdjacent: false,   // 不允许相邻
    allowCrossGroup: true,  // 允许跨大组
    minDistance: 2           // 最小距离（座位数）
  },
  seatmate_binding: {
    allowCrossGroup: false  // 同桌绑定默认同组内
  },
  seatmate_repulsion: {
    allowCrossGroup: true   // 同桌排斥允许跨组
  }
}

/**
 * 是否为硬约束类型（不支持优先级选择，强制 HIGH）
 */
export const IS_HARD_CONSTRAINT = {
  attraction: false,
  repulsion: false,
  seatmate_binding: true,
  seatmate_repulsion: true
}

/**
 * 联系优先级权重（用于排序）
 * 数字越小优先级越高
 */
export const RELATION_PRIORITY_WEIGHTS = {
  // 同桌绑定/排斥最高优先（硬约束）
  HIGH_SEATMATE_BINDING: 0,
  HIGH_SEATMATE_REPULSION: 0,
  // 常规关系
  HIGH_REPULSION: 1,
  HIGH_ATTRACTION: 2,
  MEDIUM_REPULSION: 3,
  MEDIUM_ATTRACTION: 4,
  LOW_REPULSION: 5,
  LOW_ATTRACTION: 6
}

/**
 * 计算联系的优先级权重
 * @param {Object} relation - 联系对象
 * @returns {number} 优先级权重（越小越优先）
 */
export function getRelationPriority(relation) {
  const key = `${relation.strength.toUpperCase()}_${relation.relationType.toUpperCase()}`
  return RELATION_PRIORITY_WEIGHTS[key] ?? 999
}
