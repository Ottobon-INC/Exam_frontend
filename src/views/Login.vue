<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FormControl, Button } from 'frappe-ui'
import { authService } from '../api/services'

const router = useRouter()
const email = ref('candidate@enterprise.org')
const password = ref('password123')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await authService.login(email.value, password.value, 'CANDIDATE')
    localStorage.setItem('auth_token', res.token)
    localStorage.setItem('candidate_token', res.token)
    localStorage.setItem('candidate_user', JSON.stringify(res.user))
    router.push('/dashboard')
  } catch (err) {
    errorMessage.value = err.message || 'Invalid candidate credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center gradient-bg-2 p-6 text-zinc-900">
    <div class="w-full max-w-sm glass-card rounded-2xl p-8">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold text-lg shadow-sm">
          EP
        </div>
        <h1 class="text-xl font-semibold text-zinc-900">Candidate Portal</h1>
        <p class="mt-1.5 text-xs text-zinc-500">Enter your registered credentials to access your exams.</p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="mb-4 rounded-lg border border-outline-red-2 bg-surface-red-1 p-3 text-xs text-ink-red-3">
        {{ errorMessage }}
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <FormControl
          v-model="email"
          type="email"
          label="Candidate Email"
          placeholder="candidate@enterprise.org"
          required
        />
        
        <FormControl
          v-model="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          required
        />

        <div class="pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full py-2.5 flex items-center justify-center"
          >
            <span v-if="loading">Authenticating...</span>
            <span v-else>Sign In to Exams</span>
          </button>
        </div>
      </form>

      <div class="mt-6 border-t border-outline-gray-1 pt-4 text-center">
        <router-link
          to="/admin/login"
          class="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <span>Examiner & Admin Sign In →</span>
        </router-link>
      </div>
    </div>
  </div>
</template>
