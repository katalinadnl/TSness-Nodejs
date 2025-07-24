<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

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

interface Badge {
  _id: string
  name: string
  description: string
  iconUrl: string
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

interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  gymId?: string
  createdAt: string
}

const router = useRouter()
const { currentTheme, themeInfo, themeDisplayName, themeDescription, isDarkTheme } = useTheme()

const activeTab = ref('dashboard')
const loading = ref(false)
const error = ref('')
const currentUser = ref<User | null>(null)

const myGym = ref<Gym | null>(null)
const availableTrainingRooms = ref<TrainingRoom[]>([])
const allBadges = ref<Badge[]>([])
const myBadges = ref<UserBadge[]>([])
const leaderboard = ref<LeaderboardEntry[]>([])

const showModal = ref(false)
const modalType = ref('')
const selectedItem = ref<any>(null)

const checkAuth = () => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  if (!token || !user) {
    router.push('/login')
    return false
  }

  const userData = JSON.parse(user)
  if (!['client', 'superAdmin', 'owner'].includes(userData.role)) {
    router.push('/')
    return false
  }

  currentUser.value = userData
  return true
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

const fetchMyGym = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gyms`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success && data.length > 0) {
      myGym.value = data[0]
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement de votre salle de sport'
  }
}

const fetchAvailableTrainingRooms = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/training-rooms`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success) {
      availableTrainingRooms.value = data.data.filter((room: TrainingRoom) => room.isApproved)
    }
  } catch (err) {
    error.value = "Erreur lors du chargement des salles d'entraînement"
  }
}

const fetchAllBadges = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success) {
      allBadges.value = data.data
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des badges'
  }
}

const fetchMyBadges = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges/user/my-badges`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.success) {
      myBadges.value = data.data
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement de vos badges'
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

const getBadgeStatus = (badge: Badge) => {
  return myBadges.value.some((mb) => mb.badge?._id === badge._id) ? 'earned' : 'available'
}

const getEarnedBadgesCount = () => {
  return myBadges.value.length
}

const getAvailableBadgesCount = () => {
  return allBadges.value.length - myBadges.value.length
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

const profile = ref<any>(null)
const editingProfile = ref(false)
const savingProfile = ref(false)
const changingPassword = ref(false)
const changingPasswordState = ref(false)

const editForm = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const formErrors = ref<any>({})
const passwordErrors = ref<any>({})

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Date non disponible'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Date non disponible'

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getMembershipDays = () => {
  if (!profile.value?.user.createdAt) return 0
  const creationDate = new Date(profile.value.user.createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - creationDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const getPasswordAge = () => {
  const days = getMembershipDays()
  if (days < 30) return `${days} jour(s)`
  if (days < 365) return `${Math.floor(days / 30)} mois`
  return `${Math.floor(days / 365)} an(s)`
}

const getThemeDisplayName = (themeKey: string) => {
  const themeNames: Record<string, string> = {
    default: 'Standard',
    debutant: 'Débutant',
    intermediaire: 'Intermédiaire',
    avance: 'Avancé',
    champion: 'Champion',
  }
  return themeNames[themeKey] || themeKey
}

const fetchProfile = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (response.ok) {
      profile.value = data
    } else {
      error.value = data.message || 'Error loading profile'
    }
  } catch (err) {
    error.value = 'Error loading profile'
  }
}

const startEditingProfile = () => {
  if (!profile.value) return

  editForm.value = {
    firstName: profile.value.user.firstName,
    lastName: profile.value.user.lastName,
    username: profile.value.user.username,
    email: profile.value.user.email,
  }
  formErrors.value = {}
  editingProfile.value = true
}

const cancelEdit = () => {
  editingProfile.value = false
  editForm.value = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  }
  formErrors.value = {}
}

const validateForm = () => {
  const errors: any = {}

  if (!editForm.value.firstName.trim()) {
    errors.firstName = 'Le prénom est requis'
  }

  if (!editForm.value.lastName.trim()) {
    errors.lastName = 'Le nom est requis'
  }

  if (!editForm.value.username.trim()) {
    errors.username = "Le nom d'utilisateur est requis"
  } else if (editForm.value.username.length < 3) {
    errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères"
  }

  if (!editForm.value.email.trim()) {
    errors.email = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.value.email)) {
    errors.email = "Format d'email invalide"
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const saveProfile = async () => {
  if (!validateForm()) return

  savingProfile.value = true

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(editForm.value),
    })

    const data = await response.json()

    if (response.ok) {
      profile.value.user = data.user

      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      Object.assign(userData, data.user)
      localStorage.setItem('user', JSON.stringify(userData))
      currentUser.value = userData

      editingProfile.value = false
      formErrors.value = {}

      alert('Profil mis à jour avec succès!')
    } else {
      formErrors.value = { general: data.message || 'Erreur lors de la sauvegarde' }
    }
  } catch (err) {
    formErrors.value = { general: 'Erreur lors de la sauvegarde' }
  } finally {
    savingProfile.value = false
  }
}

const startChangingPassword = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  passwordErrors.value = {}
  changingPassword.value = true
}

const cancelPasswordChange = () => {
  changingPassword.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  passwordErrors.value = {}
}

const validatePasswordForm = () => {
  const errors: any = {}

  if (!passwordForm.value.currentPassword) {
    errors.currentPassword = 'Le mot de passe actuel est requis'
  }

  if (!passwordForm.value.newPassword) {
    errors.newPassword = 'Le nouveau mot de passe est requis'
  } else if (passwordForm.value.newPassword.length < 6) {
    errors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères'
  }

  if (!passwordForm.value.confirmPassword) {
    errors.confirmPassword = 'La confirmation est requise'
  } else if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas'
  }

  passwordErrors.value = errors
  return Object.keys(errors).length === 0
}

const changePassword = async () => {
  if (!validatePasswordForm()) return

  changingPasswordState.value = true

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile/password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordForm.value),
    })

    const data = await response.json()

    if (response.ok) {
      changingPassword.value = false
      passwordErrors.value = {}
      alert('Mot de passe changé avec succès!')
    } else {
      passwordErrors.value = {
        general: data.message || 'Erreur lors du changement de mot de passe',
      }
    }
  } catch (err) {
    passwordErrors.value = { general: 'Erreur lors du changement de mot de passe' }
  } finally {
    changingPasswordState.value = false
  }
}

onMounted(async () => {
  if (checkAuth()) {
    await fetchMyGym()
    await fetchAvailableTrainingRooms()
    await fetchAllBadges()
    await fetchMyBadges()
    await fetchLeaderboard()
    await fetchProfile() // Charger le profil
  }
})
</script>

<template>
  <div class="client-container">
    <div class="client-header">
      <div class="header-content">
        <h1>Mon Espace Client</h1>
        <p v-if="currentUser">Bienvenue {{ currentUser.firstName }} {{ currentUser.lastName }}</p>
        <p v-if="myGym" class="gym-name">Membre de {{ myGym.name }}</p>
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
        @click="activeTab = 'gym'"
        :class="{ active: activeTab === 'gym' }"
        class="tab-button"
      >
        🏋️ Ma Salle de Sport
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
        🏆 Mes Badges
      </button>
      <button
        @click="activeTab = 'leaderboard'"
        :class="{ active: activeTab === 'leaderboard' }"
        class="tab-button"
      >
        🥇 Classement
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
            <div class="stat-icon">🏋️</div>
            <div class="stat-content">
              <h3>{{ myGym ? '1' : '0' }}</h3>
              <p>Salle de Sport</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🏃</div>
            <div class="stat-content">
              <h3>{{ availableTrainingRooms.length }}</h3>
              <p>Salles Disponibles</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <h3>{{ getEarnedBadgesCount() }}</h3>
              <p>Badges Obtenus</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <h3>{{ getAvailableBadgesCount() }}</h3>
              <p>Badges À Obtenir</p>
            </div>
          </div>
        </div>

        <div v-if="myGym" class="gym-overview">
          <h2>Ma salle de sport</h2>
          <div class="gym-card">
            <div class="gym-info">
              <h3>{{ myGym.name }}</h3>
              <p>{{ myGym.description }}</p>
              <p>📍 {{ myGym.address }}</p>
              <p>📞 {{ myGym.contactPhone }}</p>
              <div class="activities-preview">
                <h4>Activités disponibles :</h4>
                <div class="activities-list">
                  <span
                    v-for="activity in myGym.activities.slice(0, 3)"
                    :key="activity"
                    class="activity-tag"
                  >
                    {{ activity }}
                  </span>
                  <span v-if="myGym.activities.length > 3" class="activity-tag more">
                    +{{ myGym.activities.length - 3 }} autres
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'gym' && myGym" class="gym-content">
        <div class="section-header">
          <h2>Ma Salle de Sport</h2>
        </div>
        <div class="gym-details">
          <div class="detail-card">
            <h3>Informations générales</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <strong>Nom:</strong>
                <span>{{ myGym.name }}</span>
              </div>
              <div class="detail-item">
                <strong>Description:</strong>
                <span>{{ myGym.description }}</span>
              </div>
              <div class="detail-item">
                <strong>Adresse:</strong>
                <span>{{ myGym.address }}</span>
              </div>
              <div class="detail-item">
                <strong>Téléphone:</strong>
                <span>{{ myGym.contactPhone }}</span>
              </div>
              <div class="detail-item">
                <strong>Email:</strong>
                <span>{{ myGym.contactEmail }}</span>
              </div>
            </div>
          </div>

          <div class="detail-card">
            <h3>Équipements disponibles</h3>
            <div class="equipment-list">
              <span v-for="equipment in myGym.equipment" :key="equipment" class="equipment-tag">
                {{ equipment }}
              </span>
            </div>
          </div>

          <div class="detail-card">
            <h3>Activités proposées</h3>
            <div class="activities-list">
              <span v-for="activity in myGym.activities" :key="activity" class="activity-tag">
                {{ activity }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'rooms'" class="rooms-content">
        <div class="section-header">
          <h2>Salles d'Entraînement Disponibles</h2>
          <span class="count">{{ availableTrainingRooms.length }} salle(s) active(s)</span>
        </div>
        <div class="items-grid">
          <div v-for="room in availableTrainingRooms" :key="room._id" class="item-card">
            <div class="item-info">
              <div class="item-avatar room-avatar">🏃</div>
              <div class="item-details">
                <h3>{{ room.name }}</h3>
                <p>👥 Capacité: {{ room.capacity }} personnes</p>
                <p>🏋️ {{ room.equipment?.join(', ') || 'Aucun équipement' }}</p>
                <p>🎯 Niveau: {{ room.difficultyLevel }}</p>
                <div class="item-meta">
                  <span class="status active">Disponible</span>
                  <span class="difficulty" :class="room.difficultyLevel.toLowerCase()">
                    {{ room.difficultyLevel }}
                  </span>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <button @click="viewDetails(room, 'room')" class="btn btn-info">Voir</button>
              <button class="btn btn-primary">Réserver</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'badges'" class="badges-content">
        <div class="section-header">
          <h2>Mes Badges</h2>
          <span class="count"
            >{{ getEarnedBadgesCount() }}/{{ allBadges.length }} badge(s) obtenus</span
          >
        </div>

        <div class="badges-section">
          <h3>Badges Obtenus</h3>
          <div class="items-grid">
            <div
              v-for="userBadge in myBadges"
              :key="userBadge.badgeId"
              class="item-card earned-badge"
            >
              <div class="item-info">
                <div class="item-avatar badge-avatar earned">
                  <img
                    :src="
                      userBadge.badge?.iconUrl ||
                      'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/badge.png'
                    "
                    :alt="userBadge.badge?.name || 'Badge'"
                    class="badge-icon"
                  />
                </div>
                <div class="item-details">
                  <h3>{{ userBadge.badge?.name || 'Badge inconnu' }}</h3>
                  <p>{{ userBadge.badge?.description || 'Description non disponible' }}</p>
                  <p class="earned-date">Obtenu le {{ formatDate(userBadge.earnedAt) }}</p>
                </div>
              </div>
              <div class="item-actions">
                <button
                  @click="viewDetails(userBadge.badge, 'badge')"
                  class="btn btn-info"
                  v-if="userBadge.badge"
                >
                  Voir
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="badges-section">
          <h3>Badges À Obtenir</h3>
          <div class="items-grid">
            <div
              v-for="badge in allBadges.filter((b) => getBadgeStatus(b) === 'available')"
              :key="badge._id"
              class="item-card available-badge"
            >
              <div class="item-info">
                <div class="item-avatar badge-avatar available">
                  <img
                    :src="
                      badge.iconUrl ||
                      'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/badge.png'
                    "
                    :alt="badge.name"
                    class="badge-icon"
                  />
                </div>
                <div class="item-details">
                  <h3>{{ badge.name }}</h3>
                  <p>{{ badge.description }}</p>
                  <p class="challenge-hint">Continuez vos efforts pour débloquer ce badge!</p>
                </div>
              </div>
              <div class="item-actions">
                <button @click="viewDetails(badge, 'badge')" class="btn btn-info">Voir</button>
              </div>
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
          <div
            v-for="(entry, index) in leaderboard"
            :key="entry.user._id"
            class="leaderboard-card"
            :class="{ 'current-user': currentUser && entry.user._id === currentUser._id }"
          >
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

        <div class="profile-details">
          <div class="detail-card">
            <div class="card-header">
              <h3>👤 Informations personnelles</h3>
            </div>

            <div v-if="!editingProfile" class="detail-grid">
              <div class="detail-item">
                <strong>Nom:</strong>
                <span>{{ profile?.user.firstName }} {{ profile?.user.lastName }}</span>
              </div>
              <div class="detail-item">
                <strong>Nom d'utilisateur:</strong>
                <span>@{{ profile?.user.username }}</span>
              </div>
              <div class="detail-item">
                <strong>Email:</strong>
                <span>{{ profile?.user.email }}</span>
              </div>
              <div class="detail-item">
                <strong>Score:</strong>
                <span>{{ profile?.user.score || 0 }} points</span>
              </div>
              <div class="detail-item">
                <strong>Membre depuis:</strong>
                <span>{{ formatDate(profile?.user.createdAt) }}</span>
              </div>
            </div>
            <div v-else class="profile-edit-form">
              <div class="form-group">
                <label>Prénom</label>
                <input
                  v-model="editForm.firstName"
                  type="text"
                  class="form-input"
                  :class="{ error: formErrors.firstName }"
                />
                <span v-if="formErrors.firstName" class="error-text">{{
                  formErrors.firstName
                }}</span>
              </div>

              <div class="form-group">
                <label>Nom</label>
                <input
                  v-model="editForm.lastName"
                  type="text"
                  class="form-input"
                  :class="{ error: formErrors.lastName }"
                />
                <span v-if="formErrors.lastName" class="error-text">{{ formErrors.lastName }}</span>
              </div>

              <div class="form-group">
                <label>Nom d'utilisateur</label>
                <input
                  v-model="editForm.username"
                  type="text"
                  class="form-input"
                  :class="{ error: formErrors.username }"
                />
                <span v-if="formErrors.username" class="error-text">{{ formErrors.username }}</span>
              </div>

              <div class="form-group">
                <label>Email</label>
                <input
                  v-model="editForm.email"
                  type="email"
                  class="form-input"
                  :class="{ error: formErrors.email }"
                />
                <span v-if="formErrors.email" class="error-text">{{ formErrors.email }}</span>
              </div>

              <div class="form-actions">
                <button @click="saveProfile" class="save-btn" :disabled="savingProfile">
                  {{ savingProfile ? 'Sauvegarde...' : '💾 Sauvegarder' }}
                </button>
                <button @click="cancelEdit" class="cancel-btn">❌ Annuler</button>
              </div>
            </div>
          </div>
          <!-- Thème actuel -->
          <div class="detail-card theme-card">
            <h3>🎨 Thème d'Interface Actuel</h3>
            <div v-if="profile?.theme" class="theme-info">
              <div class="theme-preview">
                <div class="theme-colors">
                  <div
                    class="color-swatch primary"
                    :style="{ backgroundColor: profile.theme.colors.primary }"
                  ></div>
                  <div
                    class="color-swatch secondary"
                    :style="{ backgroundColor: profile.theme.colors.secondary }"
                  ></div>
                  <div
                    class="color-swatch accent"
                    :style="{ backgroundColor: profile.theme.colors.accent }"
                  ></div>
                </div>
                <div class="theme-details">
                  <h4>{{ profile.theme.name }}</h4>
                  <p>{{ profile.theme.description }}</p>
                  <div class="theme-badge" :class="`theme-${profile.theme.theme}`">
                    <span class="theme-level">{{ getThemeDisplayName(profile.theme.theme) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-theme">
              <p>Aucun thème personnalisé actif</p>
            </div>
          </div>

          <!-- Mes badges récents -->
          <div v-if="profile?.badges && profile.badges.length > 0" class="detail-card">
            <h3>🏆 Mes Badges Récents</h3>
            <div class="recent-badges">
              <div
                v-for="userBadge in profile.badges.slice(0, 5)"
                :key="userBadge._id"
                class="badge-item"
              >
                <div class="badge-icon">🏅</div>
                <div class="badge-info">
                  <strong>{{ userBadge.badgeId?.name || 'Badge' }}</strong>
                  <span>Obtenu le {{ formatDate(userBadge.earnedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            {{ modalType === 'room' ? "Détails Salle d'Entraînement" : 'Détails Badge' }}
          </h3>
          <button @click="showModal = false" class="modal-close">&times;</button>
        </div>
        <div v-if="selectedItem" class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <strong>Nom:</strong>
              <span>{{ selectedItem.name }}</span>
            </div>
            <template v-if="modalType === 'room'">
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
            </template>
            <template v-if="modalType === 'badge'">
              <div class="detail-item">
                <strong>Description:</strong>
                <span>{{ selectedItem.description }}</span>
              </div>
              <div class="detail-item">
                <strong>Icône:</strong>
                <img
                  :src="selectedItem.iconUrl"
                  :alt="selectedItem.name"
                  class="modal-badge-icon"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.client-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.client-header {
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
  margin: 4px 0;
}

.gym-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-primary) !important;
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

.gym-overview {
  margin-top: 40px;
}

.gym-overview h2 {
  margin-bottom: 20px;
  color: var(--color-text);
}

.gym-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 24px;
}

.gym-info h3 {
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.gym-info p {
  margin: 4px 0;
  color: var(--color-text-muted);
}

.activities-preview {
  margin-top: 16px;
}

.activities-preview h4 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 14px;
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

.gym-details {
  display: grid;
  gap: 20px;
}

.detail-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 24px;
}

.detail-card h3 {
  margin: 0 0 16px 0;
  color: var(--color-text);
}

.detail-grid {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
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

.equipment-list,
.activities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.equipment-tag,
.activity-tag {
  background: var(--color-primary);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.activity-tag {
  background: var(--color-secondary);
}

.activity-tag.more {
  background: var(--color-accent);
}

.badges-section {
  margin-bottom: 40px;
}

.badges-section h3 {
  margin-bottom: 20px;
  color: var(--color-text);
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

.earned-badge {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.05);
}

.available-badge {
  opacity: 0.7;
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
}

.room-avatar {
  background: var(--color-accent);
  font-size: 1.5rem;
}

.badge-avatar {
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  font-size: 1.5rem;
}

.badge-avatar.earned {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}

.badge-avatar.available {
  opacity: 0.5;
  filter: grayscale(1);
}

.badge-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.modal-badge-icon {
  width: 40px;
  height: 40px;
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

.earned-date {
  color: var(--color-primary) !important;
  font-weight: 600;
}

.challenge-hint {
  color: var(--color-secondary) !important;
  font-style: italic;
}

.item-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status,
.difficulty {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.difficulty.beginner {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.difficulty.intermediate {
  background: rgba(251, 191, 36, 0.2);
  color: #f59e0b;
}

.difficulty.advanced {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
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

@media (max-width: 768px) {
  .client-header {
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

.leaderboard-card.current-user {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.05);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
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

/* Styles pour le profil */
.profile-content {
  padding: 0;
}

.profile-details {
  display: grid;
  gap: 24px;
}

.theme-card {
  background: linear-gradient(
    135deg,
    var(--color-background-soft) 0%,
    rgba(var(--color-primary-rgb, 99, 102, 241), 0.05) 100%
  );
  border-color: rgba(var(--color-primary-rgb, 99, 102, 241), 0.2);
}

.theme-info {
  display: grid;
  gap: 24px;
}

.theme-preview {
  display: flex;
  align-items: center;
  gap: 20px;
}

.theme-colors {
  display: flex;
  gap: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-details h4 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 600;
}

.theme-details p {
  margin: 0 0 12px 0;
  color: var(--color-text-muted);
}

.theme-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.theme-badge.theme-default {
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
}

.theme-badge.theme-debutant {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.theme-badge.theme-intermediaire {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.theme-badge.theme-avance {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

.theme-badge.theme-champion {
  background: linear-gradient(45deg, rgba(234, 179, 8, 0.2), rgba(251, 191, 36, 0.2));
  color: #eab308;
}

.theme-progression h4 {
  margin: 0 0 16px 0;
  color: var(--color-text);
  font-weight: 600;
}

.progression-levels {
  display: grid;
  gap: 12px;
}

.progression-level {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: var(--border-radius);
  background: var(--color-background-mute);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.progression-level.achieved {
  opacity: 1;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb, 99, 102, 241), 0.05);
}

.level-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.level-info {
  flex: 1;
}

.level-info strong {
  display: block;
  color: var(--color-text);
  font-size: 14px;
  margin-bottom: 2px;
}

.level-info span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.progression-tip {
  margin-top: 16px;
  padding: 16px;
  background: rgba(var(--color-primary-rgb, 99, 102, 241), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb, 99, 102, 241), 0.2);
  border-radius: var(--border-radius);
}

.progression-tip p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
}

.stats-card {
  background: linear-gradient(
    135deg,
    var(--color-background-soft) 0%,
    rgba(var(--color-accent-rgb, 6, 182, 212), 0.05) 100%
  );
  border-color: rgba(var(--color-accent-rgb, 6, 182, 212), 0.2);
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: var(--color-background-mute);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

/* Styles pour les formulaires de profil */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.profile-edit-form,
.password-form {
  display: grid;
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
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.save-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: var(--color-border);
}

.security-info {
  color: var(--color-text-muted);
}

.security-info p {
  margin: 8px 0;
  font-size: 14px;
}

.security-tip {
  background: rgba(var(--color-accent-rgb, 6, 182, 212), 0.1);
  border: 1px solid rgba(var(--color-accent-rgb, 6, 182, 212), 0.2);
  border-radius: var(--border-radius);
  padding: 12px;
  margin-top: 12px;
}

.no-theme {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.recent-badges {
  display: grid;
  gap: 12px;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-background-mute);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.badge-item:hover {
  transform: translateY(-1px);
  border-color: var(--color-primary);
}

.badge-item .badge-icon {
  font-size: 1.2rem;
  opacity: 0.8;
}

.badge-info {
  flex: 1;
}

.badge-info strong {
  display: block;
  color: var(--color-text);
  font-size: 14px;
  margin-bottom: 2px;
}

.badge-info span {
  color: var(--color-text-muted);
  font-size: 12px;
}

@media (max-width: 768px) {
  .theme-preview {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .user-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-actions {
    flex-direction: column;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .edit-btn {
    align-self: flex-start;
  }
}
</style>
