import { ref, computed } from 'vue'

// 存储等待确认的操作（增强版，包含更多信息）
const confirmingActions = ref(new Map())

// 默认确认超时时间（毫秒）
const CONFIRM_TIMEOUT = 3000

export function useConfirmAction() {
  // 请求确认操作
  // actionKey: 操作的唯一标识
  // action: 确认后执行的函数
  // message: 自定义确认提示消息（可选）
  const requestConfirm = (actionKey, action, message = '请再次点击确认') => {
    // 如果已经有待确认的操作，执行并清除
    if (confirmingActions.value.has(actionKey)) {
      const { action: pendingAction, timer } = confirmingActions.value.get(actionKey)
      clearTimeout(timer)
      confirmingActions.value.delete(actionKey)

      // 执行操作
      if (typeof action === 'function') {
        action()
      } else if (typeof pendingAction === 'function') {
        pendingAction()
      }

      return true // 已确认
    }

    // 否则，注册待确认操作
    const startTime = Date.now()
    const timer = setTimeout(() => {
      confirmingActions.value.delete(actionKey)
    }, CONFIRM_TIMEOUT)

    confirmingActions.value.set(actionKey, {
      action,
      timer,
      startTime,
      message
    })
    return false // 等待确认
  }

  // 判断特定操作是否在确认中（返回响应式computed）
  const isConfirming = (actionKey) => {
    return computed(() => confirmingActions.value.has(actionKey))
  }

  // 获取剩余时间（毫秒，返回响应式computed）
  const getRemainingTime = (actionKey) => {
    return computed(() => {
      const action = confirmingActions.value.get(actionKey)
      if (!action) return 0
      const elapsed = Date.now() - action.startTime
      return Math.max(0, CONFIRM_TIMEOUT - elapsed)
    })
  }

  // 检查操作是否在等待确认（兼容旧API）
  const isPending = (actionKey) => {
    return confirmingActions.value.has(actionKey)
  }

  // 取消待确认操作
  const cancelConfirm = (actionKey) => {
    if (confirmingActions.value.has(actionKey)) {
      const { timer } = confirmingActions.value.get(actionKey)
      clearTimeout(timer)
      confirmingActions.value.delete(actionKey)
    }
  }

  return {
    requestConfirm,
    isConfirming,
    getRemainingTime,
    isPending,
    cancelConfirm
  }
}
