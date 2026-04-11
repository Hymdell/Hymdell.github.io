<template>
  <div class="login-container">
    <div class="glass-panel login-box">
      <div class="logo-area">
        <h1>Organizer</h1>
        <p>Acesse suas tarefas e anotações</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label class="input-label" for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            class="input-field" 
            placeholder="seu@email.com"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label" for="password">Senha</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            class="input-field" 
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary w-full mt-4" :disabled="loading">
          <span v-if="loading">Aguarde...</span>
          <span v-else>{{ isLoginMode ? 'Entrar' : 'Cadastrar' }}</span>
        </button>

        <div class="error-msg" v-if="errorMsg">{{ errorMsg }}</div>
      </form>
      
      <div class="divider">
        <span>ou</span>
      </div>

      <button @click="handleGoogleLogin" class="btn btn-secondary w-full google-btn" :disabled="loading">
        <!-- SVG icon for Google -->
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Entrar com Google
      </button>

      <p class="signup-prompt text-center mt-4">
        <span v-if="isLoginMode">
          Primeira vez? <a href="#" @click.prevent="isLoginMode = false">Crie uma conta</a>
        </span>
        <span v-else>
          Já tem uma conta? <a href="#" @click.prevent="isLoginMode = true">Entrar</a>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider 
} from 'firebase/auth'
import { auth } from '../firebase/config'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const isLoginMode = ref(true)

// Handle result from signInWithRedirect (Google redirect flow)
onMounted(async () => {
  try {
    const result = await getRedirectResult(auth)
    if (result?.user) {
      router.push('/')
    }
  } catch (error) {
    if (error.code === 'auth/unauthorized-domain') {
      errorMsg.value = 'Este domínio não está autorizado no Firebase. Adicione-o nos domínios autorizados.'
    } else if (error.code) {
      errorMsg.value = `Erro ao conectar com Google: ${error.code}`
    }
  }
})

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMsg.value = 'Preencha todos os campos.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  
  try {
    if (isLoginMode.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
    }
    router.push('/')
  } catch (error) {
    console.error(error)
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      errorMsg.value = 'Usuário ou senha incorretos.'
    } else if (error.code === 'auth/email-already-in-use') {
      errorMsg.value = 'Este email já está em uso.'
    } else if (error.code === 'auth/weak-password') {
      errorMsg.value = 'A senha deve ter pelo menos 6 caracteres.'
    } else {
      errorMsg.value = 'Ocorreu um erro. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  const provider = new GoogleAuthProvider()
  
  try {
    await signInWithPopup(auth, provider)
    router.push('/')
  } catch (error) {
    console.error('Google login error:', error.code, error.message)
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // User closed the popup — not an error
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMsg.value = 'Este domínio não está autorizado no Firebase. Adicione-o nos domínios autorizados do console Firebase (Authentication → Settings → Authorized domains).'
    } else if (error.code === 'auth/popup-blocked') {
      // Browser blocked the popup — fall back to redirect
      errorMsg.value = 'Popup bloqueado. Redirecionando...'
      await signInWithRedirect(auth, provider)
    } else if (error.code === 'auth/network-request-failed') {
      errorMsg.value = 'Erro de conexão. Verifique sua internet.'
    } else {
      errorMsg.value = `Erro ao conectar com Google: ${error.code}`
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}

.login-box {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem 2rem;
  animation: floatIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes floatIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-area {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-area h1 {
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.error-msg {
  color: var(--danger-color);
  font-size: 0.85rem;
  margin-top: 1rem;
  text-align: center;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: var(--text-muted);
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--surface-border);
}
.divider span {
  padding: 0 1rem;
  font-size: 0.9rem;
}

.google-btn {
  display: flex;
  gap: 0.75rem;
}

.signup-prompt {
  font-size: 0.9rem;
}
.signup-prompt a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}
.signup-prompt a:hover {
  text-decoration: underline;
}
</style>
