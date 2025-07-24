<template>
  <div id="app">
    <div v-if="themeInfo && isDarkTheme" class="theme-indicator">
      {{ themeDisplayName }}
    </div>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from './composables/useTheme'

const router = useRouter()
const { themeInfo, isDarkTheme, themeDisplayName, initTheme } = useTheme()

onMounted(async () => {
  await initTheme()
})

watch(
  () => router.currentRoute.value.path,
  async () => {
    await initTheme()
  },
  { flush: 'post' },
)
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
}

.theme-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  padding: 8px 16px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
  opacity: 0.8;
  pointer-events: none;
}
</style>
