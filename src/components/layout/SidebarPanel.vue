<template>
  <!-- 移动端遮罩 -->
  <Transition name="overlay-fade">
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
  </Transition>

  <div class="sidebar-panel" :class="{ 'mobile-menu-open': mobileMenuOpen }">
    <div class="sidebar-main">
      <div class="tabs-bar">
        <button v-for="tab in tabs" :key="tab.id" class="tab-button" :class="{ active: activeTab === tab.id }"
          @click="setActiveTab(tab.id)">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
      <div class="options-bar">
        <!-- 文件管理 -->
        <div class="option-content" :class="{ active: activeTab === 1 }">
          <div class="tab-header">
            <h3>工作区管理</h3>
          </div>
          <div class="options-group">
            <input ref="workspaceInput" type="file" accept=".sce,.bydsce.json" style="display: none"
              @change="handleLoadWorkspace" />
            <button class="option-button" @click="$refs.workspaceInput.click()">
              <span>加载工作区</span>
            </button>
            <button class="option-button" @click="handleSaveWorkspace">
              <span>保存工作区</span>
            </button>
          </div>

          <div class="tab-header">
            <h3>Excel导入导出</h3>
          </div>
          <div class="options-group">
            <button class="option-button" @click="handleDownloadTemplate">
              <span>下载空白模板</span>
            </button>
            <input ref="excelInput" type="file" accept=".xlsx,.xls" style="display: none" @change="handleImportExcel" />
            <button class="option-button" @click="$refs.excelInput.click()">
              <span>从Excel导入</span>
            </button>
            <button class="option-button" @click="handleExportExcel">
              <span>导出到Excel</span>
            </button>
          </div>
        </div>

        <!-- 对座位进行局部编辑 -->
        <div class="option-content" :class="{ active: activeTab === 2 }">
          <div class="tab-header">
            <h3>座位表配置</h3>
          </div>
          <div class="options-group">
            <div class="input-group">
              <label for="groupCount">大组数量:</label>
              <input id="groupCount" v-model.number="configForm.groupCount" type="number" min="1" max="10" />
            </div>
            <div class="input-group">
              <label for="columnsPerGroup">每组列数:</label>
              <input id="columnsPerGroup" v-model.number="configForm.columnsPerGroup" type="number" min="1" max="5" />
            </div>
            <div class="input-group">
              <label for="seatsPerColumn">每列座位数:</label>
              <input id="seatsPerColumn" v-model.number="configForm.seatsPerColumn" type="number" min="1" max="10" />
            </div>
            <button class="option-button primary" @click="applyConfig">
              <span>应用配置</span>
            </button>
          </div>

          <div class="tab-header">
            <h3>座位编辑</h3>
          </div>
          <div class="options-group">
            <button id="swapSeat" class="option-button" :class="{ active: currentMode === EditMode.SWAP }"
              @click="toggleSwapMode">
              <span>交换座位</span>
            </button>
            <button id="clearSeat" class="option-button" :class="{ active: currentMode === EditMode.CLEAR }"
              @click="toggleClearMode">
              <span>清空座位</span>
            </button>
            <button id="emptySeat" class="option-button" :class="{ active: currentMode === EditMode.EMPTY_EDIT }"
              @click="toggleEmptyEditMode">
              <span>空置座位</span>
            </button>
          </div>
        </div>

        <!-- 自动调位、随机排位、座位选区、座位绑定 -->
        <div class="option-content" :class="{ active: activeTab === 3 }">
          <div class="tab-header">
            <h3>智能排位</h3>
          </div>

          <!-- 选区列表 -->
          <ZoneList />

          <div class="options-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="useRelations" />
              <span>使用座位联系</span>
            </label>
            <button v-show="useRelations" class="option-button primary" @click="showRelationEditor = true">
              <span>座位联系编辑</span>
            </button>
          </div>

          <div class="options-group">
            <button id="applyAssign" class="option-button primary" :disabled="isAssigning" @click="handleRunAssignment">
              <span>{{ isAssigning ? '排位中...' : '运行排位' }}</span>
            </button>
          </div>
        </div>

        <!-- 导出座位表图片 -->
        <div class="option-content" :class="{ active: activeTab === 4 }">
          <div class="tab-header">
            <h3>导出图片</h3>
          </div>
          <div class="options-group">
            <button class="option-button" @click="showExportDialog = true">
              <span>导出设置</span>
            </button>
          </div>

          <div class="options-group" v-if="lastExportUrl">
            <p class="preview-label">上次导出预览</p>
            <div class="export-thumbnail-wrap">
              <img :src="lastExportUrl" alt="上次导出" class="export-thumbnail" @click="showExportDialog = true" />
            </div>
          </div>

          <div class="options-group">
            <button class="option-button primary" :disabled="isExporting" @click="handleQuickExport">
              <span>{{ isExporting ? '正在生成...' : '导出' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 日志区域 -->
    <div class="log-area">
      <div class="log-header">
        <span class="log-title">日志</span>
        <button class="log-clear-btn" @click="handleClearLogs" v-if="logs.length > 0">
          清空
        </button>
      </div>
      <div class="log-list">
        <div v-for="log in logs" :key="log.id" class="log-item" :class="`log-${log.type}`">
          <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="log-empty">
          暂无日志
        </div>
      </div>
    </div>
  </div>

  <!-- 导出设置弹窗 -->
  <ExportDialog :visible="showExportDialog" @close="showExportDialog = false" @exported="onExported" />

  <!-- 座位联系编辑器模态框 -->
  <SeatRelationEditor :visible="showRelationEditor" @close="showRelationEditor = false" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSidebar } from '@/composables/useSidebar'
import { useSeatChart } from '@/composables/useSeatChart'
import { useEditMode } from '@/composables/useEditMode'
import { useAssignment } from '@/composables/useAssignment'
import { useTagData } from '@/composables/useTagData'
import { useStudentData } from '@/composables/useStudentData'
import { useExportSettings } from '@/composables/useExportSettings'
import { useImageExport } from '@/composables/useImageExport'
import { useExcelData } from '@/composables/useExcelData'
import { useWorkspace } from '@/composables/useWorkspace'
import { useLogger } from '@/composables/useLogger'
import { useConfirmAction } from '@/composables/useConfirmAction'
import { useSeatRelation } from '@/composables/useSeatRelation'
import { useZoneData } from '@/composables/useZoneData'
import ZoneList from '../zone/ZoneList.vue'
import SeatRelationEditor from '../relation/SeatRelationEditor.vue'
import ExportDialog from './ExportPreview.vue'

const { activeTab, mobileMenuOpen, setActiveTab, closeMobileMenu } = useSidebar()
const { seatConfig, updateConfig, clearAllSeats, seats } = useSeatChart()
const { currentMode, setMode, toggleEmptyEditMode, EditMode } = useEditMode()
const { isAssigning, runAssignment } = useAssignment()
const { tags, addTag, clearAllTags } = useTagData()
const { students, addStudent, updateStudent, clearAllStudents } = useStudentData()
const { exportSettings } = useExportSettings()
const { exportToImage } = useImageExport()
const { downloadTemplate, importFromExcel, exportToExcel } = useExcelData()
const { saveWorkspace, loadWorkspace } = useWorkspace()
const { logs, success, warning, error, clearLogs } = useLogger()
const { requestConfirm, isConfirming } = useConfirmAction()

const tabs = [
  { id: 1, label: '文件', icon: '📁' },
  { id: 2, label: '编辑', icon: '✏️' },
  { id: 3, label: '排位', icon: '🔀' },
  { id: 4, label: '导出', icon: '📤' }
]

// 座位配置表单
const configForm = ref({
  groupCount: 3,
  columnsPerGroup: 2,
  seatsPerColumn: 6
})

// 联系编辑器显示状态
const showRelationEditor = ref(false)

// 是否使用座位联系
const useRelations = ref(false)

// 文件输入引用
const workspaceInput = ref(null)
const excelInput = ref(null)

// 标签设置本地副本
const tagSettingsLocal = ref({})

// 导出弹窗状态
const showExportDialog = ref(false)
const lastExportUrl = ref('')
const isExporting = ref(false)

// 导出完成回调
const onExported = (url) => {
  lastExportUrl.value = url
}

// 工作区管理
const handleSaveWorkspace = () => {
  const isSuccess = saveWorkspace()
  if (isSuccess) {
    success('工作区保存成功！')
  } else {
    error('工作区保存失败，请查看控制台了解详情')
  }
}

const handleLoadWorkspace = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    // 直接加载工作区文件并恢复数据
    const workspace = await loadWorkspace(file)

    // 验证返回值
    if (!workspace || !workspace.students || !workspace.tags) {
      error('工作区文件内容不完整或格式不正确')
      event.target.value = ''
      return
    }

    try {
      // 清空现有数据
      clearAllStudents()
      clearAllTags()

      // 恢复标签并记录旧ID->新ID映射
      const oldTagIdToNewId = {}
      workspace.tags.forEach(tag => {
        addTag({ name: tag.name, color: tag.color })
        const added = tags.value.find(t => t.name === tag.name && t.color === tag.color)
        if (added) oldTagIdToNewId[tag.id] = added.id
      })

      // 恢复学生并记录旧ID->新ID映射
      const oldStudentIdToNewId = {}
      workspace.students.forEach(s => {
        const newId = addStudent()
        const mappedTags = (s.tags || []).map(tid => oldTagIdToNewId[tid]).filter(x => x != null)
        updateStudent(newId, {
          name: s.name,
          studentNumber: s.studentNumber,
          tags: mappedTags
        })
        oldStudentIdToNewId[s.id] = newId
      })

      // 恢复座位配置
      if (workspace.layout && workspace.layout.config) {
        updateConfig(workspace.layout.config)
      }

      // 等待 seats 初始化后恢复座位分配
      // 清空所有分配
      clearAllSeats()

      if (workspace.layout && Array.isArray(workspace.layout.seats)) {
        workspace.layout.seats.forEach(sw => {
          const match = seats.value.find(st =>
            st.groupIndex === sw.group && st.columnIndex === sw.col && st.rowIndex === sw.row
          )
          if (match) {
            match.isEmpty = !!sw.empty
            match.studentId = sw.studentId != null ? (oldStudentIdToNewId[sw.studentId] || null) : null
          }
        })
      }

      // 恢复导出设置
      if (workspace.exportSettings) {
        Object.keys(workspace.exportSettings).forEach(k => {
          exportSettings.value[k] = workspace.exportSettings[k]
        })
      }

      // 恢复联系关系
      if (workspace.relations && Array.isArray(workspace.relations)) {
        const { clearAllRelations, addRelation } = useSeatRelation()
        clearAllRelations()

        workspace.relations.forEach(r => {
          const newStudentId1 = oldStudentIdToNewId[r.s1]
          const newStudentId2 = oldStudentIdToNewId[r.s2]

          // 只有当两个学生都成功映射时才恢复联系
          if (newStudentId1 && newStudentId2) {
            addRelation(
              newStudentId1,
              newStudentId2,
              r.type,
              r.strength || 'high',
              r.meta || {}
            )
          }
        })
      }

      // 恢复选区数据
      if (workspace.zones && Array.isArray(workspace.zones)) {
        const { clearAllZones, addZone, updateZone } = useZoneData()
        clearAllZones()

        // 获取已有的 tagIds 映射（标签使用 addTag 自增 ID，需要重新映射）
        const oldTagIdToNewId = {}
        if (workspace.tags && Array.isArray(workspace.tags)) {
          workspace.tags.forEach((t, index) => {
            // tags 已经按顺序恢复，新 ID = tags[index].id
            if (tags.value[index]) {
              oldTagIdToNewId[t.id] = tags.value[index].id
            }
          })
        }

        workspace.zones.forEach(z => {
          const newZone = addZone()
          const mappedTagIds = z.tagIds
            .map(tid => oldTagIdToNewId[tid])
            .filter(id => id !== undefined)
          updateZone(newZone.id, {
            name: z.name,
            tagIds: mappedTagIds,
            seatIds: [...z.seatIds],
            visible: z.visible !== undefined ? z.visible : false
          })
        })
      }

      success('工作区加载并恢复成功！')
    } catch (err) {
      error('恢复工作区时发生错误: ' + (err.message || err))
    }
  } catch (err) {
    error(`加载失败: ${err.message}`)
  } finally {
    event.target.value = ''
  }
}

// Excel操作
const handleDownloadTemplate = () => {
  downloadTemplate()
}

const handleImportExcel = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const result = await importFromExcel(file)

    // 检查是否有警告（学生或标签数量过多）
    if (result.warning) {
      warning(result.warning + '，请减少数据量后重试')
      event.target.value = ''
      return
    }

    // 直接导入，覆盖现有数据
    // 清除现有数据
    clearAllStudents()
    clearAllTags()

    // 预定义颜色列表
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788']

    // 创建所有标签并建立名称到ID的映射
    const tagNameToId = {}
    result.tagNames.forEach((tagName, index) => {
      const color = colors[index % colors.length]
      addTag({ name: tagName, color })

      // 直接从tags数组中找到刚添加的标签
      const foundTag = tags.value.find(t => t.name === tagName)
      if (foundTag) {
        tagNameToId[tagName] = foundTag.id
      }
    })

    // 导入所有学生
    result.students.forEach(studentData => {
      // 将标签名称转换为标签ID
      const studentTags = studentData.tagNames
        .map(tagName => tagNameToId[tagName])
        .filter(id => id != null)

      const newStudentId = addStudent()
      updateStudent(newStudentId, {
        name: studentData.name,
        studentNumber: studentData.studentNumber,
        tags: studentTags
      })
    })

    success(`成功导入 ${result.students.length} 个学生，${result.tagNames.length} 个标签`)
    event.target.value = ''
  } catch (err) {
    error(`导入失败: ${err.message}`)
    event.target.value = ''
  }
}

const handleExportExcel = () => {
  try {
    exportToExcel(students.value, tags.value)
    success('Excel导出成功！')
  } catch (err) {
    error(`导出失败: ${err.message}`)
  }
}

// 初始化时从 seatConfig 读取当前配置
onMounted(() => {
  configForm.value = { ...seatConfig.value }
})

// 快速导出（侧边栏按钮）
const handleQuickExport = async () => {
  if (!seatConfig.value || seatConfig.value.groupCount === 0) {
    warning('请先配置座位表')
    return
  }

  isExporting.value = true
  try {
    const dataUrl = await exportToImage()
    lastExportUrl.value = dataUrl

    // 自动下载
    const link = document.createElement('a')
    link.href = dataUrl
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    link.download = `座位表_${ts}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    success('图片导出成功！')
  } catch (err) {
    error(`导出失败: ${err.message || '未知错误'}`)
  } finally {
    isExporting.value = false
  }
}

// 应用配置
const applyConfig = () => {
  const confirmed = requestConfirm('applyConfig', () => {
    updateConfig(configForm.value)
    clearAllSeats()
    success('座位配置已更新')
  })

  if (!confirmed) {
    warning('再次点击"应用配置"按钮以确认清空所有座位')
  }
}

// 切换交换模式
const toggleSwapMode = () => {
  if (currentMode.value === EditMode.SWAP) {
    setMode(EditMode.NORMAL)
  } else {
    setMode(EditMode.SWAP)
  }
}

// 切换清空模式
const toggleClearMode = () => {
  if (currentMode.value === EditMode.CLEAR) {
    setMode(EditMode.NORMAL)
  } else {
    setMode(EditMode.CLEAR)
  }
}

// 运行排位
const handleRunAssignment = async () => {
  if (isAssigning.value) return

  const result = await runAssignment(useRelations.value)

  if (result.success) {
    success(result.message)
  } else {
    error(result.message)
  }
}

// 日志相关方法
const handleClearLogs = () => {
  clearLogs()
}

const formatLogTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

</script>

<style scoped>
.sidebar-panel {
  width: 20%;
  background: #f8f9fa;
  color: #23587b;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

/* 响应式设计 - 中等屏幕 */
@media (max-width: 1400px) {
  .sidebar-panel {
    width: 25%;
  }
}

/* 响应式设计 - 平板 */
@media (max-width: 1024px) {
  .sidebar-panel {
    width: 100%;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  }
}

.sidebar-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 响应式设计 - 平板和移动设备 */
@media (max-width: 1024px) {
  .sidebar-main {
    flex-direction: column;
    flex: 1;
    min-height: 300px;
    overflow-y: auto;
  }
}

.tabs-bar {
  display: flex;
  justify-content: space-around;
  flex-direction: column;
  align-items: stretch;
  width: 20%;
  height: 100%;
  background: linear-gradient(180deg, #e8eef2 0%, #dce4e9 100%);
  border-right: 1px solid #d0d7dc;
}

/* 响应式设计 - 平板和移动设备 */
@media (max-width: 1024px) {
  .tabs-bar {
    width: 100%;
    height: auto;
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid #d0d7dc;
  }
}

.tab-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 500;
  width: 100%;
  height: 25%;
  background: transparent;
  border: none;
  border-bottom: 1px solid #d0d7dc;
  cursor: pointer;
  color: #5a7a8f;
  transition: all 0.3s ease;
  position: relative;
}

/* 响应式设计 - 平板和移动设备 */
@media (max-width: 1024px) {
  .tab-button {
    flex: 1;
    height: 60px;
    border-bottom: none;
    border-right: 1px solid #d0d7dc;
    font-size: 14px;
  }

  .tab-button:last-child {
    border-right: none;
  }
}

/* 响应式设计 - 移动设备 */
@media (max-width: 768px) {
  .tab-button {
    height: 50px;
    font-size: 13px;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .tab-button {
    font-size: 12px;
    padding: 5px;
  }
}

.tab-button::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 0;
  background: #23587b;
  border-radius: 0 2px 2px 0;
  transition: height 0.3s ease;
}

/* 响应式设计 - 平板和移动设备 */
@media (max-width: 1024px) {
  .tab-button::before {
    left: 50%;
    top: auto;
    bottom: 0;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    border-radius: 2px 2px 0 0;
    transition: width 0.3s ease;
  }

  .tab-button.active::before {
    width: 60%;
    height: 3px;
  }
}

.tab-button:hover {
  background: linear-gradient(90deg, rgba(35, 88, 123, 0.08) 0%, transparent 100%);
  color: #23587b;
}

.tab-button.active {
  background: linear-gradient(90deg, rgba(35, 88, 123, 0.12) 0%, rgba(35, 88, 123, 0.05) 100%);
  color: #23587b;
  font-weight: 600;
}

.tab-button.active::before {
  height: 60%;
}

.tab-label {
  font-size: 15px;
}

@media (max-width: 768px) {
  .tab-label {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .tab-label {
    font-size: 12px;
  }
}

.options-bar {
  width: 80%;
  background: #ffffff;
  overflow-y: auto;
}

/* 响应式设计 - 平板和移动设备 */
@media (max-width: 1024px) {
  .options-bar {
    width: 100%;
  }
}

.options-bar::-webkit-scrollbar {
  width: 6px;
}

.options-bar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.options-bar::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.options-bar::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.option-content {
  display: none;
  flex-direction: column;
  padding: 20px;
  height: 100%;
}

.option-content.active {
  display: flex;
}

/* 响应式设计 - 移动设备 */
@media (max-width: 768px) {
  .option-content {
    padding: 15px;
  }

  .tab-header h3 {
    font-size: 16px;
  }

  .option-button {
    padding: 10px 14px;
    font-size: 13px;
  }

  .options-group {
    gap: 10px;
    margin-bottom: 18px;
    padding-bottom: 14px;
  }
}

@media (max-width: 480px) {
  .option-content {
    padding: 12px;
  }

  .tab-header h3 {
    font-size: 15px;
  }

  .option-button {
    padding: 9px 12px;
    font-size: 12px;
  }

  .input-group label {
    font-size: 12px;
  }

  .input-group input[type="number"],
  .input-group input[type="text"] {
    padding: 8px 10px;
    font-size: 13px;
  }

  .checkbox-label {
    padding: 8px 10px;
    font-size: 13px;
  }
}

.tab-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8eef2;
}

.tab-header h3 {
  margin: 0;
  color: #23587b;
  font-size: 18px;
  font-weight: 600;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.options-group:last-child {
  border-bottom: none;
}

.option-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.option-button:hover {
  background: linear-gradient(135deg, #ffffff 0%, #f0f4f7 100%);
  border-color: #23587b;
  box-shadow: 0 2px 6px rgba(35, 88, 123, 0.15);
  transform: translateX(2px);
}

.option-button.primary {
  background: linear-gradient(135deg, #23587b 0%, #2d6a94 100%);
  color: white;
  border-color: #23587b;
  font-weight: 600;
}

.option-button.primary:hover {
  background: linear-gradient(135deg, #1a4460 0%, #234e6d 100%);
  box-shadow: 0 4px 10px rgba(35, 88, 123, 0.3);
}

.option-button.active {
  background: linear-gradient(135deg, #23587b 0%, #2d6a94 100%);
  color: white;
  border-color: #23587b;
  box-shadow: 0 3px 10px rgba(35, 88, 123, 0.3);
}

.option-button.active:hover {
  background: linear-gradient(135deg, #1a4460 0%, #234e6d 100%);
  box-shadow: 0 4px 12px rgba(35, 88, 123, 0.4);
}

.option-button.confirming {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%) !important;
  color: white !important;
  border-color: #FF9800 !important;
  animation: pulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2);
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 6px rgba(255, 152, 0, 0.3);
  }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.input-group input[type="number"] {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.input-group input[type="text"] {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.input-group input[type="number"]:focus,
.input-group input[type="text"]:focus {
  outline: none;
  border-color: #23587b;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: #eef2f5;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 标签设置列表 */
.tag-settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e8eef2;
}

.tag-setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.tag-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.tag-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.tag-display-text-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.tag-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.tag-text-input {
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  transition: border-color 0.3s;
  width: 100%;
}

.tag-text-input:focus {
  outline: none;
  border-color: #23587b;
}

.tag-text-input::placeholder {
  color: #999;
}

/* 间距设置网格 */
.spacing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.input-group.compact {
  gap: 4px;
}

.input-group.compact label {
  font-size: 12px;
}

.input-group.compact input[type="number"] {
  padding: 6px 8px;
  font-size: 13px;
}

/* 黑白/彩色切换 */
.color-mode-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.color-mode-label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

.radio-label input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 日志区域样式 */
.log-area {
  border-top: 1px solid #e0e0e0;
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 200px;
  min-height: 200px;
  max-height: 200px;
}

/* 导出缩略图 */
.preview-label {
  font-size: 12px;
  color: #888;
  margin: 0 0 6px 0;
}

.export-thumbnail-wrap {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #e8eef2;
  text-align: center;
}

.export-thumbnail {
  max-width: 100%;
  max-height: 180px;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.export-thumbnail:hover {
  opacity: 0.8;
}

/* 响应式设计 - 移动设备 */
@media (max-width: 768px) {
  .log-area {
    height: 150px;
    min-height: 150px;
    max-height: 150px;
  }
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.log-title {
  font-weight: 600;
  font-size: 14px;
  color: #23587b;
}

.log-clear-btn {
  padding: 4px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fff;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.log-clear-btn:hover {
  background: #f5f5f5;
  border-color: #23587b;
  color: #23587b;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  border-left: 3px solid transparent;
  background: #f8f9fa;
}

.log-time {
  color: #999;
  font-family: monospace;
  flex-shrink: 0;
  font-size: 11px;
}

.log-message {
  color: #333;
  word-break: break-word;
}

.log-info {
  border-left-color: #4ECDC4;
}

.log-success {
  border-left-color: #52B788;
  background: #f0f9f4;
}

.log-warning {
  border-left-color: #F7DC6F;
  background: #fffbf0;
}

.log-error {
  border-left-color: #FF6B6B;
  background: #fff5f5;
}

.log-empty {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 13px;
}

/* ==================== tab-icon (desktop 隐藏) ==================== */
.tab-icon {
  display: none;
  font-size: 20px;
  line-height: 1;
}

/* ==================== 移动端遮罩 ==================== */
.mobile-overlay {
  display: none;
}

/* ==================== 移动端布局 ==================== */
@media (max-width: 768px) {
  /* 遮罩层 */
  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 998;
    backdrop-filter: blur(2px);
  }

  /* Vue Transition 淡入淡出动画 */
  .overlay-fade-enter-active,
  .overlay-fade-leave-active {
    transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
  }

  .overlay-fade-enter-from,
  .overlay-fade-leave-to {
    opacity: 0;
    backdrop-filter: blur(0px);
  }

  /* 侧边栏整体：固定在底部 */
  .sidebar-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 999;
    flex-direction: column-reverse;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.12);
    background: #fff;
    height: auto;
    max-height: 56px;
    transition: max-height 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
  }

  .sidebar-panel.mobile-menu-open {
    max-height: 70vh;
  }

  /* sidebar-main flex 反转：tab 在下、内容在上 */
  .sidebar-main {
    display: flex;
    flex-direction: column-reverse;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  /* Tab 栏：底部固定行 */
  .tabs-bar {
    flex-direction: row;
    width: 100%;
    height: 56px;
    min-height: 56px;
    border-right: none;
    border-top: 1px solid #e0e7ec;
    background: #fff;
    padding: 0;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .tab-button {
    flex: 1;
    height: 56px;
    flex-direction: column;
    gap: 2px;
    border-bottom: none;
    border-right: none;
    padding: 6px 4px;
    font-size: 11px;
    color: #8a9caa;
    background: transparent;
    position: relative;
  }

  .tab-button::before {
    display: none;
  }

  .tab-button.active {
    color: #23587b;
    background: rgba(35, 88, 123, 0.06);
    font-weight: 600;
  }

  .tab-button:hover {
    background: rgba(35, 88, 123, 0.04);
  }

  .tab-icon {
    display: block;
    font-size: 20px;
    line-height: 1;
  }

  .tab-label {
    font-size: 11px !important;
  }

  /* 内容面板：在 tab 上方展开 */
  .options-bar {
    width: 100%;
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    border-bottom: 1px solid #e0e7ec;
  }

  .option-content {
    padding: 16px;
    min-height: 0;
    height: auto;
  }

  /* 日志区域在移动端隐藏（节省空间） */
  .log-area {
    display: none;
  }

  /* 选项按钮适配触摸 */
  .option-button {
    min-height: 44px;
    padding: 12px 14px;
    font-size: 14px;
    border-radius: 10px;
  }

  .option-button:hover {
    transform: none;
  }

  /* 输入组适配 */
  .input-group input[type="number"],
  .input-group input[type="text"] {
    min-height: 44px;
    padding: 10px 12px;
    font-size: 15px;
    border-radius: 8px;
  }

  .checkbox-label {
    min-height: 44px;
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 8px;
  }

  /* tab-header 适配 */
  .tab-header {
    margin-bottom: 14px;
    padding-bottom: 10px;
  }

  .tab-header h3 {
    font-size: 16px;
  }

  .options-group {
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 14px;
  }

  /* 导出缩略图 */
  .export-thumbnail {
    max-height: 140px;
  }
}

/* ==================== 超小屏微调 ==================== */
@media (max-width: 380px) {
  .tab-button {
    height: 52px;
  }

  .tab-icon {
    font-size: 18px;
  }

  .tab-label {
    font-size: 10px !important;
  }

  .sidebar-panel {
    max-height: 52px;
  }

  .sidebar-panel.mobile-menu-open {
    max-height: 75vh;
  }

  .tabs-bar {
    height: 52px;
    min-height: 52px;
  }
}
</style>
