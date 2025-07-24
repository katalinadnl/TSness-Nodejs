<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Challenge {
  _id: string
  title: string
  description: string
  duration: number
  difficultyLevel: string
  goals: string
  participants: any[]
  createdBy: string
  gymId?: string
}

interface Progress {
  caloriesBurned: number
  duration: number
}

const router = useRouter()
const challenges = ref<Challenge[]>([])
const activeTab = ref('challenges')
const error = ref('')
const progress = reactive<Progress>({ caloriesBurned: 0, duration: 0 })
const currentUser = ref<any>(null)

const checkAuth = () => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  if (!token || !user) {
    router.push('/login')
    return false
  }

  const userData = JSON.parse(user)
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

const fetchChallenges = async () => {
  if (!checkAuth()) return
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/challenges`, {
      headers: getAuthHeaders(),
    })
    const data = await res.json()
    if (data.success) challenges.value = data.data
  } catch (err) {
    error.value = 'Erreur lors du chargement des défis.'
  }
}

const participateInChallenge = async (challengeId: string) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/challenges/${challengeId}/participate`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
    )
    const data = await res.json()
    if (data.success) {
      alert('Participation enregistrée !')
      await fetchChallenges()
    } else {
      alert(data.message)
    }
  } catch (err) {
    error.value = 'Erreur lors de la participation.'
  }
}

const submitProgress = async (challengeId: string) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/challenges/${challengeId}/progress`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(progress),
      },
    )
    const data = await res.json()
    if (data.success) {
      alert('Progression mise à jour !')
    } else {
      alert(data.message)
    }
  } catch (err) {
    error.value = 'Erreur lors de la mise à jour de la progression.'
  }
}

onMounted(() => {
  if (checkAuth()) {
    fetchChallenges()
  }
})
</script>

<template>
  <div class="challenge-container">
    <h1>🎯 Défis disponibles</h1>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="challenges-list">
      <div v-for="challenge in challenges" :key="challenge._id" class="challenge-card">
        <h2>{{ challenge.title }}</h2>
        <p>{{ challenge.description }}</p>
        <p><strong>Durée:</strong> {{ challenge.duration }} jours</p>
        <p><strong>Difficulté:</strong> {{ challenge.difficultyLevel }}</p>
        <p><strong>Objectifs:</strong> {{ challenge.goals }}</p>

        <button @click="participateInChallenge(challenge._id)" class="btn btn-primary">
          Participer
        </button>

        <form @submit.prevent="submitProgress(challenge._id)" class="progress-form">
          <input
            type="number"
            v-model="progress.caloriesBurned"
            placeholder="Calories brûlées"
            required
          />
          <input type="number" v-model="progress.duration" placeholder="Durée (min)" required />
          <button type="submit" class="btn btn-info">Mettre à jour ma progression</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  color: black;
}

.challenge-container {
  padding: 24px;
}

.challenges-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.challenge-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background-color: #f9f9f9;
}

.btn {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
}

.btn-info {
  background-color: #2196f3;
  color: white;
}

.error {
  color: red;
  margin-bottom: 20px;
}

.progress-form {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
