import { useStudentData } from './useStudentData'
import { useTagData } from './useTagData'
import { useSeatChart } from './useSeatChart'
import { useExportSettings } from './useExportSettings'
import { useSeatRelation } from './useSeatRelation'
import { useZoneData } from './useZoneData'
import { RelationType, RelationStrength } from '../constants/relationTypes.js'

const FILE_EXT = '.sce'
const CURRENT_VERSION = '2.0'

export function useWorkspace() {
  const { students } = useStudentData()
  const { tags } = useTagData()
  const { seatConfig, seats } = useSeatChart()
  const { exportSettings } = useExportSettings()
  const { relations } = useSeatRelation()
  const { zones } = useZoneData()

  // 保存工作区
  const saveWorkspace = () => {
    try {
      const workspace = {
        // 元信息
        meta: {
          version: CURRENT_VERSION,
          app: 'SeatingChartEditor',
          createdAt: new Date().toISOString()
        },

        // 学生数据
        students: students.value.map(s => ({
          id: s.id,
          name: s.name,
          studentNumber: s.studentNumber,
          tags: s.tags
        })),

        // 标签定义
        tags: tags.value.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color
        })),

        // 座位配置与布局
        layout: {
          config: { ...seatConfig.value },
          seats: seats.value.map(s => ({
            id: s.id,
            group: s.groupIndex,
            col: s.columnIndex,
            row: s.rowIndex,
            studentId: s.studentId,
            empty: s.isEmpty || false
          }))
        },

        // 学生关系
        relations: relations.value.map(r => ({
          id: r.id,
          s1: r.studentId1,
          s2: r.studentId2,
          type: r.relationType,
          strength: r.strength || 'high',
          meta: r.metadata || {}
        })),

        // 选区
        zones: zones.value.map(z => ({
          id: z.id,
          name: z.name,
          tagIds: [...z.tagIds],
          seatIds: [...z.seatIds],
          visible: z.visible
        })),

        // 导出设置
        exportSettings: { ...exportSettings.value }
      }

      const json = JSON.stringify(workspace, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      link.download = `座位表_${timestamp}${FILE_EXT}`
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
      // 支持 .sce 和旧格式 .bydsce.json
      const name = file.name.toLowerCase()
      if (!name.endsWith(FILE_EXT) && !name.endsWith('.bydsce.json')) {
        reject(new Error(`请选择 ${FILE_EXT} 格式的工作区文件`))
        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const workspace = JSON.parse(e.target.result)

          // 验证基本结构
          if (!workspace.students || !workspace.tags) {
            reject(new Error('工作区文件格式不正确'))
            return
          }

          // 版本迁移
          const migrated = migrateWorkspace(workspace)

          resolve(migrated)
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

  // 版本迁移
  function migrateWorkspace(ws) {
    const version = ws.meta?.version || ws.version || '1.0'

    // v1.0 → v1.1：bindings → relations
    if (version === '1.0') {
      if (ws.bindings && Array.isArray(ws.bindings)) {
        ws.relations = ws.bindings.map(b => ({
          id: b.id,
          s1: b.studentId1,
          s2: b.studentId2,
          type: RelationType.ATTRACTION,
          strength: RelationStrength.HIGH,
          meta: { allowAdjacent: true, minDistance: 0 }
        }))
        delete ws.bindings
      }
    }

    // v1.x → v2.0：扁平结构 → 分组结构
    if (version.startsWith('1.')) {
      // 迁移 seats 到 layout.seats（字段重命名）
      const oldSeats = ws.seats || []
      ws.layout = {
        config: ws.seatConfig || {},
        seats: oldSeats.map(s => ({
          id: s.id,
          group: s.groupIndex,
          col: s.columnIndex,
          row: s.rowIndex,
          studentId: s.studentId,
          empty: s.isEmpty || false
        }))
      }
      delete ws.seatConfig
      delete ws.seats

      // 迁移 relations 字段名
      if (ws.relations) {
        ws.relations = ws.relations.map(r => ({
          id: r.id,
          s1: r.studentId1 || r.s1,
          s2: r.studentId2 || r.s2,
          type: r.relationType || r.type,
          strength: r.strength || 'high',
          meta: r.metadata || r.meta || {}
        }))
      }

      // 添加 meta
      ws.meta = {
        version: CURRENT_VERSION,
        app: 'SeatingChartEditor',
        createdAt: ws.timestamp || new Date().toISOString()
      }
      delete ws.version
      delete ws.timestamp
    }

    // 确保默认值
    ws.relations = ws.relations || []
    ws.zones = ws.zones || []
    ws.exportSettings = ws.exportSettings || {}

    return ws
  }

  return {
    saveWorkspace,
    loadWorkspace
  }
}
