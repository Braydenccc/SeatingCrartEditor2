import { useStudentData } from './useStudentData'
import { useTagData } from './useTagData'
import { useSeatChart } from './useSeatChart'
import { useExportSettings } from './useExportSettings'

export function useWorkspace() {
  const { students } = useStudentData()
  const { tags } = useTagData()
  const { seatConfig, seats } = useSeatChart()
  const { exportSettings } = useExportSettings()

  // 保存工作区
  const saveWorkspace = () => {
    try {
      const workspace = {
        version: '1.0',
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
        exportSettings: { ...exportSettings.value }
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
      console.error('保存工作区失败:', error)
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
