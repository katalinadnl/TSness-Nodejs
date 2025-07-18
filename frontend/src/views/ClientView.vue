<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

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
  icon: string
  isActive: boolean
  createdAt: string
}

interface UserBadge {
  badgeId: string
  earnedAt: string
  badge: Badge
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

const activeTab = ref('dashboard')
const loading = ref(false)
const error = ref('')
const currentUser = ref<User | null>(null)

const myGym = ref<Gym | null>(null)
const availableTrainingRooms = ref<TrainingRoom[]>([])
const allBadges = ref<Badge[]>([])
const myBadges = ref<UserBadge[]>([])

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
  if (userData.role !== 'client') {
    router.push('/')
    return false
  }

  currentUser.value = userData
  return true
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

const fetchMyGym = async () => {
  if (!checkAuth()) return

  try {
    // Pour simuler, on prend le premier gym disponible
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gyms`, {
      headers: getAuthHeaders()
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
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (data.success) {
      // Filtrer uniquement les salles approuvées
      availableTrainingRooms.value = data.data.filter((room: TrainingRoom) => room.isApproved)
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des salles d\'entraînement'
  }
}

const fetchAllBadges = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges`, {
      headers: getAuthHeaders()
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
    // Pour simuler, on dit que l'utilisateur a obtenu le premier badge
    myBadges.value = allBadges.value.length > 0 ? [
      {
        badgeId: allBadges.value[0]._id,
        earnedAt: new Date().toISOString(),
        badge: allBadges.value[0]
      }
    ] : []
  } catch (err) {
    error.value = 'Erreur lors du chargement de vos badges'
  }
}

const getBadgeStatus = (badge: Badge) => {
  return myBadges.value.some(mb => mb.badgeId === badge._id) ? 'earned' : 'available'
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

onMounted(async () => {
  if (checkAuth()) {
    await fetchMyGym()
    await fetchAvailableTrainingRooms()
    await fetchAllBadges()
    await fetchMyBadges()
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
                  <span v-for="activity in myGym.activities.slice(0, 3)" :key="activity" class="activity-tag">
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
              <div class="item-avatar room-avatar">
                🏃
              </div>
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
              <button @click="viewDetails(room, 'room')" class="btn btn-info">
                Voir
              </button>
              <button class="btn btn-primary">
                Réserver
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'badges'" class="badges-content">
        <div class="section-header">
          <h2>Mes Badges</h2>
          <span class="count">{{ getEarnedBadgesCount() }}/{{ allBadges.length }} badge(s) obtenus</span>
        </div>
        
        <div class="badges-section">
          <h3>Badges Obtenus</h3>
          <div class="items-grid">
            <div v-for="userBadge in myBadges" :key="userBadge.badgeId" class="item-card earned-badge">
              <div class="item-info">
                <div class="item-avatar badge-avatar earned">
                  {{ userBadge.badge.icon || '🏆' }}
                </div>
                <div class="item-details">
                  <h3>{{ userBadge.badge.name }}</h3>
                  <p>{{ userBadge.badge.description }}</p>
                  <p class="earned-date">Obtenu le {{ formatDate(userBadge.earnedAt) }}</p>
                </div>
              </div>
              <div class="item-actions">
                <button @click="viewDetails(userBadge.badge, 'badge')" class="btn btn-info">
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
              v-for="badge in allBadges.filter(b => getBadgeStatus(b) === 'available')" 
              :key="badge._id" 
              class="item-card available-badge"
            >
              <div class="item-info">
                <div class="item-avatar badge-avatar available">
                  {{ badge.icon || '🏆' }}
                </div>
                <div class="item-details">
                  <h3>{{ badge.name }}</h3>
                  <p>{{ badge.description }}</p>
                  <p class="challenge-hint">Continuez vos efforts pour débloquer ce badge!</p>
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
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            {{ modalType === 'room' ? 'Détails Salle d\'Entraînement' : 'Détails Badge' }}
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
                <span>{{ selectedItem.icon }}</span>
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

.equipment-list, .activities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.equipment-tag, .activity-tag {
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

.status, .difficulty {
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
</style>