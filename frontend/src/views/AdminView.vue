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

const router = useRouter()

const activeTab = ref('dashboard')
const loading = ref(false)
const error = ref('')

const users = ref<User[]>([])
const gyms = ref<Gym[]>([])
const trainingRooms = ref<TrainingRoom[]>([])
const badges = ref<Badge[]>([])
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
  if (userData.role !== 'super_admin') {
    router.push('/')
    return false
  }

  return true
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

const fetchUsers = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users`, {
      headers: getAuthHeaders()
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
      headers: getAuthHeaders()
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
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (data.success) {
      trainingRooms.value = data.data
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des salles d\'entraînement'
  }
}

const fetchBadges = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges`, {
      headers: getAuthHeaders()
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
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (data.success) {
      leaderboard.value = data.data
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement du classement'
  }
}

const toggleUserStatus = async (userId: string, isActive: boolean) => {
  if (!checkAuth()) return

  try {
    const endpoint = isActive ? 'deactivate' : 'activate'
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    })

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getManagerName = (managerId: string) => {
  const manager = users.value.find(u => u._id === managerId)
  return manager ? `${manager.firstName} ${manager.lastName}` : 'Non assigné'
}

const getGymName = (gymId: string) => {
  const gym = gyms.value.find(g => g._id === gymId)
  return gym ? gym.name : 'Salle inconnue'
}

onMounted(() => {
  if (checkAuth()) {
    fetchUsers()
    fetchGyms()
    fetchTrainingRooms()
    fetchBadges()
    fetchLeaderboard()
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
        <button @click="logout" class="btn btn-secondary">
          Déconnexion
        </button>
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
              <button @click="viewDetails(user, 'user')" class="btn btn-info">
                Voir
              </button>
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
              <div class="item-avatar gym-avatar">
                🏋️
              </div>
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
              <button @click="viewDetails(gym, 'gym')" class="btn btn-info">
                Voir
              </button>
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
              <div class="item-avatar room-avatar">
                🏃
              </div>
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
              <button @click="viewDetails(room, 'room')" class="btn btn-info">
                Voir
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'badges'" class="badges-content">
        <div class="section-header">
          <h2>Badges et Récompenses</h2>
          <span class="count">{{ badges.length }} badge(s)</span>
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
              </div>
            </div>
            <div class="item-actions">
              <button @click="viewDetails(badge, 'badge')" class="btn btn-info">
                Voir
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
              <div class="rank-number" :class="{
                'gold': index === 0,
                'silver': index === 1,
                'bronze': index === 2
              }">
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
                  <img :src="userBadge.badge?.iconUrl || 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/badge.png'" 
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
    </div>
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            {{ modalType === 'user' ? 'Détails Utilisateur' :
               modalType === 'gym' ? 'Détails Salle de Sport' :
               modalType === 'room' ? 'Détails Salle d\'Entraînement' :
               'Détails Badge' }}
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
                <span>{{ selectedItem.isApproved ? 'Approuvé' : 'En attente d\'approbation' }}</span>
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
                <span>{{ selectedItem.isApproved ? 'Approuvé' : 'En attente d\'approbation' }}</span>
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
            <div class="detail-item">
              <strong>Créé le:</strong>
              <span>{{ formatDate(selectedItem.createdAt) }}</span>
            </div>
          </div>
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
</style>
