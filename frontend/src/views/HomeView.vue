<script setup lang="ts">
import { ref, onMounted } from 'vue'

const message = ref<string>('Chargement...')

onMounted(async () => {
  try {
    const res = await fetch(import.meta.env.VITE_BACKEND_URL)
    const data = await res.json()
    message.value = data.message
  } catch (error) {
    console.error('Erreur:', error)
    message.value = 'Erreur lors de la récupération du message'
  }
})
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="hero-title">TSness</h1>
      <p class="hero-subtitle">Votre application de gestion de salle de sport</p>
    </div>

    <div class="content-section">
      <div class="card status-card">
        <h2>Statut de l'API</h2>
        <p class="status-message">{{ message }}</p>
        <div class="status-indicator" :class="{ online: !message.includes('Erreur') }"></div>
      </div>

      <div class="login-section">
        <div class="card login-card">
          <div class="login-icon">🔐</div>
          <h3>Connexion</h3>
          <p class="text-muted">Accédez à votre espace de gestion TSness</p>
          <router-link to="/login" class="btn btn-primary">Se connecter</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  padding: 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
  padding: 40px 0;
}

.hero-title {
  font-size: 3.5rem;
  margin-bottom: 16px;
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  max-width: 600px;
  margin: 0 auto;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto;
}

.status-card {
  margin-bottom: 40px;
  position: relative;
  text-align: center;
}

.status-message {
  font-size: 1.1rem;
  margin: 16px 0;
  color: var(--color-text);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-accent);
  margin: 0 auto;
  box-shadow: 0 0 10px var(--color-accent);
  animation: pulse 2s infinite;
}

.status-indicator.online {
  background: var(--color-accent);
  box-shadow: 0 0 10px var(--color-accent);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.login-section {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.login-card {
  max-width: 400px;
  text-align: center;
  transition: all 0.3s ease;
  background: linear-gradient(
    135deg,
    var(--color-background-soft) 0%,
    var(--color-background-mute) 100%
  );
}

.login-card:hover {
  transform: translateY(-8px);
  border-color: var(--color-primary);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2);
}

.login-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.8;
}

.login-card h3 {
  color: var(--color-primary);
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.login-card p {
  margin-bottom: 24px;
  line-height: 1.6;
}

.btn-primary {
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .login-card {
    max-width: 100%;
  }
}
</style>
