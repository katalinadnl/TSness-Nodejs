import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true }
    },
    {
      path: '/gym-owner',
      name: 'gym-owner',
      component: () => import('../views/GymOwnerView.vue'),
      meta: { requiresAuth: true, requiresGymOwner: true }
    },
    {
      path: '/client',
      name: 'client',
      component: () => import('../views/ClientView.vue'),
      meta: { requiresAuth: true, requiresClient: true }
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  if (to.meta.requiresSuperAdmin && user) {
    const userData = JSON.parse(user)
    if (userData.role !== 'super_admin') {
      next('/')
      return
    }
  }

  if (to.meta.requiresGymOwner && user) {
    const userData = JSON.parse(user)
    if (userData.role !== 'gym_owner') {
      next('/')
      return
    }
  }

  if (to.meta.requiresClient && user) {
    const userData = JSON.parse(user)
    if (userData.role !== 'client') {
      next('/')
      return
    }
  }

  next()
})

export default router
