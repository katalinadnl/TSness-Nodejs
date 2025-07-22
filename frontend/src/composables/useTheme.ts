import { ref, computed, onMounted } from 'vue'

export type UserTheme = 'default' | 'debutant' | 'intermediaire' | 'avance' | 'champion'

interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  backgroundSoft: string
  text: string
  textMuted: string
}

interface ThemeInfo {
  theme: UserTheme
  name: string
  description: string
  colors: ThemeColors
}

const currentTheme = ref<UserTheme>('default')
const themeInfo = ref<ThemeInfo | null>(null)
const isLoading = ref(false)

export function useTheme() {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchUserTheme = async () => {
    isLoading.value = true
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/my-theme`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()

      if (data.success) {
        themeInfo.value = data.data
        currentTheme.value = data.data.theme
        applyTheme(data.data.colors)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du thème:', error)
      // En cas d'erreur, utiliser le thème par défaut
      applyDefaultTheme()
    } finally {
      isLoading.value = false
    }
  }

  const applyTheme = (colors: ThemeColors) => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-background', colors.background)
    root.style.setProperty('--color-background-soft', colors.backgroundSoft)
    root.style.setProperty('--color-text', colors.text)
    root.style.setProperty('--color-text-muted', colors.textMuted)

    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${currentTheme.value}`)
  }

  const applyDefaultTheme = () => {
    const defaultColors: ThemeColors = {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      backgroundSoft: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b'
    }
    currentTheme.value = 'default'
    applyTheme(defaultColors)
  }

  const initTheme = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      await fetchUserTheme()
    } else {
      applyDefaultTheme()
    }
  }

  const isDarkTheme = computed(() => {
    return ['debutant', 'intermediaire', 'avance', 'champion'].includes(currentTheme.value)
  })

  const themeDisplayName = computed(() => {
    return themeInfo.value?.name || 'Thème par défaut'
  })

  const themeDescription = computed(() => {
    return themeInfo.value?.description || 'Thème standard de TSness'
  })

  return {
    currentTheme,
    themeInfo,
    isLoading,
    isDarkTheme,
    themeDisplayName,
    themeDescription,
    fetchUserTheme,
    initTheme,
    applyDefaultTheme
  }
}
