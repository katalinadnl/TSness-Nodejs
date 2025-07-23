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
const currentUser = ref<User | null>(null)

const myGyms = ref<Gym[]>([])
const myGym = ref<Gym | null>(null)
const myTrainingRooms = ref<TrainingRoom[]>([])
const leaderboard = ref<LeaderboardEntry[]>([])
const allBadges = ref<Badge[]>([])

const ownerProfile = ref<User | null>(null)

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
  if (userData.role !== 'gym_owner') {
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

const fetchMyGyms = async () => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gyms`, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (data.success && data.data.length > 0) {
      myGyms.value = data.data
      myGym.value = data.data[0]
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement de vos salles de sport'
  }
}

const fetchMyTrainingRooms = async () => {
  if (!checkAuth()) return

  try {
    if (myGyms.value.length === 0) {
      await fetchMyGyms()
    }

    const allRooms: TrainingRoom[] = []
    for (const gym of myGyms.value) {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gyms/${gym._id}/full`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success && data.data && data.data.trainingRooms) {
        allRooms.push(...data.data.trainingRooms)
      }
    }
    myTrainingRooms.value = allRooms
  } catch (err) {
    error.value = 'Erreur lors du chargement des salles d\'entraînement'
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

const fetchAllBadges = async () => {
  if (!checkAuth()) return

  try {
    console.log('Fetching badges from API...')
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges`, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    console.log('Badges API response:', data)
    if (data.success) {
      allBadges.value = data.data
      console.log('Badges loaded:', allBadges.value.length, 'badges')
    } else {
      console.error('Failed to fetch badges:', data.message)
    }
  } catch (err) {
    console.error('Error fetching badges:', err)
    error.value = 'Erreur lors du chargement des badges'
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

const fetchOwnerProfile = async () => {
  if (!checkAuth()) return

  try {
    const user = localStorage.getItem('user')
    if (user) {
      ownerProfile.value = JSON.parse(user)
    }
  } catch (err) {
    console.error('Error loading owner profile:', err)
  }
}

const suggestChallenge = (badge: Badge) => {
  alert(`Proposition de défi pour le badge "${badge.name}":\n\nCréez un défi personnalisé basé sur ce badge pour vos clients. Les participants peuvent gagner +100 points et obtenir ce badge en réussissant le défi!\n\nVous pouvez l'adapter selon les équipements de votre salle : ${myGym.value?.equipment.join(', ') || 'Aucun équipement'}.`)
}

const createEquipmentChallenge = (equipment: string) => {
  const challengeIdeas = {
    'haltères': 'Défi Haltères: Soulevez 80% de votre poids corporel 5 fois en moins de 2 minutes',
    'tapis de course': 'Défi Cardio: Courez 5km en moins de 30 minutes',
    'bancs de musculation': 'Défi Développé-couché: Effectuez 20 répétitions à 60% de votre max',
    'vélos elliptiques': 'Défi Endurance: 45 minutes d\'elliptique avec résistance moyenne',
    'barres': 'Défi Force: Squat avec barre - 15 répétitions à votre poids corporel'
  }

  const challenge = challengeIdeas[equipment as keyof typeof challengeIdeas] || `Défi ${equipment}: Utilisez cet équipement pendant 30 minutes avec intensité élevée`
  alert(`💪 ${challenge}\n\nRécompense: +50 points + bonus performance\n\nCe défi sera proposé à tous vos clients et augmentera leur motivation !`)
}

const createActivityChallenge = (activity: string) => {
  const challengeIdeas = {
    'yoga': 'Défi Yoga: Maintenez la position du guerrier III pendant 1 minute',
    'crossfit': 'Défi CrossFit: Complétez un WOD de 15 minutes sans pause',
    'musculation': 'Défi Muscu: Circuit de 5 exercices différents, 3 séries chacun',
    'cardio': 'Défi Cardio: Brûlez 300 calories en moins de 45 minutes',
    'fitness': 'Défi Fitness: Séance complète de 1h avec 3 types d\'exercices différents'
  }

  const challenge = challengeIdeas[activity as keyof typeof challengeIdeas] || `Défi ${activity}: Participez à une séance intensive de cette activité`
  alert(`🎯 ${challenge}\n\nRécompense: +75 points + bonus participation\n\nVos clients vont adorer ce nouveau défi !`)
}

onMounted(() => {
  if (checkAuth()) {
    fetchOwnerProfile()
    fetchMyGyms()
    fetchMyTrainingRooms()
    fetchLeaderboard()
    fetchAllBadges()
  }
})
</script>

<template>
  <div class="gym-owner-container">
    <div class="gym-owner-header">
      <div class="header-content">
        <h1>Dashboard Gestionnaire</h1>
        <p v-if="currentUser">Bienvenue {{ currentUser.firstName }} {{ currentUser.lastName }}</p>
        <p v-if="myGym" class="gym-name">{{ myGym.name }}</p>
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
        @click="activeTab = 'badges'; console.log('Badge tab clicked, activeTab is now:', activeTab, 'allBadges count:', allBadges.length)"
        :class="{ active: activeTab === 'badges' }"
        class="tab-button"
      >
        🏆 Badges & Défis
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
              <h3>{{ myGyms.length }}</h3>
              <p>{{ myGyms.length > 1 ? 'Mes Salles de Sport' : 'Ma Salle de Sport' }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🏃</div>
            <div class="stat-content">
              <h3>{{ myTrainingRooms.length }}</h3>
              <p>Salles d'Entraînement</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <h3>{{ myTrainingRooms.filter(room => room.isApproved).length }}</h3>
              <p>Salles Approuvées</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
              <h3>{{ myTrainingRooms.filter(room => !room.isApproved).length }}</h3>
              <p>En Attente</p>
            </div>
          </div>
        </div>

        <div v-if="myGym" class="gym-overview">
          <h2>Aperçu de votre salle</h2>
          <div class="gym-card">
            <div class="gym-info">
              <h3>{{ myGym.name }}</h3>
              <p>{{ myGym.description }}</p>
              <p>📍 {{ myGym.address }}</p>
              <p>📞 {{ myGym.contactPhone }}</p>
              <p>✉️ {{ myGym.contactEmail }}</p>
            </div>
            <div class="gym-status">
              <span class="status" :class="{ active: myGym.isApproved }">
                {{ myGym.isApproved ? 'Approuvé' : 'En attente' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'gym'" class="gym-content">
        <div v-if="!myGym" class="no-gym-message">
          <p>Aucune salle de sport trouvée. Veuillez vous assurer d'être assigné à une salle de sport.</p>
        </div>

        <div v-else>
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
        </div>
        </div>
      </div>

      <div v-if="activeTab === 'rooms'" class="rooms-content">
        <div class="section-header">
          <h2>Mes Salles d'Entraînement</h2>
          <span class="count">{{ myTrainingRooms.length }} salle(s)</span>
        </div>
        <div class="items-grid">
          <div v-for="room in myTrainingRooms" :key="room._id" class="item-card">
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
          <h2>Badges Disponibles & Proposition de Défis</h2>
          <span class="count">{{ allBadges.length }} badge(s) disponible(s)</span>
        </div>
        
        <!-- Debug info -->
        <div style="padding: 10px; background: #f0f0f0; margin-bottom: 20px;">
          <p>Debug: activeTab = {{ activeTab }}</p>
          <p>Debug: allBadges.length = {{ allBadges.length }}</p>
          <p>Debug: Badges tab condition = {{ activeTab === 'badges' }}</p>
        </div>

        <div class="badges-section">
          <div class="detail-card">
            <h3>🏆 Tous les Badges Disponibles</h3>
            <p class="section-description">
              Découvrez tous les badges que vos clients peuvent obtenir et proposez des défis basés sur votre équipement.
            </p>

            <div class="badges-grid">
              <div v-for="badge in allBadges" :key="badge._id" class="badge-card">
                <div class="badge-icon">
                  <img :src="badge.iconUrl || 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/badge.png'"
                       :alt="badge.name"
                       class="badge-image"
                  />
                </div>
                <div class="badge-details">
                  <h4>{{ badge.name }}</h4>
                  <p>{{ badge.description }}</p>
                  <div class="badge-meta">
                    <span class="status" :class="{ active: badge.isActive }">
                      {{ badge.isActive ? 'Actif' : 'Inactif' }}
                    </span>
                    <span class="badge-date">{{ formatDate(badge.createdAt) }}</span>
                  </div>
                </div>
                <div class="badge-actions">
                  <button @click="viewDetails(badge, 'badge')" class="btn btn-info">
                    Détails
                  </button>
                  <button @click="suggestChallenge(badge)" class="btn btn-primary">
                    Proposer Défi
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-card" v-if="myGym">
            <h3>💡 Générateur de Défis Personnalisés</h3>
            <p class="section-description">
              Créez des défis basés sur les équipements disponibles dans votre salle pour motiver vos clients et augmenter leur score.
            </p>

            <div class="challenge-generator">
              <div class="equipment-based-challenges">
                <h4>🏋️ Défis basés sur vos équipements</h4>
                <div class="equipment-challenges-grid">
                  <div v-for="equipment in myGym.equipment" :key="equipment" class="equipment-challenge">
                    <div class="equipment-info">
                      <span class="equipment-name">{{ equipment }}</span>
                      <p>Défi suggéré pour cet équipement</p>
                    </div>
                    <button @click="createEquipmentChallenge(equipment)" class="btn btn-secondary">
                      Créer Défi
                    </button>
                  </div>
                </div>
              </div>

              <div class="activity-based-challenges" v-if="myGym.activities.length > 0">
                <h4>🎯 Défis basés sur vos activités</h4>
                <div class="activity-challenges-grid">
                  <div v-for="activity in myGym.activities" :key="activity" class="activity-challenge">
                    <div class="activity-info">
                      <span class="activity-name">{{ activity }}</span>
                      <p>Défi suggéré pour cette activité</p>
                    </div>
                    <button @click="createActivityChallenge(activity)" class="btn btn-secondary">
                      Créer Défi
                    </button>
                  </div>
                </div>
              </div>

              <div class="challenge-impact">
                <h4>📈 Impact sur le Score des Joueurs</h4>
                <div class="impact-info">
                  <div class="impact-item">
                    <strong>Défi Équipement :</strong>
                    <span>+50 points de base + bonus performance</span>
                  </div>
                  <div class="impact-item">
                    <strong>Défi Activité :</strong>
                    <span>+75 points de base + bonus participation</span>
                  </div>
                  <div class="impact-item">
                    <strong>Défi Badge :</strong>
                    <span>+100 points + badge obtenu</span>
                  </div>
                </div>
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

      <div v-if="activeTab === 'profile'" class="profile-content">
        <div class="section-header">
          <h2>Mon Profil</h2>
        </div>

        <div v-if="ownerProfile" class="profile-section">
          <div class="profile-card">
            <div class="profile-avatar">
              {{ ownerProfile.firstName?.charAt(0) || '' }}{{ ownerProfile.lastName?.charAt(0) || '' }}
            </div>
          </div>

          <div class="profile-details">
            <div class="detail-card">
              <h4>Informations personnelles</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Nom complet:</strong>
                  <span>{{ ownerProfile.firstName }} {{ ownerProfile.lastName }}</span>
                </div>
                <div class="detail-item">
                  <strong>Nom d'utilisateur:</strong>
                  <span>{{ ownerProfile.username }}</span>
                </div>
                <div class="detail-item">
                  <strong>Email:</strong>
                  <span>{{ ownerProfile.email }}</span>
                </div>
                <div class="detail-item">
                  <strong>Rôle:</strong>
                  <span>{{ ownerProfile.role === 'gym_owner' ? 'Gestionnaire de Salle' : ownerProfile.role }}</span>
                </div>
                <div class="detail-item">
                  <strong>Statut:</strong>
                  <span class="status active">{{ ownerProfile.isActive ? 'Actif' : 'Inactif' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="loading-message">
          Chargement du profil...
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Détails Salle d'Entraînement</h3>
          <button @click="showModal = false" class="modal-close">&times;</button>
        </div>
        <div v-if="selectedItem" class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <strong>ID:</strong>
              <span>{{ selectedItem._id }}</span>
            </div>
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
.gym-owner-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.gym-owner-header {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gym-info h3 {
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.gym-info p {
  margin: 4px 0;
  color: var(--color-text-muted);
}

.gym-status {
  display: flex;
  align-items: center;
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
}

.room-avatar {
  background: var(--color-accent);
  font-size: 1.5rem;
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

.item-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status, .manager {
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

.btn-secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-info {
  background: var(--color-accent);
  color: white;
}

.btn-primary {
  background: var(--color-primary);
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
  .gym-owner-header {
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

  .gym-card {
    flex-direction: column;
    gap: 16px;
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

.no-gym-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
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

/* Styles pour la section Badges */
.badges-content {
  padding: 0;
}

.badges-section {
  display: grid;
  gap: 20px;
}

.section-description {
  color: var(--color-text-muted);
  margin-bottom: 20px;
  font-style: italic;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.badge-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
}

.badge-card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.badge-icon {
  margin-bottom: 16px;
}

.badge-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.badge-details {
  flex: 1;
  margin-bottom: 16px;
}

.badge-details h4 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 600;
}

.badge-details p {
  margin: 0 0 12px 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.4;
}

.badge-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.badge-date {
  font-size: 12px;
  color: var(--color-text-muted);
}

.badge-actions {
  display: flex;
  gap: 8px;
}

.challenge-generator {
  display: grid;
  gap: 24px;
  margin-top: 20px;
}

.equipment-based-challenges h4,
.activity-based-challenges h4,
.challenge-impact h4 {
  margin: 0 0 16px 0;
  color: var(--color-text);
  font-size: 1.1rem;
}

.equipment-challenges-grid,
.activity-challenges-grid {
  display: grid;
  gap: 12px;
}

.equipment-challenge,
.activity-challenge {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.equipment-challenge:hover,
.activity-challenge:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background-mute);
}

.equipment-info,
.activity-info {
  flex: 1;
}

.equipment-name,
.activity-name {
  font-weight: 600;
  color: var(--color-primary);
  text-transform: capitalize;
}

.equipment-info p,
.activity-info p {
  margin: 4px 0 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.challenge-impact {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(167, 85, 221, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--border-radius);
  padding: 20px;
}

.impact-info {
  display: grid;
  gap: 12px;
}

.impact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.impact-item:last-child {
  border-bottom: none;
}

.impact-item strong {
  color: var(--color-text);
}

.impact-item span {
  color: var(--color-primary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .badges-grid {
    grid-template-columns: 1fr;
  }

  .badge-card {
    padding: 16px;
  }

  .badge-actions {
    width: 100%;
    justify-content: center;
  }

  .equipment-challenge,
  .activity-challenge {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
