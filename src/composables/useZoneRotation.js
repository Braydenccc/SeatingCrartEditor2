import { ref } from 'vue'

/**
 * 选区轮换（重构版）
 *
 * 数据结构：
 *   rotGroups[].zones[]   — 选区直接嵌入组内，无独立全局选区列表
 *   editingZoneId         — 当前正在编辑（点击选座）的选区 ID（跨组全局唯一）
 *
 * 轮换组 RotGroup: { id, name, type: 'cycle'|'swap', zones: RotZone[] }
 * 轮换选区 RotZone: { id, name, seatIds: string[] }
 */

const rotGroups = ref([])
let nextGroupId = 1
let nextZoneId = 1

// 当前正在编辑座位的选区 ID（全局唯一，跨组追踪）
const editingZoneId = ref(null)

// 调色板：为各选区分配颜色（按全局遍历顺序索引）
const PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F4845F', '#52B788'
]

export function useZoneRotation() {

  // ==================== 轮换组 ====================

  const addRotGroup = (type = 'cycle') => {
    const group = {
      id: nextGroupId++,
      name: `轮换组 ${nextGroupId - 1}`,
      type,
      zones: []
    }
    rotGroups.value.push(group)
    return group
  }

  const deleteRotGroup = (groupId) => {
    // 若删除的组内含有正在编辑的选区，清空编辑状态
    const group = rotGroups.value.find(g => g.id === groupId)
    if (group?.zones.some(z => z.id === editingZoneId.value)) {
      editingZoneId.value = null
    }
    rotGroups.value = rotGroups.value.filter(g => g.id !== groupId)
  }

  const updateRotGroup = (groupId, updates) => {
    const group = rotGroups.value.find(g => g.id === groupId)
    if (group) Object.assign(group, updates)
  }

  // ==================== 组内选区 ====================

  /** 在指定组内新建一个选区，并自动选中进入编辑模式 */
  const addZoneToGroup = (groupId) => {
    const group = rotGroups.value.find(g => g.id === groupId)
    if (!group) return null
    const zone = {
      id: nextZoneId++,
      name: `选区 ${group.zones.length + 1}`,
      seatIds: []
    }
    group.zones.push(zone)
    editingZoneId.value = zone.id
    return zone
  }

  const deleteZoneFromGroup = (groupId, zoneId) => {
    const group = rotGroups.value.find(g => g.id === groupId)
    if (group) group.zones = group.zones.filter(z => z.id !== zoneId)
    if (editingZoneId.value === zoneId) editingZoneId.value = null
  }

  const selectEditingZone = (zoneId) => {
    editingZoneId.value = editingZoneId.value === zoneId ? null : zoneId
  }

  const clearEditingZone = () => { editingZoneId.value = null }

  /** 在正在编辑的选区内切换某个座位的状态 */
  const toggleSeatInEditingZone = (seatId) => {
    if (!editingZoneId.value) return
    for (const group of rotGroups.value) {
      const zone = group.zones.find(z => z.id === editingZoneId.value)
      if (zone) {
        const idx = zone.seatIds.indexOf(seatId)
        if (idx >= 0) zone.seatIds.splice(idx, 1)
        else zone.seatIds.push(seatId)
        return
      }
    }
  }

  /** 返回 seatId → color 的 Map（所有组内所有选区高亮） */
  const getRotZoneHighlights = () => {
    const map = new Map()
    let colorIdx = 0
    for (const group of rotGroups.value) {
      for (const zone of group.zones) {
        const color = PALETTE[colorIdx++ % PALETTE.length]
        zone.seatIds.forEach(sid => map.set(sid, color))
      }
    }
    return map
  }

  /** 获取某个 zone 的颜色 */
  const getZoneColor = (groupId, zoneId) => {
    let colorIdx = 0
    for (const group of rotGroups.value) {
      for (const zone of group.zones) {
        if (group.id === groupId && zone.id === zoneId) {
          return PALETTE[colorIdx % PALETTE.length]
        }
        colorIdx++
      }
    }
    return '#ccc'
  }

  // ==================== 校验 ====================

  const validateGroup = (group) => {
    if (group.type === 'swap') {
      if (group.zones.length !== 2) return { valid: false, error: '互换模式需要恰好 2 个选区' }
    } else {
      if (group.zones.length < 2) return { valid: false, error: '循环模式至少需要 2 个选区' }
    }
    const sizes = group.zones.map(z => z.seatIds.length)
    if (sizes.some(s => s !== sizes[0])) {
      return { valid: false, error: `选区大小不一致（${sizes.join(' / ')} 座）` }
    }
    if (sizes[0] === 0) return { valid: false, error: '选区中没有座位' }
    return { valid: true, error: '' }
  }

  // ==================== 执行 ====================

  const applyZoneRotation = (seatMap) => {
    const errors = []
    let moved = 0

    for (const group of rotGroups.value) {
      const { valid, error } = validateGroup(group)
      if (!valid) { errors.push(`[${group.name}] ${error}`); continue }

      if (group.type === 'swap') {
        const zA = group.zones[0]
        const zB = group.zones[1]
        const snapA = zA.seatIds.map(sid => seatMap.get(sid)?.studentId ?? null)
        const snapB = zB.seatIds.map(sid => seatMap.get(sid)?.studentId ?? null)
        zA.seatIds.forEach((sid, i) => {
          const seat = seatMap.get(sid)
          if (seat && !seat.isEmpty) { seat.studentId = snapB[i]; moved++ }
        })
        zB.seatIds.forEach((sid, i) => {
          const seat = seatMap.get(sid)
          if (seat && !seat.isEmpty) { seat.studentId = snapA[i]; moved++ }
        })
      } else {
        const snaps = group.zones.map(z =>
          z.seatIds.map(sid => seatMap.get(sid)?.studentId ?? null)
        )
        group.zones.forEach((zone, idx) => {
          const src = snaps[(idx - 1 + group.zones.length) % group.zones.length]
          zone.seatIds.forEach((sid, i) => {
            const seat = seatMap.get(sid)
            if (seat && !seat.isEmpty) { seat.studentId = src[i]; moved++ }
          })
        })
      }
    }

    return { moved, errors }
  }

  const cleanupInvalidRotSeats = (validSeatIds) => {
    const validSet = new Set(validSeatIds)
    for (const group of rotGroups.value) {
      for (const zone of group.zones) {
        zone.seatIds = zone.seatIds.filter(sid => validSet.has(sid))
      }
    }
  }

  const clearAllRotData = () => {
    rotGroups.value = []
    editingZoneId.value = null
    nextGroupId = 1
    nextZoneId = 1
  }

  return {
    rotGroups,
    editingZoneId,
    addRotGroup,
    deleteRotGroup,
    updateRotGroup,
    addZoneToGroup,
    deleteZoneFromGroup,
    selectEditingZone,
    clearEditingZone,
    toggleSeatInEditingZone,
    getRotZoneHighlights,
    getZoneColor,
    validateGroup,
    applyZoneRotation,
    cleanupInvalidRotSeats,
    clearAllRotData
  }
}
