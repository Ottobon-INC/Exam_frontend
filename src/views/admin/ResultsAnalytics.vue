<template>
  <div class="space-y-6">
    <!-- Header with Publish Controls -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-ink-gray-9">Results & Cohort Analytics</h1>
        <p class="text-xs text-ink-gray-5">Score distributions, percentile cutoffs, candidate leaderboards, and publication to candidate portals.</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Exam Selector -->
        <select
          v-model="selectedExamId"
          @change="fetchResults"
          class="rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs font-semibold text-ink-gray-8 focus:border-outline-gray-5 focus:outline-none"
        >
          <option v-for="ex in examsList" :key="ex.id" :value="ex.id">
            {{ ex.code }} • {{ ex.title }}
          </option>
        </select>

        <!-- Publish Results Toggle Switch -->
        <div v-if="resultData?.exam" class="flex items-center gap-2 rounded-xl border border-outline-gray-2 bg-surface-white px-3 py-2 shadow-xs">
          <span class="text-xs font-semibold" :class="isPublished ? 'text-ink-green-3' : 'text-ink-gray-6'">
            {{ isPublished ? '● Published to Students' : '○ Private / Hidden' }}
          </span>
          <button
            @click="togglePublish"
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="isPublished ? 'bg-surface-green-3' : 'bg-surface-gray-3'"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="isPublished ? 'translate-x-4' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-xs text-ink-gray-5">
      Loading cohort analytics and leaderboard rankings...
    </div>

    <div v-else-if="!resultData" class="rounded-xl border border-outline-gray-1 bg-surface-white p-12 text-center text-xs text-ink-gray-5">
      Select an examination above to view results and candidate leaderboards.
    </div>

    <div v-else class="space-y-6">
      <!-- Analytics Cards Row -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-outline-gray-1 bg-surface-white p-4 shadow-xs">
          <span class="text-xs text-ink-gray-5">Total Test Takers</span>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-2xl font-bold text-ink-gray-9">{{ resultData.analytics?.totalTakers || 0 }}</span>
            <span class="text-xs text-ink-green-3 font-medium">Completed Attempts</span>
          </div>
        </div>

        <div class="rounded-xl border border-outline-gray-1 bg-surface-white p-4 shadow-xs">
          <span class="text-xs text-ink-gray-5">Average Score</span>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-2xl font-bold text-ink-gray-9">{{ resultData.analytics?.avgScore || 0 }} pts</span>
            <span class="text-xs text-ink-gray-4">Out of {{ resultData.exam?.totalMarks }}</span>
          </div>
        </div>

        <div class="rounded-xl border border-outline-gray-1 bg-surface-white p-4 shadow-xs">
          <span class="text-xs text-ink-gray-5">Top Score</span>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-2xl font-bold text-ink-blue-3">{{ resultData.analytics?.maxScore || 0 }} pts</span>
            <span class="text-xs text-ink-gray-4">Highest achieved</span>
          </div>
        </div>

        <div class="rounded-xl border border-outline-gray-1 bg-surface-white p-4 shadow-xs">
          <span class="text-xs text-ink-gray-5">Pass Rate (Cutoff: {{ resultData.exam?.passMarks }} pts)</span>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-2xl font-bold text-ink-green-3">{{ resultData.analytics?.passRate || 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- Candidate Performance Leaderboard Table -->
      <div class="rounded-xl border border-outline-gray-1 bg-surface-white shadow-xs overflow-hidden">
        <div class="flex items-center justify-between border-b border-outline-gray-1 p-4">
          <div>
            <h2 class="text-sm font-semibold text-ink-gray-9">Candidate Leaderboard & Percentiles</h2>
            <p class="text-xs text-ink-gray-4">{{ resultData.exam?.title }} ({{ resultData.exam?.code }})</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="border-b border-outline-gray-1 bg-surface-gray-1 text-ink-gray-5">
              <tr>
                <th class="py-3 px-4 font-medium w-16">Rank</th>
                <th class="py-3 px-4 font-medium">Candidate Name</th>
                <th class="py-3 px-4 font-medium">Roll Number</th>
                <th class="py-3 px-4 font-medium">Score</th>
                <th class="py-3 px-4 font-medium">Percentile</th>
                <th class="py-3 px-4 font-medium">Status</th>
                <th class="py-3 px-4 text-right font-medium">Proctor Flags</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-gray-1">
              <tr v-if="resultData.leaderboard?.length === 0">
                <td colspan="7" class="py-8 text-center text-xs text-ink-gray-4">No completed submissions recorded yet.</td>
              </tr>
              <tr v-for="c in resultData.leaderboard" :key="c.id" class="hover:bg-surface-gray-1 transition-colors">
                <td class="py-3 px-4 font-bold text-ink-gray-9">#{{ c.rank }}</td>
                <td class="py-3 px-4 font-medium text-ink-gray-9">{{ c.candidate?.name }}</td>
                <td class="py-3 px-4 font-mono text-3xs text-ink-gray-5">{{ c.candidate?.rollNumber || 'N/A' }}</td>
                <td class="py-3 px-4 font-semibold text-ink-gray-9">{{ c.totalScore }} / {{ resultData.exam?.totalMarks }}</td>
                <td class="py-3 px-4 font-mono text-ink-gray-8">{{ c.percentile }}%ile</td>
                <td class="py-3 px-4">
                  <span
                    class="rounded-full px-2 py-0.5 text-3xs font-semibold"
                    :class="(c.totalScore || 0) >= resultData.exam?.passMarks ? 'bg-surface-green-2 text-ink-green-3' : 'bg-surface-red-2 text-ink-red-3'"
                  >
                    {{ (c.totalScore || 0) >= resultData.exam?.passMarks ? 'Passed' : 'Needs Review' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <span
                    class="rounded px-1.5 py-0.5 text-3xs font-mono"
                    :class="c.violations > 0 ? 'bg-surface-red-2 text-ink-red-3 font-semibold' : 'text-ink-gray-4'"
                  >
                    {{ c.violations > 0 ? c.violations + ' Flags' : 'Clean' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { examService, resultService } from '../../api/services'

const examsList = ref([])
const selectedExamId = ref('')
const resultData = ref(null)
const isPublished = ref(false)
const loading = ref(true)

const loadInitial = async () => {
  loading.value = true
  try {
    const examsRes = await examService.getExams()
    examsList.value = examsRes.exams || []
    if (examsList.value.length > 0) {
      selectedExamId.value = examsList.value[0].id
      await fetchResults()
    }
  } catch (err) {
    console.error('Failed to load exams list:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInitial()
})

const fetchResults = async () => {
  if (!selectedExamId.value) return
  loading.value = true
  try {
    const res = await resultService.getResults(selectedExamId.value)
    resultData.value = res
    isPublished.value = Boolean(res.exam?.publishedResults)
  } catch (err) {
    console.error('Failed to load exam results:', err)
    resultData.value = null
  } finally {
    loading.value = false
  }
}

const togglePublish = async () => {
  try {
    const targetState = !isPublished.value
    await resultService.togglePublish(selectedExamId.value, targetState)
    isPublished.value = targetState
  } catch (err) {
    alert(err.message || 'Failed to toggle publication status.')
  }
}
</script>
