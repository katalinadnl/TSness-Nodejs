<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Gym {
  _id: string
  name: string
  address: string
  contactEmail: string
  contactPhone: string
  description: string
  equipment: string[]
  activities: string[]
  isApproved: boolean
  createdAt: string
}

interface TrainingRoom {
  _id: string
  name: string
  capacity: number
  equipment: string[]
  features: string[]
  isApproved: boolean
  difficultyLevel: string
  assignedExerciseTypeId: string
  createdBy: string
  createdAt: string
}

interface Badge {
  _id: string
  name: string
  description: string
  iconUrl: string
  rule?: string
  themeId?: string
  isActive: boolean
  createdAt: string
}

interface UserBadge {
  badgeId: string
  earnedAt: string
  badge: Badge
}

interface LeaderboardEntry {
  user: {
    _id: string
    username: string
    firstName: string
    lastName: string
  }
  badgeCount: number
  badges: UserBadge[]
}

interface Theme {
  _id: string
  name: string
  description: string
  slug: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    backgroundSoft: string
    text: string
    textMuted: string
  }
  isActive: boolean
  createdAt: string
}

const router = useRouter()

const activeTab = ref('dashboard')
const loading = ref(false)
const error = ref('')

const users = ref<User[]>([])
const gyms = ref<Gym[]>([])
const trainingRooms = ref<TrainingRoom[]>([])
const badges = ref<Badge[]>([])
const leaderboard = ref<LeaderboardEntry[]>([])
const themes = ref<Theme[]>([])

const adminProfile = ref<User | null>(null)

const showModal = ref(false)
const modalType = ref('')
const selectedItem = ref<any>(null)

const showCreateBadgeModal = ref(false)
const showEditBadgeModal = ref(false)
const editingBadge = ref<Badge | null>(null)
const badgeFormData = ref({
  name: '',
  description: '',
  iconUrl: '',
  requirements: {
    type: 'participation',
    value: 0,
  },
  theme: {
    createNew: false,
    existingThemeId: '',
    newTheme: {
      name: '',
      description: '',
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#ffffff',
        backgroundSoft: '#f8fafc',
        text: '#1e293b',
        textMuted: '#64748b',
      },
    },
  },
})
const createBadgeLoading = ref(false)
const updateBadgeLoading = ref(false)

const checkAuth = () => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  if (!token || !user) {
    router.push('/login')
    return false
  }

  const userData = JSON.parse(user)
  if (userData.role !== 'super_admin') {
    router.push('/')
    return false
  }

  return true
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

const fetchUsers = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success) {
      users.value = data.data.users
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des utilisateurs'
  }
}

const fetchGyms = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gyms`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success) {
      gyms.value = data.data
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des salles de sport'
  }
}

const fetchTrainingRooms = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/training-rooms`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success) {
      trainingRooms.value = data.data
    }
  } catch (err) {
    error.value = "Erreur lors du chargement des salles d'entraînement"
  }
}

const fetchBadges = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success) {
      badges.value = data.data
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des badges'
  }
}

const fetchLeaderboard = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges/leaderboard`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success) {
      leaderboard.value = data.data
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement du classement'
  }
}

const fetchThemes = async () => {
  if (!checkAuth()) return

  try {
    console.log('Fetching themes from:', `${import.meta.env.VITE_BACKEND_URL}/api/themes/all`)
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/all`, {
      headers: getAuthHeaders(),
    })
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Themes data received:', data)
    if (data.success) {
      themes.value = data.data
      console.log('Themes set to:', themes.value)
    } else {
      console.error('API returned error:', data.message)
      error.value = data.message || 'Error loading themes'
    }
  } catch (err) {
    console.error('Fetch themes error:', err)
    error.value = 'Error loading themes'
  }
}

const toggleUserStatus = async (userId: string, isActive: boolean) => {
  if (!checkAuth()) return

  try {
    const endpoint = isActive ? 'deactivate' : 'activate'
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/${endpoint}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
      },
    )

    const data = await response.json()
    if (data.success) {
      await fetchUsers()
    } else {
      error.value = data.message || 'Erreur lors de la modification du statut'
    }
  } catch (err) {
    error.value = 'Erreur de connexion au serveur'
  }
}

const viewDetails = (item: any, type: string) => {
  selectedItem.value = item
  modalType.value = type
  showModal.value = true
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const openCreateBadgeModal = () => {
  badgeFormData.value = {
    name: '',
    description: '',
    iconUrl: '',
    requirements: {
      type: 'participation',
      value: 0,
    },
    theme: {
      createNew: false,
      existingThemeId: '',
      newTheme: {
        name: '',
        description: '',
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          background: '#ffffff',
          backgroundSoft: '#f8fafc',
          text: '#1e293b',
          textMuted: '#64748b',
        },
      },
    },
  }
  showCreateBadgeModal.value = true
}

const closeCreateBadgeModal = () => {
  showCreateBadgeModal.value = false
  badgeFormData.value = {
    name: '',
    description: '',
    iconUrl: '',
    requirements: {
      type: 'participation',
      value: 0,
    },
    theme: {
      createNew: false,
      existingThemeId: '',
      newTheme: {
        name: '',
        description: '',
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          background: '#ffffff',
          backgroundSoft: '#f8fafc',
          text: '#1e293b',
          textMuted: '#64748b',
        },
      },
    },
  }
}

const createBadge = async () => {
  if (!checkAuth()) return

  createBadgeLoading.value = true
  error.value = ''

  try {
    let rule = ''
    switch (badgeFormData.value.requirements.type) {
      case 'participation':
        rule = `completedChallenges >= ${badgeFormData.value.requirements.value}`
        break
      case 'streak':
        rule = `activeChallenges >= ${badgeFormData.value.requirements.value}`
        break
      case 'achievement':
        rule = `totalCaloriesBurned >= ${badgeFormData.value.requirements.value}`
        break
      case 'time_based':
        rule = `averageProgress >= ${badgeFormData.value.requirements.value}`
        break
      default:
        rule = `completedChallenges >= ${badgeFormData.value.requirements.value}`
    }

    let themeId = null

    if (badgeFormData.value.theme.createNew) {
      const themeResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(badgeFormData.value.theme.newTheme),
      })

      const themeData = await themeResponse.json()
      if (themeData.success) {
        themeId = themeData.data._id
        await fetchThemes()
      } else {
        error.value = themeData.message || 'Error creating theme'
        return
      }
    } else if (badgeFormData.value.theme.existingThemeId) {
      themeId = badgeFormData.value.theme.existingThemeId
    }

    const badgeData = {
      name: badgeFormData.value.name,
      description: badgeFormData.value.description,
      iconUrl: badgeFormData.value.iconUrl,
      rule: rule,
      themeId: themeId,
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(badgeData),
    })

    const data = await response.json()
    if (data.success) {
      await fetchBadges()
      closeCreateBadgeModal()
    } else {
      error.value = data.message || 'Error creating badge'
    }
  } catch (err) {
    error.value = 'Server connection error'
  } finally {
    createBadgeLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getManagerName = (managerId: string) => {
  const manager = users.value.find((u) => u._id === managerId)
  return manager ? `${manager.firstName} ${manager.lastName}` : 'Non assigné'
}

const getGymName = (gymId: string) => {
  const gym = gyms.value.find((g) => g._id === gymId)
  return gym ? gym.name : 'Salle inconnue'
}

const getRequirementLabel = () => {
  switch (badgeFormData.value.requirements.type) {
    case 'participation':
      return 'Nombre de défis à compléter'
    case 'streak':
      return 'Nombre de défis actifs simultanément'
    case 'achievement':
      return 'Nombre de calories à brûler'
    case 'time_based':
      return 'Pourcentage de progression requis'
    default:
      return 'Valeur requise'
  }
}

const getRequirementPlaceholder = () => {
  switch (badgeFormData.value.requirements.type) {
    case 'participation':
      return 'Ex: 5 (pour compléter 5 défis)'
    case 'streak':
      return 'Ex: 3 (avoir 3 défis actifs)'
    case 'achievement':
      return 'Ex: 500 (brûler 500 calories)'
    case 'time_based':
      return 'Ex: 75 (atteindre 75%)'
    default:
      return 'Entrez une valeur'
  }
}

const getRequirementDescription = () => {
  switch (badgeFormData.value.requirements.type) {
    case 'participation':
      return "Le nombre total de défis qu'un utilisateur doit compléter pour obtenir ce badge"
    case 'streak':
      return "Le nombre de défis qu'un utilisateur doit avoir actifs en même temps"
    case 'achievement':
      return "Le nombre total de calories qu'un utilisateur doit brûler (cumulé)"
    case 'time_based':
      return 'Le pourcentage de progression moyenne requis (de 1 à 100)'
    default:
      return ''
  }
}

const getMinValue = () => {
  switch (badgeFormData.value.requirements.type) {
    case 'time_based':
      return 1
    default:
      return 1
  }
}

const toggleThemeStatus = async (themeId: string, isActive: boolean) => {
  if (!checkAuth()) return

  try {
    const endpoint = isActive ? 'deactivate' : 'activate'
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/themes/${themeId}/${endpoint}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
      },
    )

    const data = await response.json()
    if (data.success) {
      await fetchThemes()
    } else {
      error.value = data.message || 'Error changing theme status'
    }
  } catch (err) {
    error.value = 'Server connection error'
  }
}

const openEditBadgeModal = (badge: Badge) => {
  editingBadge.value = badge

  let requirementType = 'participation'
  let requirementValue = 0

  if (badge.rule) {
    const rule = badge.rule.toLowerCase()
    if (rule.includes('completedchallenges')) {
      requirementType = 'participation'
      const match = rule.match(/>=\s*(\d+)/)
      requirementValue = match ? parseInt(match[1]) : 0
    } else if (rule.includes('activechallenges')) {
      requirementType = 'streak'
      const match = rule.match(/>=\s*(\d+)/)
      requirementValue = match ? parseInt(match[1]) : 0
    } else if (rule.includes('totalcaloriesburned')) {
      requirementType = 'achievement'
      const match = rule.match(/>=\s*(\d+)/)
      requirementValue = match ? parseInt(match[1]) : 0
    } else if (rule.includes('averageprogress')) {
      requirementType = 'time_based'
      const match = rule.match(/>=\s*(\d+)/)
      requirementValue = match ? parseInt(match[1]) : 0
    }
  }

  badgeFormData.value = {
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    requirements: {
      type: requirementType,
      value: requirementValue,
    },
    theme: {
      createNew: false,
      existingThemeId: badge.themeId || '',
      newTheme: {
        name: '',
        description: '',
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          background: '#ffffff',
          backgroundSoft: '#f8fafc',
          text: '#1e293b',
          textMuted: '#64748b',
        },
      },
    },
  }
  showEditBadgeModal.value = true
}

const closeEditBadgeModal = () => {
  showEditBadgeModal.value = false
  editingBadge.value = null
  badgeFormData.value = {
    name: '',
    description: '',
    iconUrl: '',
    requirements: {
      type: 'participation',
      value: 0,
    },
    theme: {
      createNew: false,
      existingThemeId: '',
      newTheme: {
        name: '',
        description: '',
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          background: '#ffffff',
          backgroundSoft: '#f8fafc',
          text: '#1e293b',
          textMuted: '#64748b',
        },
      },
    },
  }
}

const updateBadge = async () => {
  if (!checkAuth() || !editingBadge.value) return

  updateBadgeLoading.value = true
  error.value = ''

  try {
    let rule = ''
    switch (badgeFormData.value.requirements.type) {
      case 'participation':
        rule = `completedChallenges >= ${badgeFormData.value.requirements.value}`
        break
      case 'streak':
        rule = `activeChallenges >= ${badgeFormData.value.requirements.value}`
        break
      case 'achievement':
        rule = `totalCaloriesBurned >= ${badgeFormData.value.requirements.value}`
        break
      case 'time_based':
        rule = `averageProgress >= ${badgeFormData.value.requirements.value}`
        break
      default:
        rule = `completedChallenges >= ${badgeFormData.value.requirements.value}`
    }

    let themeId = null

    if (badgeFormData.value.theme.createNew) {
      const themeResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(badgeFormData.value.theme.newTheme),
      })

      const themeData = await themeResponse.json()
      if (themeData.success) {
        themeId = themeData.data._id
        await fetchThemes() // Recharger les thèmes
      } else {
        error.value = themeData.message || 'Error creating theme'
        return
      }
    } else if (badgeFormData.value.theme.existingThemeId) {
      themeId = badgeFormData.value.theme.existingThemeId
    }

    const badgeData = {
      name: badgeFormData.value.name,
      description: badgeFormData.value.description,
      iconUrl: badgeFormData.value.iconUrl,
      rule: rule,
      themeId: themeId,
    }

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/badges/${editingBadge.value._id}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(badgeData),
      },
    )

    const data = await response.json()
    if (data.success) {
      await fetchBadges()
      closeEditBadgeModal()
    } else {
      error.value = data.message || 'Error updating badge'
    }
  } catch (err) {
    error.value = 'Server connection error'
  } finally {
    updateBadgeLoading.value = false
  }
}

const deleteBadge = async (badgeId: string, badgeName: string) => {
  if (!checkAuth()) return

  const confirmed = confirm(
    `Êtes-vous sûr de vouloir supprimer le badge "${badgeName}" ?\n\nCette action est irréversible.`,
  )
  if (!confirmed) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges/${badgeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    if (data.success) {
      await fetchBadges()
    } else {
      error.value = data.message || 'Error deleting badge'
    }
  } catch (err) {
    error.value = 'Server connection error'
  }
}

const showCreateThemeModal = ref(false)
const showEditThemeModal = ref(false)
const editingTheme = ref<Theme | null>(null)
const themeFormData = ref({
  name: '',
  description: '',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#ffffff',
    backgroundSoft: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
  },
})
const createThemeLoading = ref(false)
const updateThemeLoading = ref(false)

const openCreateThemeModal = () => {
  themeFormData.value = {
    name: '',
    description: '',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      backgroundSoft: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
    },
  }
  showCreateThemeModal.value = true
}

const closeCreateThemeModal = () => {
  showCreateThemeModal.value = false
  themeFormData.value = {
    name: '',
    description: '',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      backgroundSoft: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
    },
  }
}

const createTheme = async () => {
  if (!checkAuth()) return

  createThemeLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(themeFormData.value),
    })

    const data = await response.json()
    if (data.success) {
      await fetchThemes()
      closeCreateThemeModal()
    } else {
      error.value = data.message || 'Error creating theme'
    }
  } catch (err) {
    error.value = 'Server connection error'
  } finally {
    createThemeLoading.value = false
  }
}

const openEditThemeModal = (theme: Theme) => {
  editingTheme.value = theme
  themeFormData.value = {
    name: theme.name,
    description: theme.description,
    colors: { ...theme.colors },
  }
  showEditThemeModal.value = true
}

const closeEditThemeModal = () => {
  showEditThemeModal.value = false
  editingTheme.value = null
  themeFormData.value = {
    name: '',
    description: '',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      backgroundSoft: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
    },
  }
}

const updateTheme = async () => {
  if (!checkAuth() || !editingTheme.value) return

  updateThemeLoading.value = true
  error.value = ''

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/themes/${editingTheme.value._id}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(themeFormData.value),
      },
    )

    const data = await response.json()
    if (data.success) {
      await fetchThemes()
      closeEditThemeModal()
    } else {
      error.value = data.message || 'Error updating theme'
    }
  } catch (err) {
    error.value = 'Server connection error'
  } finally {
    updateThemeLoading.value = false
  }
}

const deleteTheme = async (themeId: string, themeName: string) => {
  if (!checkAuth()) return

  const confirmed = confirm(
    `Êtes-vous sûr de vouloir supprimer le thème "${themeName}" ?\n\nCette action est irréversible.`,
  )
  if (!confirmed) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes/${themeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    if (data.success) {
      await fetchThemes()
    } else {
      error.value = data.message || 'Error deleting theme'
    }
  } catch (err) {
    error.value = 'Server connection error'
  }
}

const getThemeName = (themeId: string) => {
  const theme = themes.value.find((t) => t._id === themeId)
  return theme ? theme.name : 'Theme not found'
}

const getThemePreviewStyle = (themeId: string) => {
  const theme = themes.value.find((t) => t._id === themeId)
  if (!theme) return {}

  return {
    background: `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    display: 'inline-block',
    marginLeft: '8px',
  }
}

const fetchAdminProfile = async () => {
  if (!checkAuth()) return

  try {
    const user = localStorage.getItem('user')
    if (user) {
      adminProfile.value = JSON.parse(user)
    }
  } catch (err) {
    console.error('Error loading admin profile:', err)
  }
}

onMounted(() => {
  if (checkAuth()) {
    fetchAdminProfile()
    fetchUsers()
    fetchGyms()
    fetchTrainingRooms()
    fetchBadges()
    fetchLeaderboard()
    fetchThemes()
  }
})
</script>

<template>
  <div class="admin-container">
    <div class="admin-header">
      <div class="header-content">
        <h1>Dashboard Super Admin</h1>
        <p>Gestion complète de TSness</p>
      </div>
      <div class="header-actions">
        <button @click="logout" class="btn btn-secondary">Déconnexion</button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="tabs-navigation">
      <button
        @click="activeTab = 'dashboard'"
        :class="{ active: activeTab === 'dashboard' }"
        class="tab-button"
      >
        📊 Dashboard
      </button>
      <button
        @click="activeTab = 'users'"
        :class="{ active: activeTab === 'users' }"
        class="tab-button"
      >
        👥 Utilisateurs
      </button>
      <button
        @click="activeTab = 'gyms'"
        :class="{ active: activeTab === 'gyms' }"
        class="tab-button"
      >
        🏋️ Salles de Sport
      </button>
      <button
        @click="activeTab = 'rooms'"
        :class="{ active: activeTab === 'rooms' }"
        class="tab-button"
      >
        🏃 Salles d'Entraînement
      </button>
      <button
        @click="activeTab = 'badges'"
        :class="{ active: activeTab === 'badges' }"
        class="tab-button"
      >
        🏆 Badges
      </button>
      <button
        @click="activeTab = 'leaderboard'"
        :class="{ active: activeTab === 'leaderboard' }"
        class="tab-button"
      >
        🥇 Classement
      </button>
      <button
        @click="activeTab = 'themes'"
        :class="{ active: activeTab === 'themes' }"
        class="tab-button"
      >
        🎨 Thèmes
      </button>
      <button
        @click="activeTab = 'profile'"
        :class="{ active: activeTab === 'profile' }"
        class="tab-button"
      >
        👤 Profil
      </button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'dashboard'" class="dashboard-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>{{ users.length }}</h3>
              <p>Utilisateurs</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏋️</div>
            <div class="stat-content">
              <h3>{{ gyms.length }}</h3>
              <p>Salles de Sport</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏃</div>
            <div class="stat-content">
              <h3>{{ trainingRooms.length }}</h3>
              <p>Salles d'Entraînement</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <h3>{{ badges.length }}</h3>
              <p>Badges</p>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'users'" class="users-content">
        <div class="section-header">
          <h2>Gestionnaires et Utilisateurs</h2>
          <span class="count">{{ users.length }} utilisateur(s)</span>
        </div>
        <div class="items-grid">
          <div v-for="user in users" :key="user._id" class="item-card">
            <div class="item-info">
              <div class="item-avatar">
                {{ user.firstName?.[0] || user.username[0] }}
              </div>
              <div class="item-details">
                <h3>{{ user.firstName }} {{ user.lastName }}</h3>
                <p>@{{ user.username }}</p>
                <p>{{ user.email }}</p>
                <div class="item-meta">
                  <span class="role" :class="user.role">{{ user.role }}</span>
                  <span class="status" :class="{ active: user.isActive }">
                    {{ user.isActive ? 'Actif' : 'Inactif' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <button @click="viewDetails(user, 'user')" class="btn btn-info">Voir</button>
              <button
                v-if="user.role === 'gym_owner' || user.role === 'client'"
                @click="toggleUserStatus(user._id, user.isActive)"
                :class="user.isActive ? 'btn btn-warning' : 'btn btn-success'"
              >
                {{ user.isActive ? 'Désactiver' : 'Activer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'gyms'" class="gyms-content">
        <div class="section-header">
          <h2>Salles de Sport</h2>
          <span class="count">{{ gyms.length }} salle(s)</span>
        </div>
        <div class="items-grid">
          <div v-for="gym in gyms" :key="gym._id" class="item-card">
            <div class="item-info">
              <div class="item-avatar gym-avatar">🏋️</div>
              <div class="item-details">
                <h3>{{ gym.name }}</h3>
                <p>{{ gym.address }}</p>
                <p>{{ gym.description }}</p>
                <p>📞 {{ gym.contactPhone }}</p>
                <p>✉️ {{ gym.contactEmail }}</p>
                <div class="item-meta">
                  <span class="status" :class="{ active: gym.isApproved }">
                    {{ gym.isApproved ? 'Approuvé' : 'En attente' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <button @click="viewDetails(gym, 'gym')" class="btn btn-info">Voir</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'rooms'" class="rooms-content">
        <div class="section-header">
          <h2>Salles d'Entraînement</h2>
          <span class="count">{{ trainingRooms.length }} salle(s)</span>
        </div>
        <div class="items-grid">
          <div v-for="room in trainingRooms" :key="room._id" class="item-card">
            <div class="item-info">
              <div class="item-avatar room-avatar">🏃</div>
              <div class="item-details">
                <h3>{{ room.name }}</h3>
                <p>👥 Capacité: {{ room.capacity }} personnes</p>
                <p>🏋️ {{ room.equipment?.join(', ') || 'Aucun équipement' }}</p>
                <p>🎯 Niveau: {{ room.difficultyLevel }}</p>
                <div class="item-meta">
                  <span class="status" :class="{ active: room.isApproved }">
                    {{ room.isApproved ? 'Approuvé' : 'En attente' }}
                  </span>
                  <span class="manager">{{ room.createdBy }}</span>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <button @click="viewDetails(room, 'room')" class="btn btn-info">Voir</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'badges'" class="badges-content">
        <div class="section-header">
          <h2>Badges et Récompenses</h2>
          <div class="header-actions">
            <button @click="openCreateBadgeModal" class="btn btn-primary">+ Créer Badge</button>
            <span class="count">{{ badges.length }} badge(s)</span>
          </div>
        </div>
        <div class="items-grid">
          <div v-for="badge in badges" :key="badge._id" class="item-card">
            <div class="item-info">
              <div class="item-avatar badge-avatar">
                <img :src="badge.iconUrl" :alt="badge.name" class="badge-icon" />
              </div>
              <div class="item-details">
                <h3>{{ badge.name }}</h3>
                <p>{{ badge.description }}</p>
                <div class="badge-theme-info" v-if="badge.themeId">
                  <span class="theme-label">Thème associé:</span>
                  <span class="theme-name">{{ getThemeName(badge.themeId) }}</span>
                  <div class="theme-preview" :style="getThemePreviewStyle(badge.themeId)"></div>
                </div>
                <div class="badge-theme-info" v-else>
                  <span class="theme-label no-theme">Aucun thème associé</span>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <button @click="viewDetails(badge, 'badge')" class="btn btn-info">Voir</button>
              <button @click="openEditBadgeModal(badge)" class="btn btn-secondary">Modifier</button>
              <button
                @click="deleteBadge(badge._id, badge.name)"
                class="btn btn-danger"
                title="Supprimer ce badge"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'leaderboard'" class="leaderboard-content">
        <div class="section-header">
          <h2>Classement des Badges</h2>
          <span class="count">{{ leaderboard.length }} client(s) classé(s)</span>
        </div>

        <div class="leaderboard-grid">
          <div v-for="(entry, index) in leaderboard" :key="entry.user._id" class="leaderboard-card">
            <div class="rank">
              <div
                class="rank-number"
                :class="{
                  gold: index === 0,
                  silver: index === 1,
                  bronze: index === 2,
                }"
              >
                {{ index + 1 }}
              </div>
              <div class="rank-icon">
                <span v-if="index === 0">🥇</span>
                <span v-else-if="index === 1">🥈</span>
                <span v-else-if="index === 2">🥉</span>
                <span v-else>🏅</span>
              </div>
            </div>

            <div class="user-info">
              <div class="user-avatar">
                {{ entry.user.firstName.charAt(0) }}{{ entry.user.lastName.charAt(0) }}
              </div>
              <div class="user-details">
                <h3>{{ entry.user.firstName }} {{ entry.user.lastName }}</h3>
                <p>@{{ entry.user.username }}</p>
                <p class="badge-count">{{ entry.badgeCount }} badge(s)</p>
              </div>
            </div>

            <div class="user-badges">
              <div class="badges-preview">
                <div
                  v-for="(userBadge, badgeIndex) in entry.badges.slice(0, 3)"
                  :key="userBadge.badgeId"
                  class="badge-mini"
                >
                  <img
                    :src="
                      userBadge.badge?.iconUrl ||
                      'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/badge.png'
                    "
                    :alt="userBadge.badge?.name || 'Badge'"
                    class="badge-mini-icon"
                  />
                </div>
                <div v-if="entry.badges.length > 3" class="badge-mini more-badges">
                  +{{ entry.badges.length - 3 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'profile'" class="profile-content">
        <div class="section-header">
          <h2>Mon Profil</h2>
        </div>

        <div v-if="adminProfile" class="profile-section">
          <div class="profile-details">
            <div class="detail-card">
              <h4>Informations personnelles</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Nom d'utilisateur:</strong>
                  <span>{{ adminProfile.username }}</span>
                </div>
                <div class="detail-item">
                  <strong>Email:</strong>
                  <span>{{ adminProfile.email }}</span>
                </div>
                <div class="detail-item">
                  <strong>Rôle:</strong>
                  <span>{{
                    adminProfile.role === 'super_admin' ? 'Super Administrateur' : adminProfile.role
                  }}</span>
                </div>
                <div class="detail-item">
                  <strong>Statut:</strong>
                  <span class="status active">{{
                    adminProfile.isActive ? 'Actif' : 'Inactif'
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="loading-message">Chargement du profil...</div>
      </div>

      <div v-if="activeTab === 'themes'" class="themes-content">
        <div class="section-header">
          <h2>Thèmes</h2>
          <div class="header-actions">
            <button @click="openCreateThemeModal" class="btn btn-primary">+ Créer Thème</button>
            <span class="count">{{ themes.length }} thème(s)</span>
          </div>
        </div>
        <div class="items-grid">
          <div v-for="theme in themes" :key="theme._id" class="item-card theme-card">
            <div class="item-info">
              <div
                class="theme-preview-card"
                :style="{
                  '--theme-primary': theme.colors.primary,
                  '--theme-secondary': theme.colors.secondary,
                  '--theme-accent': theme.colors.accent,
                  '--theme-background': theme.colors.background,
                  '--theme-background-soft': theme.colors.backgroundSoft,
                  '--theme-text': theme.colors.text,
                  '--theme-text-muted': theme.colors.textMuted,
                }"
              >
                <div
                  class="theme-header"
                  :style="{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  }"
                >
                  <div class="theme-title" :style="{ color: theme.colors.text }">
                    {{ theme.name }}
                  </div>
                  <div class="theme-subtitle" :style="{ color: theme.colors.textMuted }">
                    Prévisualisation
                  </div>
                </div>
                <div class="theme-content" :style="{ background: theme.colors.background }">
                  <div
                    class="theme-element primary-btn"
                    :style="{
                      background: theme.colors.primary,
                      color:
                        theme.colors.background === '#ffffff' ||
                        theme.colors.background === '#f0fdf4' ||
                        theme.colors.background === '#fff7ed' ||
                        theme.colors.background === '#f0f9ff'
                          ? '#000'
                          : '#fff',
                    }"
                  >
                    Bouton Principal
                  </div>
                  <div
                    class="theme-element secondary-btn"
                    :style="{
                      background: theme.colors.secondary,
                      color:
                        theme.colors.background === '#ffffff' ||
                        theme.colors.background === '#f0fdf4' ||
                        theme.colors.background === '#fff7ed' ||
                        theme.colors.background === '#f0f9ff'
                          ? '#000'
                          : '#fff',
                    }"
                  >
                    Bouton Secondaire
                  </div>
                  <div class="theme-text" :style="{ color: theme.colors.text }">
                    Texte principal
                  </div>
                  <div class="theme-text-muted" :style="{ color: theme.colors.textMuted }">
                    Texte secondaire
                  </div>
                </div>
                <div class="theme-colors">
                  <div
                    class="color-dot"
                    :style="{ background: theme.colors.primary }"
                    :title="`Primaire: ${theme.colors.primary}`"
                  ></div>
                  <div
                    class="color-dot"
                    :style="{ background: theme.colors.secondary }"
                    :title="`Secondaire: ${theme.colors.secondary}`"
                  ></div>
                  <div
                    class="color-dot"
                    :style="{ background: theme.colors.accent }"
                    :title="`Accent: ${theme.colors.accent}`"
                  ></div>
                  <div
                    class="color-dot"
                    :style="{ background: theme.colors.background }"
                    :title="`Arrière-plan: ${theme.colors.background}`"
                  ></div>
                </div>
              </div>
              <div class="item-details">
                <h3>{{ theme.name }}</h3>
                <p>{{ theme.description }}</p>
                <p class="theme-slug">Slug: {{ theme.slug }}</p>
                <div class="item-meta">
                  <span class="status" :class="{ active: theme.isActive }">
                    {{ theme.isActive ? 'Actif' : 'Inactif' }}
                  </span>
                  <span class="theme-date">{{ formatDate(theme.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <button @click="viewDetails(theme, 'theme')" class="btn btn-info">Voir</button>
              <button @click="openEditThemeModal(theme)" class="btn btn-secondary">Modifier</button>
              <button
                @click="toggleThemeStatus(theme._id, theme.isActive)"
                :class="theme.isActive ? 'btn btn-warning' : 'btn btn-success'"
              >
                {{ theme.isActive ? 'Désactiver' : 'Activer' }}
              </button>
              <button
                @click="deleteTheme(theme._id, theme.name)"
                class="btn btn-danger"
                title="Supprimer ce thème"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            {{
              modalType === 'user'
                ? 'Détails Utilisateur'
                : modalType === 'gym'
                  ? 'Détails Salle de Sport'
                  : modalType === 'room'
                    ? "Détails Salle d'Entraînement"
                    : modalType === 'badge'
                      ? 'Détails Badge'
                      : 'Détails Thème'
            }}
          </h3>
          <button @click="showModal = false" class="modal-close">&times;</button>
        </div>
        <div v-if="selectedItem" class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <strong>ID:</strong>
              <span>{{ selectedItem._id }}</span>
            </div>
            <template v-if="modalType === 'user'">
              <div class="detail-item">
                <strong>Nom:</strong>
                <span>{{ selectedItem.firstName }} {{ selectedItem.lastName }}</span>
              </div>
              <div class="detail-item">
                <strong>Email:</strong>
                <span>{{ selectedItem.email }}</span>
              </div>
              <div class="detail-item">
                <strong>Rôle:</strong>
                <span>{{ selectedItem.role }}</span>
              </div>
            </template>
            <template v-if="modalType === 'gym'">
              <div class="detail-item">
                <strong>Nom:</strong>
                <span>{{ selectedItem.name }}</span>
              </div>
              <div class="detail-item">
                <strong>Adresse:</strong>
                <span>{{ selectedItem.address }}</span>
              </div>
              <div class="detail-item">
                <strong>Description:</strong>
                <span>{{ selectedItem.description }}</span>
              </div>
              <div class="detail-item">
                <strong>Téléphone:</strong>
                <span>{{ selectedItem.contactPhone }}</span>
              </div>
              <div class="detail-item">
                <strong>Email:</strong>
                <span>{{ selectedItem.contactEmail }}</span>
              </div>
              <div class="detail-item">
                <strong>Équipements:</strong>
                <span>{{ selectedItem.equipment?.join(', ') || 'Aucun équipement' }}</span>
              </div>
              <div class="detail-item">
                <strong>Activités:</strong>
                <span>{{ selectedItem.activities?.join(', ') || 'Aucune activité' }}</span>
              </div>
              <div class="detail-item">
                <strong>Statut:</strong>
                <span>{{ selectedItem.isApproved ? 'Approuvé' : "En attente d'approbation" }}</span>
              </div>
            </template>
            <template v-if="modalType === 'room'">
              <div class="detail-item">
                <strong>Nom:</strong>
                <span>{{ selectedItem.name }}</span>
              </div>
              <div class="detail-item">
                <strong>Capacité:</strong>
                <span>{{ selectedItem.capacity }} personnes</span>
              </div>
              <div class="detail-item">
                <strong>Équipements:</strong>
                <span>{{ selectedItem.equipment?.join(', ') || 'Aucun équipement' }}</span>
              </div>
              <div class="detail-item">
                <strong>Fonctionnalités:</strong>
                <span>{{ selectedItem.features?.join(', ') || 'Aucune fonctionnalité' }}</span>
              </div>
              <div class="detail-item">
                <strong>Niveau de difficulté:</strong>
                <span>{{ selectedItem.difficultyLevel }}</span>
              </div>
              <div class="detail-item">
                <strong>Statut:</strong>
                <span>{{ selectedItem.isApproved ? 'Approuvé' : "En attente d'approbation" }}</span>
              </div>
              <div class="detail-item">
                <strong>Créé par:</strong>
                <span>{{ selectedItem.createdBy }}</span>
              </div>
            </template>
            <template v-if="modalType === 'badge'">
              <div class="detail-item">
                <strong>Nom:</strong>
                <span>{{ selectedItem.name }}</span>
              </div>
              <div class="detail-item">
                <strong>Description:</strong>
                <span>{{ selectedItem.description }}</span>
              </div>
            </template>
            <template v-if="modalType === 'theme'">
              <div class="detail-item">
                <strong>Nom:</strong>
                <span>{{ selectedItem.name }}</span>
              </div>
              <div class="detail-item">
                <strong>Description:</strong>
                <span>{{ selectedItem.description }}</span>
              </div>
              <div class="detail-item">
                <strong>Slug:</strong>
                <span>{{ selectedItem.slug }}</span>
              </div>
              <div class="detail-item">
                <strong>Statut:</strong>
                <span>{{ selectedItem.isActive ? 'Actif' : 'Inactif' }}</span>
              </div>
              <div class="detail-item">
                <strong>Couleurs:</strong>
                <div class="theme-colors-detail">
                  <div class="color-item">
                    <div
                      class="color-sample"
                      :style="{ background: selectedItem.colors.primary }"
                    ></div>
                    <span>Primaire: {{ selectedItem.colors.primary }}</span>
                  </div>
                  <div class="color-item">
                    <div
                      class="color-sample"
                      :style="{ background: selectedItem.colors.secondary }"
                    ></div>
                    <span>Secondaire: {{ selectedItem.colors.secondary }}</span>
                  </div>
                  <div class="color-item">
                    <div
                      class="color-sample"
                      :style="{ background: selectedItem.colors.accent }"
                    ></div>
                    <span>Accent: {{ selectedItem.colors.accent }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="detail-item">
              <strong>Créé le:</strong>
              <span>{{ formatDate(selectedItem.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création de badge -->
    <div v-if="showCreateBadgeModal" class="modal-overlay" @click="closeCreateBadgeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Créer un nouveau badge</h3>
          <button @click="closeCreateBadgeModal" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createBadge" class="create-form">
            <div class="form-group">
              <label for="badgeName">Nom du badge *</label>
              <input
                id="badgeName"
                v-model="badgeFormData.name"
                type="text"
                required
                class="form-input"
                placeholder="Entrez le nom du badge"
              />
            </div>
            <div class="form-group">
              <label for="badgeDescription">Description *</label>
              <textarea
                id="badgeDescription"
                v-model="badgeFormData.description"
                required
                class="form-input form-textarea"
                placeholder="Décrivez ce badge et comment l'obtenir"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="badgeIconUrl">URL de l'icône *</label>
              <input
                id="badgeIconUrl"
                v-model="badgeFormData.iconUrl"
                type="url"
                required
                class="form-input"
                placeholder="https://example.com/badge-icon.png"
              />
            </div>
            <div class="form-group">
              <label for="requirementType">Type d'exigence *</label>
              <select
                id="requirementType"
                v-model="badgeFormData.requirements.type"
                required
                class="form-input"
              >
                <option value="participation">Participation à des défis</option>
                <option value="streak">Série de connexions</option>
                <option value="achievement">Accomplissement spécifique</option>
                <option value="time_based">Basé sur le temps</option>
              </select>
            </div>
            <div class="form-group">
              <label for="requirementValue">{{ getRequirementLabel() }} *</label>
              <input
                id="requirementValue"
                v-model.number="badgeFormData.requirements.value"
                type="number"
                :min="getMinValue()"
                required
                class="form-input"
                :placeholder="getRequirementPlaceholder()"
              />
              <small class="form-help">{{ getRequirementDescription() }}</small>
            </div>
            <div class="theme-section">
              <h4>Thème et Récompense</h4>
              <p class="section-description">
                Associez ce badge à un thème existant ou créez un nouveau thème
              </p>
              <div class="form-group">
                <label>Option de thème</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input
                      type="radio"
                      v-model="badgeFormData.theme.createNew"
                      :value="false"
                      name="themeOption"
                    />
                    <span>Utiliser un thème existant</span>
                  </label>
                  <label class="radio-label">
                    <input
                      type="radio"
                      v-model="badgeFormData.theme.createNew"
                      :value="true"
                      name="themeOption"
                    />
                    <span>Créer un nouveau thème</span>
                  </label>
                </div>
              </div>
              <div v-if="!badgeFormData.theme.createNew" class="form-group">
                <label for="existingTheme">Thème existant</label>
                <select
                  id="existingTheme"
                  v-model="badgeFormData.theme.existingThemeId"
                  class="form-input"
                >
                  <option value="">Aucun thème (utiliser le thème par défaut)</option>
                  <option v-for="theme in themes" :key="theme._id" :value="theme._id">
                    {{ theme.name }} - {{ theme.description }}
                  </option>
                </select>
              </div>
              <div v-if="badgeFormData.theme.createNew" class="new-theme-form">
                <div class="form-group">
                  <label for="newThemeName">Nom du thème *</label>
                  <input
                    id="newThemeName"
                    v-model="badgeFormData.theme.newTheme.name"
                    type="text"
                    :required="badgeFormData.theme.createNew"
                    class="form-input"
                    placeholder="Ex: Thème Expert"
                  />
                </div>
                <div class="form-group">
                  <label for="newThemeDescription">Description du thème *</label>
                  <textarea
                    id="newThemeDescription"
                    v-model="badgeFormData.theme.newTheme.description"
                    :required="badgeFormData.theme.createNew"
                    class="form-input form-textarea"
                    placeholder="Description du thème et de ce qu'il représente"
                    rows="2"
                  ></textarea>
                </div>
                <div class="colors-grid">
                  <div class="form-group">
                    <label for="primaryColor">Couleur primaire</label>
                    <input
                      id="primaryColor"
                      v-model="badgeFormData.theme.newTheme.colors.primary"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="secondaryColor">Couleur secondaire</label>
                    <input
                      id="secondaryColor"
                      v-model="badgeFormData.theme.newTheme.colors.secondary"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="accentColor">Couleur d'accent</label>
                    <input
                      id="accentColor"
                      v-model="badgeFormData.theme.newTheme.colors.accent"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="backgroundColor">Arrière-plan</label>
                    <input
                      id="backgroundColor"
                      v-model="badgeFormData.theme.newTheme.colors.background"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="backgroundSoftColor">Arrière-plan doux</label>
                    <input
                      id="backgroundSoftColor"
                      v-model="badgeFormData.theme.newTheme.colors.backgroundSoft"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="textColor">Couleur du texte</label>
                    <input
                      id="textColor"
                      v-model="badgeFormData.theme.newTheme.colors.text"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="textMutedColor">Texte atténué</label>
                    <input
                      id="textMutedColor"
                      v-model="badgeFormData.theme.newTheme.colors.textMuted"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                </div>
                <div class="theme-preview">
                  <h5>Prévisualisation du thème</h5>
                  <div
                    class="preview-card"
                    :style="{
                      '--preview-primary': badgeFormData.theme.newTheme.colors.primary,
                      '--preview-secondary': badgeFormData.theme.newTheme.colors.secondary,
                      '--preview-accent': badgeFormData.theme.newTheme.colors.accent,
                      '--preview-background': badgeFormData.theme.newTheme.colors.background,
                      '--preview-background-soft':
                        badgeFormData.theme.newTheme.colors.backgroundSoft,
                      '--preview-text': badgeFormData.theme.newTheme.colors.text,
                      '--preview-text-muted': badgeFormData.theme.newTheme.colors.textMuted,
                    }"
                  >
                    <div class="preview-header">
                      <h6>{{ badgeFormData.theme.newTheme.name || 'Nom du thème' }}</h6>
                      <p>
                        {{ badgeFormData.theme.newTheme.description || 'Description du thème' }}
                      </p>
                    </div>
                    <div class="preview-content">
                      <div class="preview-button">Bouton Primaire</div>
                      <div class="preview-text-sample">Exemple de texte dans ce thème</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeCreateBadgeModal" class="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" :disabled="createBadgeLoading" class="btn btn-primary">
                {{ createBadgeLoading ? 'Création...' : 'Créer Badge' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div v-if="showEditBadgeModal" class="modal-overlay" @click="closeEditBadgeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Modifier le badge</h3>
          <button @click="closeEditBadgeModal" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateBadge" class="create-form">
            <div class="form-group">
              <label for="editBadgeName">Nom du badge *</label>
              <input
                id="editBadgeName"
                v-model="badgeFormData.name"
                type="text"
                required
                class="form-input"
                placeholder="Entrez le nom du badge"
              />
            </div>
            <div class="form-group">
              <label for="editBadgeDescription">Description *</label>
              <textarea
                id="editBadgeDescription"
                v-model="badgeFormData.description"
                required
                class="form-input form-textarea"
                placeholder="Décrivez ce badge et comment l'obtenir"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="editBadgeIconUrl">URL de l'icône *</label>
              <input
                id="editBadgeIconUrl"
                v-model="badgeFormData.iconUrl"
                type="url"
                required
                class="form-input"
                placeholder="https://example.com/badge-icon.png"
              />
            </div>
            <div class="form-group">
              <label for="editRequirementType">Type d'exigence *</label>
              <select
                id="editRequirementType"
                v-model="badgeFormData.requirements.type"
                required
                class="form-input"
              >
                <option value="participation">Participation à des défis</option>
                <option value="streak">Série de connexions</option>
                <option value="achievement">Accomplissement spécifique</option>
                <option value="time_based">Basé sur le temps</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editRequirementValue">{{ getRequirementLabel() }} *</label>
              <input
                id="editRequirementValue"
                v-model.number="badgeFormData.requirements.value"
                type="number"
                :min="getMinValue()"
                required
                class="form-input"
                :placeholder="getRequirementPlaceholder()"
              />
              <small class="form-help">{{ getRequirementDescription() }}</small>
            </div>
            <div class="theme-section">
              <h4>Thème et Récompense</h4>
              <p class="section-description">
                Associez ce badge à un thème existant ou créez un nouveau thème
              </p>
              <div class="form-group">
                <label>Option de thème</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input
                      type="radio"
                      v-model="badgeFormData.theme.createNew"
                      :value="false"
                      name="editThemeOption"
                    />
                    <span>Utiliser un thème existant</span>
                  </label>
                  <label class="radio-label">
                    <input
                      type="radio"
                      v-model="badgeFormData.theme.createNew"
                      :value="true"
                      name="editThemeOption"
                    />
                    <span>Créer un nouveau thème</span>
                  </label>
                </div>
              </div>
              <div v-if="!badgeFormData.theme.createNew" class="form-group">
                <label for="editExistingTheme">Thème existant</label>
                <select
                  id="editExistingTheme"
                  v-model="badgeFormData.theme.existingThemeId"
                  class="form-input"
                >
                  <option value="">Aucun thème (utiliser le thème par défaut)</option>
                  <option v-for="theme in themes" :key="theme._id" :value="theme._id">
                    {{ theme.name }} - {{ theme.description }}
                  </option>
                </select>
              </div>
              <div v-if="badgeFormData.theme.createNew" class="new-theme-form">
                <div class="form-group">
                  <label for="editNewThemeName">Nom du thème *</label>
                  <input
                    id="editNewThemeName"
                    v-model="badgeFormData.theme.newTheme.name"
                    type="text"
                    :required="badgeFormData.theme.createNew"
                    class="form-input"
                    placeholder="Ex: Thème Expert"
                  />
                </div>
                <div class="form-group">
                  <label for="editNewThemeDescription">Description du thème *</label>
                  <textarea
                    id="editNewThemeDescription"
                    v-model="badgeFormData.theme.newTheme.description"
                    :required="badgeFormData.theme.createNew"
                    class="form-input form-textarea"
                    placeholder="Description du thème et de ce qu'il représente"
                    rows="2"
                  ></textarea>
                </div>
                <div class="colors-grid">
                  <div class="form-group">
                    <label for="editPrimaryColor">Couleur primaire</label>
                    <input
                      id="editPrimaryColor"
                      v-model="badgeFormData.theme.newTheme.colors.primary"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="editSecondaryColor">Couleur secondaire</label>
                    <input
                      id="editSecondaryColor"
                      v-model="badgeFormData.theme.newTheme.colors.secondary"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="editAccentColor">Couleur d'accent</label>
                    <input
                      id="editAccentColor"
                      v-model="badgeFormData.theme.newTheme.colors.accent"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="editBackgroundColor">Arrière-plan</label>
                    <input
                      id="editBackgroundColor"
                      v-model="badgeFormData.theme.newTheme.colors.background"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="editBackgroundSoftColor">Arrière-plan doux</label>
                    <input
                      id="editBackgroundSoftColor"
                      v-model="badgeFormData.theme.newTheme.colors.backgroundSoft"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="editTextColor">Couleur du texte</label>
                    <input
                      id="editTextColor"
                      v-model="badgeFormData.theme.newTheme.colors.text"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="editTextMutedColor">Texte atténué</label>
                    <input
                      id="editTextMutedColor"
                      v-model="badgeFormData.theme.newTheme.colors.textMuted"
                      type="color"
                      class="form-input color-input"
                    />
                  </div>
                </div>
                <div class="theme-preview">
                  <h5>Prévisualisation du thème</h5>
                  <div
                    class="preview-card"
                    :style="{
                      '--preview-primary': badgeFormData.theme.newTheme.colors.primary,
                      '--preview-secondary': badgeFormData.theme.newTheme.colors.secondary,
                      '--preview-accent': badgeFormData.theme.newTheme.colors.accent,
                      '--preview-background': badgeFormData.theme.newTheme.colors.background,
                      '--preview-background-soft':
                        badgeFormData.theme.newTheme.colors.backgroundSoft,
                      '--preview-text': badgeFormData.theme.newTheme.colors.text,
                      '--preview-text-muted': badgeFormData.theme.newTheme.colors.textMuted,
                    }"
                  >
                    <div class="preview-header">
                      <h6>{{ badgeFormData.theme.newTheme.name || 'Nom du thème' }}</h6>
                      <p>
                        {{ badgeFormData.theme.newTheme.description || 'Description du thème' }}
                      </p>
                    </div>
                    <div class="preview-content">
                      <div class="preview-button">Bouton Primaire</div>
                      <div class="preview-text-sample">Exemple de texte dans ce thème</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeEditBadgeModal" class="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" :disabled="updateBadgeLoading" class="btn btn-primary">
                {{ updateBadgeLoading ? 'Mise à jour...' : 'Mettre à jour' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div v-if="showCreateThemeModal" class="modal-overlay" @click="closeCreateThemeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Créer un nouveau thème</h3>
          <button @click="closeCreateThemeModal" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createTheme" class="create-form">
            <div class="form-group">
              <label for="themeName">Nom du thème *</label>
              <input
                id="themeName"
                v-model="themeFormData.name"
                type="text"
                required
                class="form-input"
                placeholder="Ex: Thème Personnalisé"
              />
            </div>

            <div class="form-group">
              <label for="themeDescription">Description *</label>
              <textarea
                id="themeDescription"
                v-model="themeFormData.description"
                required
                class="form-input form-textarea"
                placeholder="Description du thème et de ce qu'il représente"
                rows="3"
              ></textarea>
            </div>

            <div class="colors-grid">
              <div class="form-group">
                <label for="createPrimaryColor">Couleur primaire</label>
                <input
                  id="createPrimaryColor"
                  v-model="themeFormData.colors.primary"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="createSecondaryColor">Couleur secondaire</label>
                <input
                  id="createSecondaryColor"
                  v-model="themeFormData.colors.secondary"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="createAccentColor">Couleur d'accent</label>
                <input
                  id="createAccentColor"
                  v-model="themeFormData.colors.accent"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="createBackgroundColor">Arrière-plan</label>
                <input
                  id="createBackgroundColor"
                  v-model="themeFormData.colors.background"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="createBackgroundSoftColor">Arrière-plan doux</label>
                <input
                  id="createBackgroundSoftColor"
                  v-model="themeFormData.colors.backgroundSoft"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="createTextColor">Couleur du texte</label>
                <input
                  id="createTextColor"
                  v-model="themeFormData.colors.text"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="createTextMutedColor">Texte atténué</label>
                <input
                  id="createTextMutedColor"
                  v-model="themeFormData.colors.textMuted"
                  type="color"
                  class="form-input color-input"
                />
              </div>
            </div>
            <div class="theme-preview">
              <h5>Prévisualisation du thème</h5>
              <div
                class="preview-card"
                :style="{
                  '--preview-primary': themeFormData.colors.primary,
                  '--preview-secondary': themeFormData.colors.secondary,
                  '--preview-accent': themeFormData.colors.accent,
                  '--preview-background': themeFormData.colors.background,
                  '--preview-background-soft': themeFormData.colors.backgroundSoft,
                  '--preview-text': themeFormData.colors.text,
                  '--preview-text-muted': themeFormData.colors.textMuted,
                }"
              >
                <div class="preview-header">
                  <h6>{{ themeFormData.name || 'Nom du thème' }}</h6>
                  <p>{{ themeFormData.description || 'Description du thème' }}</p>
                </div>
                <div class="preview-content">
                  <div class="preview-button">Bouton Primaire</div>
                  <div class="preview-text-sample">Exemple de texte dans ce thème</div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeCreateThemeModal" class="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" :disabled="createThemeLoading" class="btn btn-primary">
                {{ createThemeLoading ? 'Création...' : 'Créer Thème' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div v-if="showEditThemeModal" class="modal-overlay" @click="closeEditThemeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Modifier le thème</h3>
          <button @click="closeEditThemeModal" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateTheme" class="create-form">
            <div class="form-group">
              <label for="editThemeName">Nom du thème *</label>
              <input
                id="editThemeName"
                v-model="themeFormData.name"
                type="text"
                required
                class="form-input"
                placeholder="Ex: Thème Personnalisé"
              />
            </div>

            <div class="form-group">
              <label for="editThemeDescription">Description *</label>
              <textarea
                id="editThemeDescription"
                v-model="themeFormData.description"
                required
                class="form-input form-textarea"
                placeholder="Description du thème et de ce qu'il représente"
                rows="3"
              ></textarea>
            </div>

            <div class="colors-grid">
              <div class="form-group">
                <label for="editPrimaryColorTheme">Couleur primaire</label>
                <input
                  id="editPrimaryColorTheme"
                  v-model="themeFormData.colors.primary"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="editSecondaryColorTheme">Couleur secondaire</label>
                <input
                  id="editSecondaryColorTheme"
                  v-model="themeFormData.colors.secondary"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="editAccentColorTheme">Couleur d'accent</label>
                <input
                  id="editAccentColorTheme"
                  v-model="themeFormData.colors.accent"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="editBackgroundColorTheme">Arrière-plan</label>
                <input
                  id="editBackgroundColorTheme"
                  v-model="themeFormData.colors.background"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="editBackgroundSoftColorTheme">Arrière-plan doux</label>
                <input
                  id="editBackgroundSoftColorTheme"
                  v-model="themeFormData.colors.backgroundSoft"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="editTextColorTheme">Couleur du texte</label>
                <input
                  id="editTextColorTheme"
                  v-model="themeFormData.colors.text"
                  type="color"
                  class="form-input color-input"
                />
              </div>

              <div class="form-group">
                <label for="editTextMutedColorTheme">Texte atténué</label>
                <input
                  id="editTextMutedColorTheme"
                  v-model="themeFormData.colors.textMuted"
                  type="color"
                  class="form-input color-input"
                />
              </div>
            </div>
            <div class="theme-preview">
              <h5>Prévisualisation du thème</h5>
              <div
                class="preview-card"
                :style="{
                  '--preview-primary': themeFormData.colors.primary,
                  '--preview-secondary': themeFormData.colors.secondary,
                  '--preview-accent': themeFormData.colors.accent,
                  '--preview-background': themeFormData.colors.background,
                  '--preview-background-soft': themeFormData.colors.backgroundSoft,
                  '--preview-text': themeFormData.colors.text,
                  '--preview-text-muted': themeFormData.colors.textMuted,
                }"
              >
                <div class="preview-header">
                  <h6>{{ themeFormData.name || 'Nom du thème' }}</h6>
                  <p>{{ themeFormData.description || 'Description du thème' }}</p>
                </div>
                <div class="preview-content">
                  <div class="preview-button">Bouton Primaire</div>
                  <div class="preview-text-sample">Exemple de texte dans ce thème</div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeEditThemeModal" class="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" :disabled="updateThemeLoading" class="btn btn-primary">
                {{ updateThemeLoading ? 'Mise à jour...' : 'Mettre à jour' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 24px 0;
  border-bottom: 1px solid var(--color-border);
}

.header-content h1 {
  font-size: 2.5rem;
  margin-bottom: 8px;
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  color: var(--color-text-muted);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 16px;
  border-radius: var(--border-radius);
  margin-bottom: 20px;
  text-align: center;
}

.tabs-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--color-border);
}

.tab-button {
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-button:hover {
  color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--color-primary);
}

.stat-content p {
  color: var(--color-text-muted);
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 1.5rem;
  color: var(--color-text);
}

.count {
  color: var(--color-text-muted);
  font-size: 14px;
}

.items-grid {
  display: grid;
  gap: 20px;
}

.item-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.item-card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.item-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
  text-transform: uppercase;
}

.gym-avatar {
  background: var(--color-secondary);
  font-size: 1.5rem;
}

.room-avatar {
  background: var(--color-accent);
  font-size: 1.5rem;
}

.badge-avatar {
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  font-size: 1.5rem;
}

.badge-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.item-details h3 {
  margin: 0 0 4px 0;
  color: var(--color-text);
}

.item-details p {
  margin: 0 0 4px 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.requirements {
  font-style: italic;
  color: var(--color-text-muted);
}

.item-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.role,
.status,
.manager {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.role.super_admin {
  background: rgba(139, 92, 246, 0.2);
  color: var(--color-secondary);
}

.role.gym_owner {
  background: rgba(6, 182, 212, 0.2);
  color: var(--color-accent);
}

.role.client {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.role.admin {
  background: rgba(6, 182, 212, 0.2);
  color: var(--color-accent);
}

.role.user {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.status.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status:not(.active) {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.manager {
  background: rgba(99, 102, 241, 0.2);
  color: var(--color-primary);
}

.item-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-info {
  background: var(--color-accent);
  color: white;
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
}

.modal-body {
  padding: 20px;
}

.detail-grid {
  display: grid;
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: var(--color-text);
}

.detail-item span {
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .tabs-navigation {
    flex-wrap: wrap;
    gap: 4px;
  }

  .tab-button {
    padding: 8px 16px;
    font-size: 14px;
  }

  .item-card {
    flex-direction: column;
    gap: 16px;
  }

  .item-actions {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Styles pour le classement */
.leaderboard-content {
  padding: 0;
}

.leaderboard-grid {
  display: grid;
  gap: 16px;
}

.leaderboard-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

.leaderboard-card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rank-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 2px solid var(--color-border);
}

.rank-number.gold {
  background: linear-gradient(45deg, #ffd700, #ffed4a);
  color: #8b5a00;
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.rank-number.silver {
  background: linear-gradient(45deg, #c0c0c0, #e2e8f0);
  color: #4a5568;
  border-color: #c0c0c0;
  box-shadow: 0 0 20px rgba(192, 192, 192, 0.3);
}

.rank-number.bronze {
  background: linear-gradient(45deg, #cd7f32, #d69e2e);
  color: #744210;
  border-color: #cd7f32;
  box-shadow: 0 0 20px rgba(205, 127, 50, 0.3);
}

.rank-icon {
  font-size: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.user-details {
  min-width: 0;
  flex: 1;
}

.user-details h3 {
  margin: 0 0 4px 0;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 600;
}

.user-details p {
  margin: 0 0 2px 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.badge-count {
  color: var(--color-primary) !important;
  font-weight: 600 !important;
  font-size: 16px !important;
}

.user-badges {
  flex-shrink: 0;
}

.badges-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.badge-mini-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.badge-mini.more-badges {
  background: var(--color-accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .leaderboard-card {
    grid-template-columns: 1fr;
    gap: 16px;
    text-align: center;
  }

  .rank {
    justify-self: center;
  }

  .user-info {
    justify-content: center;
  }

  .user-badges {
    justify-self: center;
  }
}

/* Styles pour les formulaires */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-help {
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
}

/* Styles pour la section thème */
.theme-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 24px;
  margin-top: 24px;
}

.theme-section h4 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 600;
}

.section-description {
  color: var(--color-text-muted);
  font-size: 14px;
  margin: 0 0 20px 0;
}

.radio-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text);
}

.radio-label input[type='radio'] {
  margin: 0;
  cursor: pointer;
}

.new-theme-form {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 20px;
  margin-top: 16px;
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.color-input {
  height: 50px !important;
  padding: 4px !important;
  cursor: pointer;
}

.theme-preview {
  margin-top: 24px;
  padding: 20px 0;
  border-top: 1px solid var(--color-border);
}

.theme-preview h5 {
  margin: 0 0 16px 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.preview-card {
  background: var(--preview-background);
  border: 1px solid var(--preview-text-muted);
  border-radius: var(--border-radius);
  padding: 20px;
  max-width: 300px;
}

.preview-header h6 {
  margin: 0 0 8px 0;
  color: var(--preview-text);
  font-size: 1.1rem;
  font-weight: 600;
}

.preview-header p {
  margin: 0 0 16px 0;
  color: var(--preview-text-muted);
  font-size: 14px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-button {
  background: var(--preview-primary);
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.preview-text-sample {
  color: var(--preview-text);
  font-size: 14px;
  padding: 8px;
  background: var(--preview-background-soft);
  border-radius: 4px;
}

/* Styles pour les cartes de prévisualisation des thèmes */
.theme-preview-card {
  width: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.theme-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: var(--theme-primary);
}

.theme-header {
  padding: 16px;
  text-align: center;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  position: relative;
}

.theme-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.theme-subtitle {
  font-size: 11px;
  opacity: 0.9;
}

.theme-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
}

.theme-element {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  border: none;
  transition: all 0.2s ease;
}

.theme-element:hover {
  transform: scale(1.02);
}

.theme-text {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  margin: 4px 0;
}

.theme-text-muted {
  font-size: 10px;
  text-align: center;
  opacity: 0.8;
}

.theme-colors {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.color-dot:hover {
  transform: scale(1.2);
  border-color: rgba(255, 255, 255, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-dot::after {
  content: attr(title);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.color-dot:hover::after {
  opacity: 1;
}

/* Ajustements pour les thèmes sombres vs clairs */
.theme-card {
  position: relative;
}

.theme-card .item-details {
  margin-left: 16px;
}

/* Styles pour les échantillons de couleur dans le modal de détails */
.theme-colors-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-sample {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

/* Styles pour les informations de thème dans les badges */
.badge-theme-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-background-mute);
  border-radius: 6px;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.theme-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.theme-label.no-theme {
  color: var(--color-text-muted);
  font-style: italic;
}

.theme-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.theme-preview {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.theme-preview:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Styles pour le profil admin */
.profile-content {
  padding: 0;
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 2rem;
  text-transform: uppercase;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.profile-info h3 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-username {
  color: var(--color-text-muted);
  font-size: 1rem;
  margin: 0 0 4px 0;
  font-weight: 500;
}

.profile-role {
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  margin: 0;
}

.profile-details {
  display: grid;
  gap: 20px;
}

.detail-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.detail-card h4 {
  margin: 0 0 16px 0;
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-primary);
}

.loading-message {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 1.1rem;
  padding: 40px 20px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

@media (max-width: 768px) {
  .colors-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .radio-group {
    flex-direction: column;
    gap: 12px;
  }

  .preview-card {
    max-width: 100%;
  }

  .theme-preview-card {
    width: 180px;
  }

  .theme-header {
    padding: 12px;
  }

  .theme-content {
    padding: 10px;
    min-height: 100px;
  }

  .badge-theme-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .profile-avatar {
    width: 70px;
    height: 70px;
    font-size: 1.8rem;
  }

  .profile-info h3 {
    font-size: 1.3rem;
  }
}
</style>
