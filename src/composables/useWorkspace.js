import { useStudentData } from './useStudentData'
import { useTagData } from './useTagData'
import { useSeatChart } from './useSeatChart'
import { useExportSettings } from './useExportSettings'
import { useSeatRelation } from './useSeatRelation'
import { RelationType, RelationStrength } from '../constants/relationTypes.js'

export function useWorkspace() {
  const { students } = useStudentData()
  const { tags } = useTagData()
  const { seatConfig, seats } = useSeatChart()
  const { exportSettings } = useExportSettings()
  const { relations } = useSeatRelation()

  // 保存工作区
  const saveWorkspace = () => {
    try {
      const workspace = {
        version: '1.1', // 版本升级
        timestamp: new Date().toISOString(),
        students: students.value.map(s => ({
          id: s.id,
          name: s.name,
          studentNumber: s.studentNumber,
          tags: s.tags
        })),
        tags: tags.value.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color
        })),
        seatConfig: { ...seatConfig.value },
        seats: seats.value.map(s => ({
          id: s.id,
          groupIndex: s.groupIndex,
          columnIndex: s.columnIndex,
          rowIndex: s.rowIndex,
          studentId: s.studentId,
          isEmpty: s.isEmpty
        })),
        exportSettings: { ...exportSettings.value },
        // 新增：保存联系关系
        relations: relations.value.map(r => ({
          id: r.id,
          studentId1: r.studentId1,
          studentId2: r.studentId2,
          relationType: r.relationType,
          strength: r.strength || 'high',
          metadata: r.metadata || {}
        }))
      }

      const json = JSON.stringify(workspace, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      link.download = `工作区_${timestamp}.bydsce.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return true
    } catch (error) {
      return false
    }
  }

  // 加载工作区
  const loadWorkspace = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.name.endsWith('.bydsce.json')) {
        reject(new Error('请选择 .bydsce.json 格式的工作区文件'))
        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const json = e.target.result
          const workspace = JSON.parse(json)

          // 验证文件格式
          if (!workspace.version || !workspace.students || !workspace.tags) {
            reject(new Error('工作区文件格式不正确'))
            return
          }

          // 版本迁移：v1.0 -> v1.1
          if (workspace.version === '1.0') {
            // 如果存在旧的 bindings 字段，迁移到 relations
            if (workspace.bindings && Array.isArray(workspace.bindings)) {
              workspace.relations = workspace.bindings.map(b => ({
                id: b.id,
                studentId1: b.studentId1,
                studentId2: b.studentId2,
                relationType: RelationType.ATTRACTION, // 旧绑定都视为吸引
                strength: RelationStrength.HIGH,
                metadata: {
                  allowAdjacent: true,
                  minDistance: 0
                }
              }))
              delete workspace.bindings
            }
            workspace.version = '1.1'
          }

          resolve(workspace)
        } catch (error) {
          reject(new Error(`解析工作区文件失败: ${error.message}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('读取文件失败'))
      }

      reader.readAsText(file)
    })
  }

  return {
    saveWorkspace,
    loadWorkspace
  }
}
