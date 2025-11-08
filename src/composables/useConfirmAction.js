import { ref } from 'vue'

// 存储等待确认的操作
const pendingActions = ref(new Map())

export function useConfirmAction() {
  // 请求确认操作
  // actionKey: 操作的唯一标识
  // action: 确认后执行的函数
  // timeout: 确认超时时间（毫秒），默认3秒
  const requestConfirm = (actionKey, action, timeout = 3000) => {
    // 如果已经有待确认的操作，执行并清除
    if (pendingActions.value.has(actionKey)) {
      const { action: pendingAction, timer } = pendingActions.value.get(actionKey)
      clearTimeout(timer)
      pendingActions.value.delete(actionKey)

      // 执行操作
      if (typeof action === 'function') {
        action()
      } else if (typeof pendingAction === 'function') {
        pendingAction()
      }

      return true // 已确认
    }

    // 否则，注册待确认操作
    const timer = setTimeout(() => {
      pendingActions.value.delete(actionKey)
    }, timeout)

    pendingActions.value.set(actionKey, { action, timer })
    return false // 等待确认
  }

  // 检查操作是否在等待确认
  const isPending = (actionKey) => {
    return pendingActions.value.has(actionKey)
  }

  // 取消待确认操作
  const cancelConfirm = (actionKey) => {
    if (pendingActions.value.has(actionKey)) {
      const { timer } = pendingActions.value.get(actionKey)
      clearTimeout(timer)
      pendingActions.value.delete(actionKey)
    }
  }

  return {
    requestConfirm,
    isPending,
    cancelConfirm
  }
}
