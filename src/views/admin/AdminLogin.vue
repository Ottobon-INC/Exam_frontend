<template>
  <div class="flex min-h-screen w-full items-center justify-center gradient-bg-1 p-4">
    <div class="w-full max-w-md glass-card-dark rounded-2xl p-8">
      <!-- Brand & Header -->
      <div class="mb-6 flex flex-col items-center text-center">
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold text-lg shadow-sm">
          EP
        </div>
        <h1 class="text-xl font-semibold text-white">Examiner & Admin Portal</h1>
        <p class="mt-1 text-xs text-zinc-400">
          {{ isRegistering ? 'Create a new examiner or admin account.' : 'Sign in to manage exams, question banks, and live proctoring.' }}
        </p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="mb-4 rounded-lg border border-outline-red-2 bg-surface-red-1 p-3 text-xs text-ink-red-3">
        {{ errorMessage }}
      </div>

      <!-- Quick Role Switcher Demo Pills (Only for Login) -->
      <div v-if="!isRegistering" class="mb-6">
        <label class="mb-2 block text-3xs font-medium text-zinc-400 uppercase tracking-wider">Quick Demo Credentials:</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="role in demoRoles"
            :key="role.id"
            @click="selectRole(role)"
            type="button"
            class="flex items-center gap-2 rounded-lg border p-2 text-left transition-all text-xs"
            :class="[
              selectedRole.id === role.id
                ? 'border-ink-gray-9 bg-surface-gray-2 text-white font-semibold'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
            ]"
          >
            <span class="h-2 w-2 rounded-full" :class="role.color"></span>
            <div class="flex flex-col truncate">
              <span class="truncate">{{ role.name }}</span>
              <span class="text-3xs text-ink-gray-4">{{ role.description }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Login / Register Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="isRegistering">
          <label class="mb-1.5 block text-xs font-medium text-zinc-300">Full Name</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-zinc-900 placeholder-ink-gray-4 transition-colors focus:border-outline-gray-5 focus:outline-none"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-zinc-300">Staff ID / Work Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-zinc-900 placeholder-ink-gray-4 transition-colors focus:border-outline-gray-5 focus:outline-none"
            placeholder="admin@enterprise.org"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-zinc-300">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-zinc-900 placeholder-ink-gray-4 transition-colors focus:border-outline-gray-5 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div v-if="isRegistering">
          <label class="mb-1.5 block text-xs font-medium text-zinc-300">Admin Role</label>
          <select
            v-model="registerRole"
            class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-zinc-900 transition-colors focus:border-outline-gray-5 focus:outline-none"
          >
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="EXAMINER">Lead Examiner</option>
            <option value="PROCTOR">Live Proctor</option>
            <option value="EVALUATOR">Evaluator</option>
          </select>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="flex w-full items-center justify-center gap-2 rounded-lg btn-primary py-2.5 mt-2"
        >
          <span v-if="loading">{{ isRegistering ? 'Registering...' : 'Authenticating...' }}</span>
          <span v-else>{{ isRegistering ? 'Create Account' : `Sign In as ${selectedRole.name}` }}</span>
        </button>
      </form>

      <!-- Toggle and Back Links -->
      <div class="mt-6 border-t border-outline-gray-1 pt-4 text-center flex flex-col gap-3">
        <button
          @click="toggleMode"
          type="button"
          class="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <span>{{ isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register as New Admin" }}</span>
        </button>
        
        <router-link
          to="/login"
          class="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <span>← Back to Candidate Portal</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../api/services'

const router = useRouter()

const isRegistering = ref(false)

const demoRoles = [
  { id: 'super_admin', name: 'Super Admin', description: 'Full System Control', email: 'admin@enterprise.org', color: 'bg-surface-green-3' },
  { id: 'examiner', name: 'Lead Examiner', description: 'Exam Authoring', email: 'examiner@enterprise.org', color: 'bg-surface-blue-3' },
  { id: 'proctor', name: 'Live Proctor', description: 'Video Hub & Interventions', email: 'proctor@enterprise.org', color: 'bg-surface-red-3' },
  { id: 'evaluator', name: 'Evaluator', description: 'Subjective Grading', email: 'evaluator@enterprise.org', color: 'bg-surface-amber-3' },
]

const selectedRole = ref(demoRoles[0])
const email = ref(demoRoles[0].email)
const password = ref('password123')

// Fields specific to registration
const name = ref('')
const registerRole = ref('EXAMINER')

const loading = ref(false)
const errorMessage = ref('')

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  errorMessage.value = ''
  if (!isRegistering.value) {
    email.value = selectedRole.value.email
    password.value = 'password123'
  } else {
    email.value = ''
    password.value = ''
  }
}

const selectRole = (role) => {
  selectedRole.value = role
  email.value = role.email
}

const handleSubmit = async () => {
  if (isRegistering.value) {
    await handleRegister()
  } else {
    await handleLogin()
  }
}

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await authService.login(email.value, password.value, 'ADMIN')
    localStorage.setItem('auth_token', res.token)
    localStorage.setItem('admin_token', res.token)
    localStorage.setItem('admin_user', JSON.stringify(res.user))
    router.push('/admin/dashboard')
  } catch (err) {
    errorMessage.value = err.message || 'Invalid administrator credentials'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await authService.register(name.value, email.value, password.value, registerRole.value)
    localStorage.setItem('auth_token', res.token)
    localStorage.setItem('admin_token', res.token)
    localStorage.setItem('admin_user', JSON.stringify(res.user))
    router.push('/admin/dashboard')
  } catch (err) {
    errorMessage.value = err.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>
