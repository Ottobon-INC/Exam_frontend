<template>
  <div class="flex h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900 antialiased">
    <!-- Left Navigation Sidebar -->
    <aside
      class="flex flex-col border-r border-outline-gray-1 bg-surface-white transition-all duration-200"
      :class="isSidebarCollapsed ? 'w-16' : 'w-64'"
    >
      <!-- Logo & Brand Header -->
      <div class="flex h-14 items-center justify-between border-b border-outline-gray-1 px-4">
        <div v-if="!isSidebarCollapsed" class="flex items-center gap-2.5 overflow-hidden">
          <img src="/logo.png" class="h-8 w-8 object-contain rounded-lg shrink-0 shadow-2xs" alt="Ottobon Emblem" />
          <div class="flex flex-col leading-tight">
            <span class="font-semibold text-zinc-900 text-sm truncate">Ottobon Exam Portal</span>
            <span class="text-3xs text-emerald-700 font-mono uppercase tracking-wider font-bold">Admin Portal</span>
          </div>
        </div>
        <div v-else class="mx-auto">
          <img src="/logo.png" class="h-8 w-8 object-contain rounded-lg shrink-0" alt="Ottobon Emblem" />
        </div>

        <button
          @click="isSidebarCollapsed = !isSidebarCollapsed"
          class="rounded p-1 text-zinc-400 hover:bg-surface-gray-2 hover:text-ink-gray-8 transition-colors"
          :title="isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 space-y-1 overflow-y-auto p-3">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="[
            $route.path === item.path
              ? 'bg-zinc-900 text-white font-semibold shadow-xs'
              : 'text-ink-gray-6 hover:bg-zinc-50 hover:text-zinc-900'
          ]"
        >
          <!-- Custom Icon based on item.icon -->
          <div class="shrink-0">
            <!-- Dashboard Icon -->
            <svg v-if="item.icon === 'dashboard'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9" rx="1"/>
              <rect x="14" y="3" width="7" height="5" rx="1"/>
              <rect x="14" y="12" width="7" height="9" rx="1"/>
              <rect x="3" y="16" width="7" height="5" rx="1"/>
            </svg>
            <!-- Exams Icon -->
            <svg v-else-if="item.icon === 'exams'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <!-- Questions Icon -->
            <svg v-else-if="item.icon === 'questions'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <!-- Proctoring Icon -->
            <svg v-else-if="item.icon === 'proctoring'" class="h-4 w-4 text-ink-red-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <!-- Evaluation Icon -->
            <svg v-else-if="item.icon === 'evaluation'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <!-- Results Icon -->
            <svg v-else-if="item.icon === 'results'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          <span v-if="!isSidebarCollapsed" class="truncate">{{ item.label }}</span>
          
          <!-- Live Proctoring Badge -->
          <span
            v-if="!isSidebarCollapsed && item.badge"
            class="ml-auto inline-flex items-center rounded-full bg-surface-red-2 px-1.5 py-0.5 text-2xs font-semibold text-ink-red-3"
          >
            {{ item.badge }}
          </span>
        </router-link>
      </nav>

      <!-- Sidebar Footer: Switcher & Profile -->
      <div class="border-t border-outline-gray-1 p-3">
        <!-- Switch to Candidate Portal -->
        <router-link
          to="/dashboard"
          class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-ink-gray-6 hover:bg-surface-gray-2 hover:text-zinc-900 transition-colors"
          :title="isSidebarCollapsed ? 'Switch to Candidate Portal' : ''"
        >
          <svg class="h-4 w-4 shrink-0 text-ink-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span v-if="!isSidebarCollapsed" class="truncate font-medium">Candidate Portal</span>
        </router-link>

        <!-- Current Admin Profile -->
        <div class="mt-2 flex items-center gap-2.5 rounded-lg bg-zinc-50 p-2 border border-outline-gray-1">
          <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-gray-3 text-xs font-semibold text-ink-gray-8">
            SA
          </div>
          <div v-if="!isSidebarCollapsed" class="flex flex-1 flex-col overflow-hidden leading-tight">
            <span class="truncate text-xs font-medium text-zinc-900">Admin Officer</span>
            <span class="truncate text-2xs text-zinc-400">Super Admin</span>
          </div>
          <button
            v-if="!isSidebarCollapsed"
            @click="handleLogout"
            class="text-ink-gray-4 hover:text-ink-red-3 transition-colors p-1"
            title="Log out"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Top Application Header -->
      <header class="flex h-14 items-center justify-between border-b border-outline-gray-1 bg-surface-white px-6">
        <!-- Breadcrumb / Title Area -->
        <div class="flex items-center gap-3 text-sm">
          <span class="text-zinc-400">Admin</span>
          <span class="text-ink-gray-3">/</span>
          <span class="font-semibold text-zinc-900 capitalize">{{ currentRouteTitle }}</span>
        </div>

        <!-- Right Tools -->
        <div class="flex items-center gap-3">
          <!-- Active Proctor Status Indicator -->
          <div class="hidden sm:flex items-center gap-2 rounded-full border border-outline-gray-1 bg-zinc-50 px-3 py-1 text-xs">
            <span class="h-2 w-2 rounded-full bg-surface-green-3 animate-pulse"></span>
            <span class="text-ink-gray-6 font-medium">Proctor Hub Online</span>
          </div>

          <!-- Notification Bell -->
          <button class="relative rounded-lg border border-outline-gray-1 p-2 text-ink-gray-6 hover:bg-surface-gray-2 hover:text-zinc-900 transition-colors">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-surface-red-3"></span>
          </button>
        </div>
      </header>

      <!-- Scrollable Main View Outlet -->
      <main class="flex-1 overflow-y-auto bg-zinc-50 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { initProctorSocket } from '../api/socket'

const route = useRoute()
const router = useRouter()
const isSidebarCollapsed = ref(false)
const activeCandidatesCount = ref(0)
let socket = null

onMounted(() => {
  try {
    socket = initProctorSocket()
    socket.emit('join_exam', { examId: 'GLOBAL_MONITOR', role: 'PROCTOR' })

    socket.on('candidate_online', () => {
      activeCandidatesCount.value++
    })

    socket.on('proctor_frame_stream', () => {
      if (activeCandidatesCount.value === 0) {
        activeCandidatesCount.value = 1
      }
    })
  } catch (err) {
    console.warn('Socket connect error in layout:', err)
  }
})

onUnmounted(() => {
  if (socket) {
    socket.off('candidate_online')
    socket.off('proctor_frame_stream')
  }
})

const navItems = computed(() => [
  { label: 'Overview', path: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Exams', path: '/admin/exams', icon: 'exams' },
  {
    label: 'Live Proctoring',
    path: '/admin/proctoring',
    icon: 'proctoring',
    badge: activeCandidatesCount.value > 0 ? `${activeCandidatesCount.value} Active` : null,
  },
  { label: 'Evaluation Desk', path: '/admin/evaluation', icon: 'evaluation' },
  { label: 'Results & Analytics', path: '/admin/results', icon: 'results' },
])

const currentRouteTitle = computed(() => {
  const matching = navItems.value.find((item) => item.path === route.path)
  return matching ? matching.label : (route.meta?.title || 'Dashboard')
})

const handleLogout = () => {
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_token')
  router.push('/admin/login')
}
</script>
