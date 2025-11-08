import { ref } from 'vue'

const activeTab = ref(1)

export function useSidebar() {
  const setActiveTab = (tabNumber) => {
    activeTab.value = tabNumber
  }

  return {
    activeTab,
    setActiveTab
  }
}
