import { ref } from 'vue'
import { useStudentData } from './useStudentData'
import { useSeatChart } from './useSeatChart'
import { useZoneData } from './useZoneData'
import { useSeatRelation } from './useSeatRelation'
import { RelationType, getRelationPriority } from '../constants/relationTypes.js'

export function useAssignment() {
  const { students } = useStudentData()
  const {
    seats,
    clearAllSeats,
    assignStudent,
    areDeskmates,
    getAvailableSeats,
    getEmptySeats,
    getSeatDistance,
    getAdjacentSeats,
    validateRepulsion
  } = useSeatChart()
  const { zones, getZoneForSeat } = useZoneData()

  const isAssigning = ref(false)

  // 随机打乱数组(Fisher-Yates算法)
  const shuffleArray = (array) => {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  // 辅助函数：随机查找同桌座位对
  const findDeskmatesPairRandom = (availableSeats, assignedSeatIds) => {
    // 打乱座位顺序以实现随机性
    const shuffledSeats = shuffleArray(availableSeats)

    for (let i = 0; i < shuffledSeats.length; i++) {
      for (let j = i + 1; j < shuffledSeats.length; j++) {
        const seat1 = shuffledSeats[i]
        const seat2 = shuffledSeats[j]

        if (areDeskmates(seat1.id, seat2.id) &&
            !assignedSeatIds.has(seat1.id) &&
            !assignedSeatIds.has(seat2.id)) {
          return [seat1, seat2]
        }
      }
    }
    return null
  }

  // 新增：查找吸引关系的座位对
  const findAttractionSeats = (availableSeats, assignedSeatIds, allowAdjacent = true) => {
    const shuffled = shuffleArray(availableSeats.filter(s => !assignedSeatIds.has(s.id)))

    // 优先级1: 同桌座位（距离0）
    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        const seat1 = shuffled[i]
        const seat2 = shuffled[j]

        if (areDeskmates(seat1.id, seat2.id) &&
            !assignedSeatIds.has(seat1.id) &&
            !assignedSeatIds.has(seat2.id)) {
          return { seats: [seat1, seat2], distance: 0, type: 'deskmate' }
        }
      }
    }

    // 优先级2: 相邻座位（距离1）
    if (allowAdjacent) {
      for (let i = 0; i < shuffled.length; i++) {
        const seat1 = shuffled[i]
        if (assignedSeatIds.has(seat1.id)) continue

        const adjacentSeats = getAdjacentSeats(seat1.id, 1)
        const availableAdjacent = adjacentSeats.filter(s =>
          !assignedSeatIds.has(s.id) &&
          shuffled.some(ss => ss.id === s.id)
        )

        if (availableAdjacent.length > 0) {
          return {
            seats: [seat1, availableAdjacent[0]],
            distance: 1,
            type: 'adjacent'
          }
        }
      }
    }

    // 降级：任意两个座位（无法满足吸引约束）
    if (shuffled.length >= 2) {
      return {
        seats: [shuffled[0], shuffled[1]],
        distance: getSeatDistance(shuffled[0].id, shuffled[1].id),
        type: 'fallback'
      }
    }

    return null
  }

  // 新增：查找排斥关系的座位对
  const findRepulsionSeats = (availableSeats, assignedSeatIds, minDistance = 2) => {
    const shuffled = shuffleArray(availableSeats.filter(s => !assignedSeatIds.has(s.id)))

    // 尝试找到距离足够远的座位对
    for (let i = 0; i < shuffled.length; i++) {
      const seat1 = shuffled[i]
      if (assignedSeatIds.has(seat1.id)) continue

      for (let j = i + 1; j < shuffled.length; j++) {
        const seat2 = shuffled[j]
        if (assignedSeatIds.has(seat2.id)) continue

        const distance = getSeatDistance(seat1.id, seat2.id)

        // 满足排斥要求（距离足够远或不同大组）
        if (distance >= minDistance || distance === Infinity) {
          return {
            seats: [seat1, seat2],
            distance,
            type: 'repulsion_satisfied'
          }
        }
      }
    }

    // 无法满足排斥约束
    return null
  }

  // 执行排位（新算法：支持吸引和排斥关系）
  const runAssignment = async (useRelations = false) => {
    if (isAssigning.value) {
      return {
        success: false,
        message: '正在排位中,请稍候...'
      }
    }

    isAssigning.value = true

    try {
      // 清空现有分配
      clearAllSeats()

      // 获取所有学生和座位
      const allStudents = shuffleArray(students.value.map(s => ({ ...s })))
      const allSeats = getAvailableSeats()

      // 获取所有选区
      const allZones = zones.value || []

      // 按选区分组座位
      const zoneSeatMap = new Map() // zoneId -> seats[]
      const nonZoneSeats = [] // 不属于任何选区的座位

      allSeats.forEach(seat => {
        const zone = getZoneForSeat(seat.id)
        if (zone) {
          if (!zoneSeatMap.has(zone.id)) {
            zoneSeatMap.set(zone.id, [])
          }
          zoneSeatMap.get(zone.id).push(seat)
        } else {
          nonZoneSeats.push(seat)
        }
      })

      // 按学生标签分组
      const studentsByTags = new Map() // tagId -> students[]
      const studentsWithoutTags = []

      allStudents.forEach(student => {
        if (student.tags && student.tags.length > 0) {
          student.tags.forEach(tagId => {
            if (!studentsByTags.has(tagId)) {
              studentsByTags.set(tagId, [])
            }
            studentsByTags.get(tagId).push(student)
          })
        } else {
          studentsWithoutTags.push(student)
        }
      })

      // 获取并排序联系关系
      let relationPairs = []
      let satisfiedRelations = 0
      let totalRelations = 0

      if (useRelations) {
        const { getSortedRelationsByPriority } = useSeatRelation()
        const sortedRelations = getSortedRelationsByPriority()

        relationPairs = sortedRelations.map(r => ({
          relation: r,
          student1: allStudents.find(s => s.id === r.studentId1),
          student2: allStudents.find(s => s.id === r.studentId2)
        })).filter(p => p.student1 && p.student2)

        totalRelations = relationPairs.length
      }

      const assignments = []
      const assignedStudentIds = new Set()
      const assignedSeatIds = new Set()

      // 辅助函数：分配学生到座位
      const assignToSeat = (student, seat) => {
        assignments.push({ studentId: student.id, seatId: seat.id })
        assignedStudentIds.add(student.id)
        assignedSeatIds.add(seat.id)
        assignStudent(seat.id, student.id)
      }

      // 策略0：优先处理联系关系（按优先级）
      if (useRelations && relationPairs.length > 0) {
        for (const pair of relationPairs) {
          const { relation, student1, student2 } = pair

          // 检查学生是否已分配
          if (assignedStudentIds.has(student1.id) || assignedStudentIds.has(student2.id)) {
            continue
          }

          // 根据关系类型选择座位查找策略
          let result = null
          const availableSeats = allSeats.filter(s => !assignedSeatIds.has(s.id))

          if (relation.relationType === RelationType.ATTRACTION) {
            // 吸引关系：尽量安排在一起
            const allowAdjacent = relation.metadata?.allowAdjacent ?? true
            result = findAttractionSeats(availableSeats, assignedSeatIds, allowAdjacent)
          } else if (relation.relationType === RelationType.REPULSION) {
            // 排斥关系：尽量分开
            const minDistance = relation.metadata?.minDistance ?? 2
            result = findRepulsionSeats(availableSeats, assignedSeatIds, minDistance)
          }

          // 如果找到了合适的座位，分配学生
          if (result && result.seats.length === 2) {
            assignToSeat(student1, result.seats[0])
            assignToSeat(student2, result.seats[1])
            satisfiedRelations++
          }
        }
      }

      // 策略1：优先处理选区约束
      for (const [zoneId, zoneSeats] of zoneSeatMap) {
        const zone = allZones.find(z => z.id === zoneId)
        if (!zone || !zone.tagIds || zone.tagIds.length === 0) continue

        // 找出所有符合此选区标签的学生（至少有一个标签匹配）
        const eligibleStudents = allStudents.filter(student => {
          if (assignedStudentIds.has(student.id)) return false
          if (!student.tags || student.tags.length === 0) return false
          return student.tags.some(tagId => zone.tagIds.includes(tagId))
        })

        // 可用座位
        const availableZoneSeats = zoneSeats.filter(s => !assignedSeatIds.has(s.id))

        // 分配剩余的符合条件的学生
        const remainingEligible = shuffleArray(eligibleStudents.filter(s => !assignedStudentIds.has(s.id)))
        const remainingSeats = availableZoneSeats.filter(s => !assignedSeatIds.has(s.id))

        for (let i = 0; i < Math.min(remainingEligible.length, remainingSeats.length); i++) {
          assignToSeat(remainingEligible[i], remainingSeats[i])
        }
      }

      // 策略2：处理非选区座位
      const unassignedStudents = allStudents.filter(s => !assignedStudentIds.has(s.id))
      const availableNonZoneSeats = nonZoneSeats.filter(s => !assignedSeatIds.has(s.id))

      // 分配剩余学生到剩余座位
      const finalUnassigned = shuffleArray(allStudents.filter(s => !assignedStudentIds.has(s.id)))
      const finalAvailableSeats = availableNonZoneSeats.filter(s => !assignedSeatIds.has(s.id))

      for (let i = 0; i < Math.min(finalUnassigned.length, finalAvailableSeats.length); i++) {
        assignToSeat(finalUnassigned[i], finalAvailableSeats[i])
      }

      // 统计结果
      const unassigned = allStudents.filter(s => !assignedStudentIds.has(s.id))

      // 构建结果消息
      let message = `成功分配 ${assignments.length} 个学生`

      if (useRelations && totalRelations > 0) {
        message += `\n联系关系: ${satisfiedRelations}/${totalRelations} 满足`
      }

      if (unassigned.length > 0) {
        return {
          success: false,
          message: `部分学生无法分配\n成功分配: ${assignments.length}/${allStudents.length}\n${useRelations && totalRelations > 0 ? `联系关系: ${satisfiedRelations}/${totalRelations} 满足\n` : ''}未分配学生: ${unassigned.map(s => s.name || '未命名').join(', ')}`,
          assigned: assignments.length,
          total: allStudents.length,
          unassigned,
          relationStats: { satisfied: satisfiedRelations, total: totalRelations }
        }
      }

      return {
        success: true,
        message,
        assigned: assignments.length,
        total: allStudents.length,
        relationStats: { satisfied: satisfiedRelations, total: totalRelations }
      }

    } catch (error) {
      return {
        success: false,
        message: `排位失败: ${error.message}`
      }
    } finally {
      isAssigning.value = false
    }
  }

  // 简化版随机排位(不考虑约束,仅随机分配)
  const runRandomAssignment = () => {
    const allStudents = shuffleArray(students.value.map(s => ({ ...s })))
    const emptySeats = getEmptySeats()

    clearAllSeats()

    const count = Math.min(allStudents.length, emptySeats.length)
    for (let i = 0; i < count; i++) {
      assignStudent(emptySeats[i].id, allStudents[i].id)
    }

    return {
      success: true,
      message: `随机分配 ${count} 个学生`,
      assigned: count,
      total: allStudents.length
    }
  }

  return {
    isAssigning,
    runAssignment,
    runRandomAssignment
  }
}
