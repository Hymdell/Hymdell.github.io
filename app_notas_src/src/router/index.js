import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import { auth } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory('/app_notas/'),
  routes
})

// Wait for firebase auth to initialize before routing
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject
    )
  })
}

router.beforeEach(async (to, from) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isLoginPage = to.name === 'Login'
  
  const user = await getCurrentUser()

  if (requiresAuth && !user) {
    return '/login'
  } else if (isLoginPage && user) {
    return '/'
  } else {
    return true
  }
})

export default router
