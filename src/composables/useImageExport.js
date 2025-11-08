import { useSeatChart } from './useSeatChart'
import { useStudentData } from './useStudentData'
import { useTagData } from './useTagData'
import { useExportSettings } from './useExportSettings'

export function useImageExport() {
  const { seatConfig, organizedSeats } = useSeatChart()
  const { students } = useStudentData()
  const { tags } = useTagData()
  const { exportSettings } = useExportSettings()

  // 导出为图片
  const exportToImage = () => {
    // 创建canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 定义尺寸常量
    const SEAT_WIDTH = 140
    const SEAT_HEIGHT = 100
    const COL_GAP = 20
    const GROUP_GAP = 60
    const PADDING = 40
    const TITLE_HEIGHT = exportSettings.value.showTitle ? 60 : 0
    const ROW_NUMBER_WIDTH = exportSettings.value.showRowNumbers ? 40 : 0
    const GROUP_LABEL_HEIGHT = exportSettings.value.showGroupLabels ? 50 : 0
    const PODIUM_HEIGHT = exportSettings.value.showPodium ? 60 : 0

    // 计算画布尺寸
    const groupWidth = seatConfig.value.columnsPerGroup * SEAT_WIDTH +
                       (seatConfig.value.columnsPerGroup - 1) * COL_GAP
    const canvasWidth = ROW_NUMBER_WIDTH * 2 +
                        seatConfig.value.groupCount * groupWidth +
                        (seatConfig.value.groupCount - 1) * GROUP_GAP +
                        2 * PADDING
    const canvasHeight = TITLE_HEIGHT +
                         seatConfig.value.seatsPerColumn * SEAT_HEIGHT +
                         (seatConfig.value.seatsPerColumn - 1) * 15 +
                         GROUP_LABEL_HEIGHT +
                         PODIUM_HEIGHT +
                         2 * PADDING

    // 设置高分辨率
    const scale = 2
    canvas.width = canvasWidth * scale
    canvas.height = canvasHeight * scale
    ctx.scale(scale, scale)

    // 白色背景
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 绘制标题
    if (exportSettings.value.showTitle) {
      ctx.fillStyle = 'black'
      ctx.font = 'bold 28px Microsoft YaHei, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(exportSettings.value.title, canvasWidth / 2, PADDING + 20)
    }

    // 座位表起始位置
    const seatStartY = PADDING + TITLE_HEIGHT
    const seatStartX = PADDING + ROW_NUMBER_WIDTH

    // 绘制左右行号
    if (exportSettings.value.showRowNumbers) {
      ctx.fillStyle = 'black'
      ctx.font = '18px Microsoft YaHei, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      for (let i = 0; i < seatConfig.value.seatsPerColumn; i++) {
        const rowY = seatStartY + i * (SEAT_HEIGHT + 15) + SEAT_HEIGHT / 2
        const rowNumber = seatConfig.value.seatsPerColumn - i

        // 左侧行号
        ctx.fillText(rowNumber.toString(), PADDING + ROW_NUMBER_WIDTH / 2, rowY)

        // 右侧行号
        ctx.fillText(rowNumber.toString(), canvasWidth - PADDING - ROW_NUMBER_WIDTH / 2, rowY)
      }
    }

    // 绘制座位
    let currentX = seatStartX
    organizedSeats.value.forEach((group, groupIndex) => {
      let columnX = currentX

      group.forEach((column) => {
        let seatY = seatStartY

        column.forEach((seat) => {
          drawSeat(ctx, columnX, seatY, SEAT_WIDTH, SEAT_HEIGHT, seat)
          seatY += SEAT_HEIGHT + 15
        })

        columnX += SEAT_WIDTH + COL_GAP
      })

      currentX += groupWidth + GROUP_GAP
    })

    // 绘制组号
    if (exportSettings.value.showGroupLabels) {
      const groupLabelY = seatStartY +
                          seatConfig.value.seatsPerColumn * SEAT_HEIGHT +
                          (seatConfig.value.seatsPerColumn - 1) * 15 + 30

      ctx.fillStyle = '#23587b'
      ctx.font = 'bold 20px Microsoft YaHei, Arial, sans-serif'
      ctx.textAlign = 'center'

      let groupLabelX = seatStartX
      for (let g = 0; g < seatConfig.value.groupCount; g++) {
        ctx.fillText(`第${g + 1}组`, groupLabelX + groupWidth / 2, groupLabelY)
        groupLabelX += groupWidth + GROUP_GAP
      }
    }

    // 绘制讲台
    if (exportSettings.value.showPodium) {
      const podiumY = canvasHeight - PADDING - PODIUM_HEIGHT + 10
      const podiumWidth = 150
      const podiumX = (canvasWidth - podiumWidth) / 2

      ctx.strokeStyle = '#23587b'
      ctx.lineWidth = 3
      ctx.strokeRect(podiumX, podiumY, podiumWidth, 40)

      ctx.fillStyle = '#23587b'
      ctx.font = 'bold 20px Microsoft YaHei, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('讲台', podiumX + podiumWidth / 2, podiumY + 20)
    }

    // 下载图片
    canvas.toBlob(blob => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      link.download = `座位表_${timestamp}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    }, 'image/png')
  }

  // 绘制单个座位
  function drawSeat(ctx, x, y, width, height, seat) {
    ctx.save()

    // 座位背景和边框（直角矩形）
    if (seat.isEmpty) {
      // 空置座位
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(x, y, width, height)
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)

      ctx.fillStyle = '#999'
      ctx.font = '18px Microsoft YaHei, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('空置', x + width / 2, y + height / 2)
    } else if (seat.studentId) {
      // 有学生
      ctx.fillStyle = 'white'
      ctx.fillRect(x, y, width, height)
      ctx.strokeStyle = '#23587b'
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)

      const student = students.value.find(s => s.id === seat.studentId)
      if (student) {
        // 绘制姓名
        ctx.fillStyle = 'black'
        ctx.font = 'bold 24px Microsoft YaHei, Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(student.name || '未命名', x + width / 2, y + height / 2 - 10)

        // 绘制学号
        if (student.studentNumber) {
          ctx.fillStyle = '#666'
          ctx.font = '16px Microsoft YaHei, Arial, sans-serif'
          ctx.fillText(student.studentNumber.toString(), x + width / 2, y + height / 2 + 18)
        }

        // 绘制标签
        if (exportSettings.value.enableTagLabels && student.tags && student.tags.length > 0) {
          drawTags(ctx, x, y, width, height, student.tags)
        }
      }
    } else {
      // 空位
      ctx.fillStyle = 'white'
      ctx.fillRect(x, y, width, height)
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)

      ctx.fillStyle = '#ccc'
      ctx.font = '18px Microsoft YaHei, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('空', x + width / 2, y + height / 2)
    }

    ctx.restore()
  }

  // 绘制标签
  function drawTags(ctx, seatX, seatY, seatWidth, seatHeight, studentTags) {
    const enabledTags = studentTags
      .map(tagId => {
        const tag = tags.value.find(t => t.id === tagId)
        const setting = exportSettings.value.tagSettings[tagId]
        if (tag && setting && setting.enabled && setting.displayText) {
          return {
            text: setting.displayText,
            color: tag.color
          }
        }
        return null
      })
      .filter(t => t !== null)

    if (enabledTags.length === 0) return

    ctx.save()

    const LABEL_HEIGHT = 24
    const LABEL_PADDING = 8
    const LABEL_GAP = 4
    const OFFSET_X = 8  // 右移以覆盖座位框
    const OFFSET_Y = -8  // 略微向上

    // 计算每个标签的宽度
    ctx.font = 'bold 14px Microsoft YaHei, Arial, sans-serif'
    const labelWidths = enabledTags.map(tag => {
      const textWidth = ctx.measureText(tag.text).width
      return textWidth + LABEL_PADDING * 2
    })

    // 计算总宽度和起始位置
    const totalWidth = labelWidths.reduce((sum, w) => sum + w, 0) +
                       LABEL_GAP * (enabledTags.length - 1)
    let currentX = seatX + seatWidth - totalWidth + OFFSET_X

    // 绘制所有标签
    enabledTags.forEach((tag, index) => {
      const labelWidth = labelWidths[index]
      const labelX = currentX
      const labelY = seatY + OFFSET_Y

      // 绘制标签背景（圆角矩形）
      ctx.fillStyle = tag.color
      ctx.beginPath()
      ctx.roundRect(labelX, labelY, labelWidth, LABEL_HEIGHT, 4)
      ctx.fill()

      // 绘制黑色边框
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // 绘制文字
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(tag.text, labelX + labelWidth / 2, labelY + LABEL_HEIGHT / 2)

      currentX += labelWidth + LABEL_GAP
    })

    ctx.restore()
  }

  return {
    exportToImage
  }
}
