import * as XLSX from 'xlsx'

export function useExcelData() {
  // 下载空白模板
  const downloadTemplate = () => {
    // 创建示例数据
    const templateData = [
      ['学号', '姓名', '性别', '不修', '830', '住宿生', '午休', '周五走'],
      ['1', '示例学生1', '男', '1', '', '', '1', ''],
      ['2', '示例学生2', '女', '', '1', '1', '', ''],
      ['3', '示例学生3', '男', '', '1', '', '1', '']
    ]

    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '学生名单')

    XLSX.writeFile(wb, '学生名单模板.xlsx')
  }

  // 从Excel导入 - 返回原始数据供调用者处理
  const importFromExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

          if (!jsonData || jsonData.length < 2) {
            reject(new Error('Excel文件格式不正确，至少需要标题行和一行数据'))
            return
          }

          // 解析标题行
          const headers = jsonData[0]
          if (!headers || headers.length < 2) {
            reject(new Error('Excel文件格式不正确，至少需要学号和姓名列'))
            return
          }

          // 从第三列开始是标签列
          const tagHeaders = headers.slice(2).filter(h => {
            if (h == null) return false
            // 转换为字符串并去除空白
            const str = String(h).trim()
            return str.length > 0
          }).map(h => String(h).trim())

          // 检查学生数量
          const studentCount = jsonData.length - 1
          if (studentCount > 100) {
            // 返回警告信息，由调用者处理
            resolve({
              students: [],
              tagNames: [],
              warning: `检测到 ${studentCount} 个学生，数量较多可能影响性能`
            })
            return
          }

          // 分析哪些标签列包含有效数据
          const validTagIndices = []
          const tagMap = {}

          tagHeaders.forEach((tagName, index) => {
            const colIndex = index + 2
            let hasValidData = false

            for (let i = 1; i < jsonData.length; i++) {
              const cellValue = jsonData[i][colIndex]
              if (cellValue === 1 || cellValue === '1') {
                hasValidData = true
                break
              } else if (cellValue != null && cellValue !== '' && cellValue !== '0' && cellValue !== 0) {
                // 支持任何非空值（包括纯数字）
                hasValidData = true
                break
              }
            }

            if (hasValidData) {
              validTagIndices.push(colIndex)
              tagMap[colIndex] = tagName
            }
          })

          // 检查标签数量
          if (validTagIndices.length > 20) {
            // 返回警告信息，由调用者处理
            resolve({
              students: [],
              tagNames: [],
              warning: `检测到 ${validTagIndices.length} 个标签，数量较多可能影响性能`
            })
            return
          }

          // 收集所有需要创建的标签名称
          const allTagNames = new Set()
          validTagIndices.forEach(colIndex => {
            allTagNames.add(tagMap[colIndex])
          })

          // 收集特殊标签
          for (let i = 1; i < jsonData.length; i++) {
            validTagIndices.forEach(colIndex => {
              const cellValue = jsonData[i][colIndex]
              if (cellValue != null && cellValue !== '' && cellValue !== '0' && cellValue !== 0 && cellValue !== 1 && cellValue !== '1') {
                // 将值转换为字符串作为标签名
                allTagNames.add(String(cellValue).trim())
              }
            })
          }

          // 准备学生数据
          const studentsData = []
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (!row || row.length < 2) continue

            const studentNumber = row[0]
            const name = row[1]

            if (!name || !name.toString().trim()) continue

            // 收集学生的标签名称
            const studentTagNames = []

            validTagIndices.forEach(colIndex => {
              const cellValue = row[colIndex]

              if (cellValue === 1 || cellValue === '1') {
                studentTagNames.push(tagMap[colIndex])
              } else if (cellValue != null && cellValue !== '' && cellValue !== '0' && cellValue !== 0) {
                // 将值转换为字符串作为标签名
                studentTagNames.push(String(cellValue).trim())
              }
            })

            studentsData.push({
              studentNumber: studentNumber ? studentNumber.toString() : null,
              name: name.toString().trim(),
              tagNames: studentTagNames
            })
          }

          resolve({
            students: studentsData,
            tagNames: Array.from(allTagNames)
          })
        } catch (error) {
          reject(new Error(`解析Excel文件失败: ${error.message}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('读取文件失败'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  // 导出到Excel
  const exportToExcel = (students, tags) => {
    if (!students || students.length === 0) {
      alert('没有学生数据可导出')
      return
    }

    // 准备标题行
    const headers = ['学号', '姓名']
    tags.forEach(tag => {
      headers.push(tag.name)
    })

    // 准备数据行
    const data = [headers]

    students.forEach(student => {
      const row = [
        student.studentNumber || '',
        student.name || ''
      ]

      // 为每个标签列添加值
      tags.forEach(tag => {
        const hasTag = student.tags && student.tags.includes(tag.id)
        row.push(hasTag ? '1' : '0')
      })

      data.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '学生名单')

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    XLSX.writeFile(wb, `学生名单_${timestamp}.xlsx`)
  }

  return {
    downloadTemplate,
    importFromExcel,
    exportToExcel
  }
}
