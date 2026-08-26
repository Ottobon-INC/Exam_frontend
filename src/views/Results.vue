<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from 'frappe-ui'
import { resultService } from '../api/services'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const resultData = ref({})
const errorMessage = ref('')
const isPending = ref(false)
const user = ref(JSON.parse(localStorage.getItem('candidate_user') || '{}'))

onMounted(async () => {
  try {
    const res = await resultService.getResults(route.params.id)
    if (res.isPendingEvaluation) {
      isPending.value = true
      resultData.value = res
    } else {
      resultData.value = res
    }
  } catch (err) {
    errorMessage.value = err.message || 'Results are not yet available.'
  } finally {
    loading.value = false
  }
})

const overallPassed = computed(() => {
  const att = resultData.value?.candidateAttempt
  if (!att) return false
  const scoreOk = att.totalScore >= (resultData.value?.exam?.passMarks || 0)
  const sectionalOk = att.sectionalPass !== false
  return scoreOk && sectionalOk
})

const sectionBreakdown = computed(() => resultData.value?.candidateAttempt?.sectionBreakdown || [])

const hasSections = computed(() => sectionBreakdown.value.length > 0)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-gray-1 p-4">

    <!-- Loading -->
    <div v-if="loading" class="text-xs text-ink-gray-5">Loading results...</div>

    <!-- Case 1: Pending Evaluation -->
    <div v-else-if="isPending" class="w-full max-w-md rounded-xl border border-outline-gray-1 bg-surface-white p-8 text-center shadow-sm">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-amber-2 text-ink-amber-3">
        <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="inline-flex items-center gap-1.5 rounded-full bg-surface-green-2 px-3 py-1 text-xs font-semibold text-ink-green-3 mb-3">
        ✓ Submission Received
      </div>
      <h2 class="mt-2 text-lg font-bold text-ink-gray-9">Exam Completed Successfully</h2>
      <p class="mt-2 text-xs text-ink-gray-6 leading-relaxed">
        {{ resultData.message || 'Your submission is under review. We will notify you with your score report.' }}
      </p>
      <div class="mt-6 rounded-xl border border-outline-gray-1 bg-surface-gray-1 p-4 text-left text-2xs space-y-2">
        <div class="flex justify-between"><span class="text-ink-gray-5">Exam Code:</span><span class="font-mono font-semibold text-ink-gray-9">{{ resultData.exam?.code }}</span></div>
        <div class="flex justify-between"><span class="text-ink-gray-5">Examination:</span><span class="font-medium text-ink-gray-8 truncate max-w-[200px]">{{ resultData.exam?.title }}</span></div>
        <div class="flex justify-between"><span class="text-ink-gray-5">Candidate:</span><span class="font-medium text-ink-gray-9">{{ user.name }}</span></div>
        <div class="flex justify-between"><span class="text-ink-gray-5">Submitted At:</span><span class="font-mono text-ink-gray-7">{{ new Date(resultData.attempt?.submittedAt || Date.now()).toLocaleTimeString() }}</span></div>
        <div class="flex justify-between border-t border-outline-gray-2 pt-2"><span class="text-ink-gray-5">Status:</span><span class="font-semibold text-ink-amber-3">Under Evaluation</span></div>
      </div>
      <div class="mt-6"><Button variant="solid" theme="gray" class="w-full" label="Return to Dashboard" @click="router.push('/dashboard')" /></div>
    </div>

    <!-- Case 2: Results not released -->
    <div v-else-if="errorMessage" class="w-full max-w-md rounded-xl border border-outline-gray-1 bg-surface-white p-8 text-center shadow-sm">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-amber-2 text-ink-amber-3">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-base font-semibold text-ink-gray-9">Results Pending Release</h2>
      <p class="mt-1.5 text-xs text-ink-gray-5">{{ errorMessage }}</p>
      <Button variant="solid" theme="gray" class="mt-6" label="Return to Dashboard" @click="router.push('/dashboard')" />
    </div>

    <!-- Case 3: Full Score Report -->
    <div v-else class="w-full max-w-2xl rounded-xl border border-outline-gray-2 bg-surface-white shadow-sm overflow-hidden">

      <!-- Result header -->
      <div class="border-b border-outline-gray-1 p-6 text-center">
        <div
          class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
          :class="overallPassed ? 'bg-surface-green-2 text-ink-green-3' : 'bg-surface-red-2 text-ink-red-3'"
        >
          <svg v-if="overallPassed" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-ink-gray-9">Official Examination Score Report</h1>
        <p class="mt-1 text-xs text-ink-gray-5">{{ resultData.exam?.title }} ({{ resultData.exam?.code }})</p>

        <!-- Score summary chip -->
        <div v-if="resultData.candidateAttempt" class="mt-4 inline-flex items-center gap-3 rounded-xl border border-outline-gray-2 bg-surface-gray-1 px-4 py-2 text-xs">
          <div>
            <span class="text-3xs text-ink-gray-4 uppercase font-medium block">Your Score</span>
            <span class="text-base font-bold text-ink-gray-9">{{ resultData.candidateAttempt.totalScore }} / {{ resultData.exam?.totalMarks }}</span>
          </div>
          <div class="h-6 w-px bg-outline-gray-2"></div>
          <div>
            <span class="text-3xs text-ink-gray-4 uppercase font-medium block">Result</span>
            <span class="font-bold text-xs" :class="overallPassed ? 'text-ink-green-3' : 'text-ink-red-3'">
              {{ overallPassed ? 'PASSED' : 'DID NOT PASS' }}
            </span>
          </div>
          <div v-if="hasSections" class="h-6 w-px bg-outline-gray-2"></div>
          <div v-if="hasSections">
            <span class="text-3xs text-ink-gray-4 uppercase font-medium block">Sectional</span>
            <span class="font-bold text-xs" :class="resultData.candidateAttempt.sectionalPass !== false ? 'text-ink-green-3' : 'text-ink-red-3'">
              {{ resultData.candidateAttempt.sectionalPass !== false ? 'All Cutoffs Met' : 'Cutoff Failed' }}
            </span>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-6">

        <!-- Sectional Breakdown -->
        <div v-if="hasSections">
          <h3 class="text-xs font-bold text-ink-gray-9 uppercase tracking-wider mb-3">Section-wise Performance</h3>
          <div class="rounded-xl border border-outline-gray-1 overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-surface-gray-1 text-ink-gray-5 border-b border-outline-gray-1">
                <tr>
                  <th class="py-2.5 px-3 font-medium">Section</th>
                  <th class="py-2.5 px-3 font-medium">Your Score</th>
                  <th class="py-2.5 px-3 font-medium">Max</th>
                  <th class="py-2.5 px-3 font-medium">Cutoff</th>
                  <th class="py-2.5 px-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-gray-1">
                <tr v-for="s in sectionBreakdown" :key="s.sectionId" class="hover:bg-surface-gray-1">
                  <td class="py-2.5 px-3 font-semibold text-ink-gray-9">{{ s.name }}</td>
                  <td class="py-2.5 px-3 font-bold text-ink-gray-9">{{ s.score }}</td>
                  <td class="py-2.5 px-3 text-ink-gray-5">{{ s.maxScore }}</td>
                  <td class="py-2.5 px-3 text-ink-gray-6">
                    <span v-if="s.cutoffMarks > 0">{{ s.cutoffMarks }}</span>
                    <span v-else class="text-ink-gray-4">—</span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-semibold"
                      :class="s.cutoffMet ? 'bg-surface-green-2 text-ink-green-3' : 'bg-surface-red-2 text-ink-red-3'"
                    >
                      {{ s.cutoffMet ? '✓ Passed' : '✗ Failed' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Sectional fail note -->
          <p v-if="resultData.candidateAttempt?.sectionalPass === false" class="mt-2 text-xs text-ink-red-3">
            ⚠ You did not meet the minimum cutoff in one or more sections, resulting in a non-pass outcome.
          </p>
        </div>

        <!-- Analytics -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <div class="rounded-xl border border-outline-gray-1 bg-surface-gray-1 p-3">
            <span class="text-3xs text-ink-gray-4 uppercase font-medium">Cohort Avg</span>
            <div class="mt-1 text-lg font-bold text-ink-gray-9">{{ resultData.analytics?.avgScore }} pts</div>
          </div>
          <div class="rounded-xl border border-outline-gray-1 bg-surface-gray-1 p-3">
            <span class="text-3xs text-ink-gray-4 uppercase font-medium">Top Score</span>
            <div class="mt-1 text-lg font-bold text-ink-blue-3">{{ resultData.analytics?.maxScore }} pts</div>
          </div>
          <div class="rounded-xl border border-outline-gray-1 bg-surface-gray-1 p-3">
            <span class="text-3xs text-ink-gray-4 uppercase font-medium">Pass Cutoff</span>
            <div class="mt-1 text-lg font-bold text-ink-gray-9">{{ resultData.exam?.passMarks }} pts</div>
          </div>
          <div class="rounded-xl border border-outline-gray-1 bg-surface-gray-1 p-3">
            <span class="text-3xs text-ink-gray-4 uppercase font-medium">Pass Rate</span>
            <div class="mt-1 text-lg font-bold text-ink-green-3">{{ resultData.analytics?.passRate }}%</div>
          </div>
        </div>

        <!-- Leaderboard -->
        <div v-if="resultData.leaderboard?.length">
          <h3 class="text-xs font-bold text-ink-gray-9 uppercase tracking-wider mb-3">Leaderboard & Cohort Percentiles</h3>
          <div class="rounded-xl border border-outline-gray-1 overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-surface-gray-1 text-ink-gray-5 border-b border-outline-gray-1">
                <tr>
                  <th class="py-2.5 px-3 font-medium">Rank</th>
                  <th class="py-2.5 px-3 font-medium">Candidate</th>
                  <th class="py-2.5 px-3 font-medium">Score</th>
                  <th class="py-2.5 px-3 font-medium">Result</th>
                  <th class="py-2.5 px-3 text-right font-medium">Percentile</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-gray-1">
                <tr
                  v-for="c in resultData.leaderboard"
                  :key="c.id"
                  class="hover:bg-surface-gray-1"
                  :class="c.candidateId === user.id ? 'bg-surface-blue-1/50 font-semibold' : ''"
                >
                  <td class="py-2.5 px-3 font-bold text-ink-gray-9">#{{ c.rank }}</td>
                  <td class="py-2.5 px-3 text-ink-gray-8">
                    {{ c.candidate?.name }} ({{ c.candidate?.rollNumber || 'N/A' }})
                    <span v-if="c.candidateId === user.id" class="ml-1 rounded bg-ink-gray-9 text-white px-1.5 py-0.5 text-3xs font-medium">You</span>
                  </td>
                  <td class="py-2.5 px-3 font-semibold text-ink-gray-9">{{ c.totalScore }} pts</td>
                  <td class="py-2.5 px-3">
                    <span class="rounded-full px-2 py-0.5 text-3xs font-semibold" :class="c.passed ? 'bg-surface-green-2 text-ink-green-3' : 'bg-surface-red-1 text-ink-red-3'">
                      {{ c.passed ? 'Pass' : 'Fail' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-ink-gray-7">{{ c.percentile }}%ile</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="border-t border-outline-gray-1 p-4 flex justify-end">
        <Button variant="solid" theme="gray" label="Back to Dashboard" @click="router.push('/dashboard')" />
      </div>
    </div>
  </div>
</template>