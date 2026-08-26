<template>
  <div class="space-y-6">
    <!-- Header with Quick Action Controls -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-zinc-900">Examiner Operations Hub</h1>
        <p class="text-xs text-zinc-500">Overview of active exams, live candidate attempts, and system health.</p>
      </div>

      <div class="flex items-center gap-2.5">
        <router-link
          to="/admin/questions"
          class="flex items-center gap-1.5 rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-surface-gray-2 transition-colors"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </router-link>

        <router-link
          to="/admin/exams"
          class="flex items-center gap-1.5 rounded-lg bg-ink-gray-9 px-3.5 py-2 text-xs font-medium text-surface-white hover:opacity-90 transition-opacity"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create New Exam
        </router-link>
      </div>
    </div>

    <!-- Stat Metrics Row -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-zinc-100 bg-surface-white p-4 shadow-xs">
        <div class="flex items-center justify-between text-xs text-zinc-500">
          <span>Active Exams</span>
          <span class="font-medium text-2xs text-ink-green-3">Live Now</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-zinc-900">{{ liveCount }}</span>
          <span class="text-xs text-zinc-400">Scheduled & active</span>
        </div>
      </div>

      <div class="rounded-xl border border-zinc-100 bg-surface-white p-4 shadow-xs">
        <div class="flex items-center justify-between text-xs text-zinc-500">
          <span>Total Database Exams</span>
          <span class="font-medium text-2xs text-ink-blue-3">Catalog</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-zinc-900">{{ exams.length }}</span>
          <span class="text-xs text-zinc-400">In repository</span>
        </div>
      </div>

      <div class="rounded-xl border border-zinc-100 bg-surface-white p-4 shadow-xs">
        <div class="flex items-center justify-between text-xs text-zinc-500">
          <span>Pending Evaluation</span>
          <span class="font-medium text-2xs text-ink-amber-3">Queue</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-zinc-900">{{ pendingCount }}</span>
          <span class="text-xs text-zinc-400">Subjective items</span>
        </div>
      </div>

      <div class="rounded-xl border border-zinc-100 bg-surface-white p-4 shadow-xs">
        <div class="flex items-center justify-between text-xs text-zinc-500">
          <span>Proctor Hub</span>
          <span class="font-medium text-2xs text-ink-green-3">Online</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-ink-green-3">Active</span>
          <span class="text-xs text-zinc-400">Port 4000</span>
        </div>
      </div>
    </div>

    <!-- Live Exams Table -->
    <div class="rounded-xl border border-zinc-100 bg-surface-white p-5 shadow-xs">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold text-zinc-900">Examinations Roster</h2>
          <p class="text-xs text-zinc-400">Live candidate participation and attempt tracking</p>
        </div>
        <router-link to="/admin/exams" class="text-xs text-zinc-500 hover:text-zinc-900 font-medium">Manage All →</router-link>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-zinc-100 text-zinc-400">
              <th class="pb-2.5 font-medium">Exam Code & Title</th>
              <th class="pb-2.5 font-medium">Status</th>
              <th class="pb-2.5 font-medium">Duration</th>
              <th class="pb-2.5 font-medium">Questions</th>
              <th class="pb-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-gray-1">
            <tr v-if="exams.length === 0">
              <td colspan="5" class="py-8 text-center text-xs text-zinc-400">No exams found in database.</td>
            </tr>
            <tr v-for="exam in exams" :key="exam.id" class="group hover:bg-surface-gray-1">
              <td class="py-3 font-medium text-zinc-900">
                <div class="flex flex-col">
                  <span>{{ exam.title }}</span>
                  <span class="text-3xs text-zinc-400 font-mono">{{ exam.code }}</span>
                </div>
              </td>
              <td class="py-3">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-3xs font-medium"
                  :class="[
                    exam.status === 'LIVE' ? 'bg-surface-red-2 text-ink-red-3' : 'bg-surface-blue-1 text-ink-blue-3'
                  ]"
                >
                  <span v-if="exam.status === 'LIVE'" class="h-1.5 w-1.5 rounded-full bg-surface-red-3 animate-ping"></span>
                  {{ exam.status }}
                </span>
              </td>
              <td class="py-3 text-zinc-600">{{ exam.durationMinutes }} mins</td>
              <td class="py-3 text-zinc-600">{{ exam._count?.questions || 0 }} items</td>
              <td class="py-3 text-right">
                <router-link
                  v-if="exam.status === 'LIVE'"
                  :to="'/admin/proctoring?exam=' + exam.id"
                  class="rounded-md border border-outline-gray-2 px-2.5 py-1 text-3xs font-medium text-zinc-600 hover:bg-surface-gray-2 transition-colors"
                >
                  Watch Feeds
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { examService, evaluationService } from '../../api/services'

const exams = ref([])
const pendingCount = ref(0)
const loading = ref(true)

const liveCount = computed(() => exams.value.filter((e) => e.status === 'LIVE').length)

onMounted(async () => {
  try {
    const [examsRes, evalRes] = await Promise.all([
      examService.getExams(),
      evaluationService.getPendingEvaluations().catch(() => ({ pendingEvaluations: [] })),
    ])

    exams.value = examsRes.exams || []
    pendingCount.value = evalRes.pendingEvaluations?.length || 0
  } catch (err) {
    console.error('Failed to load dashboard metrics:', err)
  } finally {
    loading.value = false
  }
})
</script>
