import { ref } from 'vue'
import { useStudentData } from './useStudentData'
import { useSeatChart } from './useSeatChart'
import { useZoneData } from './useZoneData'
import { useSeatBinding } from './useSeatBinding'

export function useAssignment() {
  const { students } = useStudentData()
  const {
    seats,
    clearAllSeats,
    assignStudent,
    areDeskmates,
    getAvailableSeats,
    getEmptySeats
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

  // 执行排位（新算法：分组优先策略）
  const runAssignment = async (useBinding = false) => {
    if (isAssigning.value) {
      return {
        success: false,
        message: '正在排位中,请稍候...'
      }
    }

    isAssigning.value = true

    try {
      console.log('========== 开始排位 ==========')
      console.log(`useBinding: ${useBinding}`)

      // 清空现有分配
      clearAllSeats()

      // 获取所有学生和座位
      const allStudents = shuffleArray(students.value.map(s => ({ ...s })))
      const allSeats = getAvailableSeats()

      console.log(`学生总数: ${allStudents.length}`)
      console.log(`可用座位数: ${allSeats.length}`)

      // 获取所有选区
      const allZones = zones.value || []
      console.log(`选区数: ${allZones.length}`)

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

      // 获取绑定关系
      let bindingPairs = []
      if (useBinding) {
        const { bindings } = useSeatBinding()
        bindingPairs = bindings.value.map(b => ({
          student1: allStudents.find(s => s.id === b.studentId1),
          student2: allStudents.find(s => s.id === b.studentId2)
        })).filter(p => p.student1 && p.student2)

        console.log(`绑定关系数: ${bindingPairs.length}`)
        bindingPairs.forEach(p => {
          console.log(`  绑定: ${p.student1.name} ⇄ ${p.student2.name}`)
        })
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

      // 策略1：优先处理选区约束
      console.log('\n=== 阶段1: 处理选区约束 ===')

      for (const [zoneId, zoneSeats] of zoneSeatMap) {
        const zone = allZones.find(z => z.id === zoneId)
        if (!zone || !zone.tagIds || zone.tagIds.length === 0) continue

        console.log(`\n处理选区 ${zone.name}, 标签: ${zone.tagIds}, 座位数: ${zoneSeats.length}`)

        // 找出所有符合此选区标签的学生（至少有一个标签匹配）
        const eligibleStudents = allStudents.filter(student => {
          if (assignedStudentIds.has(student.id)) return false
          if (!student.tags || student.tags.length === 0) return false
          return student.tags.some(tagId => zone.tagIds.includes(tagId))
        })

        console.log(`  符合条件的学生数: ${eligibleStudents.length}`)

        // 可用座位
        const availableZoneSeats = zoneSeats.filter(s => !assignedSeatIds.has(s.id))

        if (eligibleStudents.length > availableZoneSeats.length) {
          console.warn(`  警告: 学生数(${eligibleStudents.length}) > 座位数(${availableZoneSeats.length})`)
        }

        // 如果使用绑定，优先处理绑定对
        if (useBinding) {
          const eligiblePairs = bindingPairs.filter(p =>
            eligibleStudents.includes(p.student1) &&
            eligibleStudents.includes(p.student2) &&
            !assignedStudentIds.has(p.student1.id) &&
            !assignedStudentIds.has(p.student2.id)
          )

          for (const pair of shuffleArray(eligiblePairs)) {
            // 随机寻找同桌座位对
            const deskmateSeats = findDeskmatesPairRandom(availableZoneSeats, assignedSeatIds)

            if (deskmateSeats) {
              assignToSeat(pair.student1, deskmateSeats[0])
              assignToSeat(pair.student2, deskmateSeats[1])
              console.log(`  ✓ 绑定对分配: ${pair.student1.name} & ${pair.student2.name} -> ${deskmateSeats[0].id} & ${deskmateSeats[1].id}`)
            } else {
              console.log(`  ✗ 无法为绑定对找到同桌座位: ${pair.student1.name} & ${pair.student2.name}`)
            }
          }
        }

        // 分配剩余的符合条件的学生
        const remainingEligible = shuffleArray(eligibleStudents.filter(s => !assignedStudentIds.has(s.id)))
        const remainingSeats = availableZoneSeats.filter(s => !assignedSeatIds.has(s.id))

        for (let i = 0; i < Math.min(remainingEligible.length, remainingSeats.length); i++) {
          assignToSeat(remainingEligible[i], remainingSeats[i])
          console.log(`  ✓ 分配: ${remainingEligible[i].name} -> ${remainingSeats[i].id}`)
        }
      }

      // 策略2：处理非选区座位
      console.log('\n=== 阶段2: 处理非选区座位 ===')
      console.log(`非选区座位数: ${nonZoneSeats.length}`)

      const unassignedStudents = allStudents.filter(s => !assignedStudentIds.has(s.id))
      const availableNonZoneSeats = nonZoneSeats.filter(s => !assignedSeatIds.has(s.id))

      console.log(`未分配学生数: ${unassignedStudents.length}`)

      // 如果使用绑定，优先处理绑定对
      if (useBinding) {
        const unassignedPairs = bindingPairs.filter(p =>
          !assignedStudentIds.has(p.student1.id) &&
          !assignedStudentIds.has(p.student2.id)
        )

        for (const pair of shuffleArray(unassignedPairs)) {
          // 随机寻找同桌座位对
          const deskmateSeats = findDeskmatesPairRandom(availableNonZoneSeats, assignedSeatIds)

          if (deskmateSeats) {
            assignToSeat(pair.student1, deskmateSeats[0])
            assignToSeat(pair.student2, deskmateSeats[1])
            console.log(`  ✓ 绑定对分配: ${pair.student1.name} & ${pair.student2.name} -> ${deskmateSeats[0].id} & ${deskmateSeats[1].id}`)
          } else {
            console.log(`  ✗ 无法为绑定对找到同桌座位: ${pair.student1.name} & ${pair.student2.name}`)
          }
        }
      }

      // 分配剩余学生到剩余座位
      const finalUnassigned = shuffleArray(allStudents.filter(s => !assignedStudentIds.has(s.id)))
      const finalAvailableSeats = availableNonZoneSeats.filter(s => !assignedSeatIds.has(s.id))

      for (let i = 0; i < Math.min(finalUnassigned.length, finalAvailableSeats.length); i++) {
        assignToSeat(finalUnassigned[i], finalAvailableSeats[i])
        console.log(`  ✓ 分配: ${finalUnassigned[i].name} -> ${finalAvailableSeats[i].id}`)
      }

      // 统计结果
      const unassigned = allStudents.filter(s => !assignedStudentIds.has(s.id))

      console.log(`\n========== 排位完成 ==========`)
      console.log(`成功分配: ${assignments.length}/${allStudents.length}`)

      if (unassigned.length > 0) {
        console.log(`未分配学生: ${unassigned.map(s => s.name || '未命名').join(', ')}`)
        return {
          success: false,
          message: `部分学生无法分配\n成功分配: ${assignments.length}/${allStudents.length}\n未分配学生: ${unassigned.map(s => s.name || '未命名').join(', ')}`,
          assigned: assignments.length,
          total: allStudents.length,
          unassigned
        }
      }

      return {
        success: true,
        message: `成功分配 ${assignments.length} 个学生`,
        assigned: assignments.length,
        total: allStudents.length
      }

    } catch (error) {
      console.error('排位算法错误:', error)
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
