<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FormControl, Button } from 'frappe-ui'
import { authService } from '../api/services'

const router = useRouter()
const email = ref('')
const password = ref('')
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
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden shadow-sm">
          <img src="/logo.png" class="h-full w-full object-contain" alt="Ottobon Emblem" />
        </div>
        <h1 class="text-xl font-bold text-zinc-900">Ottobon Examination Portal</h1>
        <p class="mt-1.5 text-xs text-zinc-500">Enter your registered credentials to access your assessment.</p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="mb-4 rounded-lg border border-outline-red-2 bg-surface-red-1 p-3 text-xs text-ink-red-3">
        {{ errorMessage }}
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin" autocomplete="off">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-zinc-700">Candidate Email <span class="text-red-500">*</span></label>
          <input
            v-model="email"
            type="email"
            name="candidate_email_field"
            autocomplete="off"
            required
            class="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
            placeholder=""
          />
        </div>
        
        <div>
          <label class="mb-1.5 block text-xs font-medium text-zinc-700">Password <span class="text-red-500">*</span></label>
          <input
            v-model="password"
            type="password"
            name="candidate_password_field"
            autocomplete="new-password"
            required
            class="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
            placeholder=""
          />
        </div>

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

    </div>
  </div>
</template>
