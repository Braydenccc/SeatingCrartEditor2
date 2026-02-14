<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg v-if="type === 'student'" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"></path>
      </svg>
      <svg v-else-if="type === 'tag'" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
    </div>
    <p class="empty-text">{{ message }}</p>
    <p v-if="hint" class="empty-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'student', // 'student' | 'tag'
    validator: (value) => ['student', 'tag'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  margin-bottom: 20px;
  color: #ccc;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .empty-state {
    padding: 30px 16px;
  }

  .empty-icon {
    margin-bottom: 12px;
  }

  .empty-icon svg {
    width: 48px;
    height: 48px;
  }

  .empty-text {
    font-size: 14px;
  }

  .empty-hint {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .empty-state {
    padding: 20px 12px;
  }

  .empty-icon svg {
    width: 40px;
    height: 40px;
  }

  .empty-text {
    font-size: 13px;
  }

  .empty-hint {
    font-size: 11px;
  }
}
</style>
