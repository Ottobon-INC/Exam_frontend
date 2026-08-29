<template>
  <div class="space-y-6">
    <!-- Header with Pending Evaluation Counter -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-ink-gray-9">Evaluation Desk & Candidate Audit</h1>
        <p class="text-xs text-ink-gray-5">Comprehensive candidate review: question-by-question scoring, anti-cheat violation flags, and direct result publication.</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="rounded-full bg-surface-blue-1 border border-outline-blue-1 px-3 py-1 text-xs font-semibold text-ink-blue-3">
          {{ attempts.length }} Candidate Submissions
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12 text-xs text-ink-gray-5">
      Loading evaluation candidates and telemetry audit records...
    </div>

    <!-- Empty State -->
    <div v-else-if="attempts.length === 0" class="rounded-xl border border-outline-gray-1 bg-surface-white p-12 text-center text-xs text-ink-gray-5">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-green-2 text-ink-green-3">
        ✓
      </div>
      <h3 class="text-sm font-bold text-ink-gray-9">Evaluation Queue Clear</h3>
      <p class="mt-1 text-xs text-ink-gray-5">No submitted candidate attempts waiting for evaluation.</p>
    </div>

    <!-- Main Evaluation Workspace (Split View) -->
    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Left Column: Candidate List (4 cols) -->
      <div class="flex flex-col rounded-xl border border-outline-gray-1 bg-surface-white p-4 shadow-xs lg:col-span-4">
        <h2 class="text-xs font-semibold text-ink-gray-9 uppercase tracking-wider mb-3">Submitted Candidates</h2>
        <div class="space-y-2.5 overflow-y-auto max-h-[75vh]">
          <div
            v-for="att in attempts"
            :key="att.id"
            @click="selectCandidate(att)"
            class="cursor-pointer rounded-xl border p-3.5 transition-all text-xs"
            :class="[
              selectedAttempt?.id === att.id
                ? 'border-ink-gray-9 bg-surface-gray-2 shadow-xs'
                : 'border-outline-gray-1 bg-surface-white hover:bg-surface-gray-1 hover:border-outline-gray-2'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-ink-gray-9 text-sm">{{ att.candidate?.name || 'Candidate' }}</span>
              <span class="font-mono text-3xs font-semibold text-ink-gray-5">{{ att.exam?.code }}</span>
            </div>

            <div class="mt-1 flex items-center justify-between text-2xs text-ink-gray-6">
              <span class="font-mono">{{ att.candidate?.rollNumber || 'CANDIDATE' }}</span>
              <span class="text-3xs text-ink-gray-4">{{ new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>

            <div class="mt-2.5 flex items-center justify-between border-t border-outline-gray-1 pt-2 text-2xs">
              <!-- Score Badge -->
              <span class="font-semibold text-ink-gray-9">
                Score: <span class="text-ink-blue-3 font-mono text-xs font-bold">{{ att.totalScore }}</span> / {{ att.exam?.total_marks }} pts
              </span>

              <!-- Proctor Flags Indicator -->
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-bold font-mono"
                :class="att.violationsCount > 0 ? 'bg-surface-red-2 text-ink-red-3' : 'bg-surface-green-1 text-ink-green-3'"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="att.violationsCount > 0 ? 'bg-surface-red-3 animate-ping' : 'bg-surface-green-3'"></span>
                {{ att.violationsCount > 0 ? `${att.violationsCount} Flags` : 'Clean' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Candidate Audit, Questions Scoring & Direct Result Dispatch (8 cols) -->
      <div v-if="selectedAttempt" class="flex flex-col rounded-xl border border-outline-gray-1 bg-surface-white shadow-xs lg:col-span-8 overflow-hidden">
        
        <!-- Candidate Overview & Direct Result Sender Banner -->
        <div class="border-b border-outline-gray-1 bg-surface-gray-1 p-5">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-ink-gray-9">{{ selectedAttempt.candidate?.name }}</h2>
                <span class="rounded bg-surface-gray-3 px-2 py-0.5 text-3xs font-mono text-ink-gray-8">Roll: {{ selectedAttempt.candidate?.rollNumber || 'N/A' }}</span>
                <span class="rounded bg-surface-gray-2 px-2 py-0.5 text-3xs text-ink-gray-6">{{ selectedAttempt.candidate?.email }}</span>
              </div>
              <p class="mt-1 text-xs text-ink-gray-6">{{ selectedAttempt.exam?.title }} ({{ selectedAttempt.exam?.code }})</p>
            </div>

            <!-- Total Score & Direct Release Button -->
            <div class="flex items-center gap-3">
              <div class="rounded-xl border border-outline-gray-2 bg-surface-white px-3 py-1.5 text-center shadow-xs">
                <span class="text-3xs text-ink-gray-4 uppercase font-medium block">Total Score</span>
                <span class="text-base font-bold text-ink-blue-3 font-mono">{{ selectedAttempt.totalScore }} / {{ selectedAttempt.exam?.total_marks }}</span>
              </div>

              <!-- Direct Result Send Button -->
              <button
                @click="sendResultDirectly"
                :disabled="releasing"
                class="flex items-center gap-1.5 rounded-xl bg-ink-green-3 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>{{ releasing ? 'Releasing...' : 'Send Result to Candidate' }}</span>
              </button>
            </div>
          </div>

          <!-- Anti-Cheat Violation Flags Box -->
          <div class="mt-4 rounded-xl border p-3.5" :class="selectedAttempt.violationsCount > 0 ? 'border-outline-red-2 bg-surface-red-1' : 'border-outline-green-1 bg-surface-green-1'">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold" :class="selectedAttempt.violationsCount > 0 ? 'text-ink-red-3' : 'text-ink-green-3'">
                  {{ selectedAttempt.violationsCount > 0 ? `⚠️ Anti-Cheat Telemetry Flags (${selectedAttempt.violationsCount} Detected)` : '✓ Proctoring Telemetry: Clean Session' }}
                </span>
              </div>
            </div>

            <!-- Violation Details List -->
            <div v-if="selectedAttempt.violations?.length" class="mt-2 space-y-1.5">
              <div
                v-for="v in selectedAttempt.violations"
                :key="v.id"
                class="flex items-center justify-between rounded-lg bg-surface-white/80 p-2 text-2xs border border-outline-red-1"
              >
                <div class="flex items-center gap-2">
                  <span class="rounded bg-surface-red-3 text-white px-1.5 py-0.2 font-mono text-3xs font-semibold">{{ v.eventType }}</span>
                  <span class="text-ink-gray-8">{{ v.details || 'Window lost focus / Tab switch' }}</span>
                </div>
                <span class="font-mono text-3xs text-ink-gray-5">{{ new Date(v.createdAt).toLocaleTimeString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Question-by-Question Detailed Scoring & Answer Review -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4 max-h-[60vh]">
          <h3 class="text-xs font-bold text-ink-gray-9 uppercase tracking-wider">Candidate Answers & Scoring</h3>

          <div v-if="selectedAttempt.answers?.length === 0" class="text-xs text-ink-gray-5 py-4 text-center">
            No question responses recorded for this attempt.
          </div>

          <div
            v-for="(ans, idx) in selectedAttempt.answers"
            :key="ans.id"
            class="rounded-xl border border-outline-gray-1 bg-surface-white p-4 shadow-xs space-y-3"
          >
            <!-- Question Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2 text-2xs">
                  <span class="rounded bg-surface-gray-2 px-2 py-0.5 font-bold text-ink-gray-9">Question {{ idx + 1 }}</span>
                  <span class="rounded bg-surface-gray-1 px-1.5 py-0.2 border border-outline-gray-1 font-mono text-3xs">{{ ans.question?.type || 'MCQ' }}</span>
                  <span class="text-ink-gray-5">• {{ ans.question?.topic }}</span>
                  <span class="text-ink-gray-5">• Max {{ ans.question?.points }} pts</span>
                </div>
                <p class="text-xs font-semibold text-ink-gray-9 leading-relaxed">{{ ans.question?.statement }}</p>
              </div>

              <!-- Score Pill -->
              <span
                class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                :class="ans.scoreAwarded !== null && ans.scoreAwarded > 0 ? 'bg-surface-green-1 text-ink-green-3 border border-outline-green-1' : 'bg-surface-amber-1 text-ink-amber-3 border border-outline-amber-2'"
              >
                {{ ans.scoreAwarded !== null ? `${ans.scoreAwarded} / ${ans.question?.points} pts` : `Ungraded` }}
              </span>
            </div>

            <!-- Candidate Response Display -->
            <div class="rounded-lg border border-outline-gray-1 bg-surface-gray-1 p-3 text-xs">
              <span class="text-3xs text-ink-gray-5 font-bold uppercase block mb-1">Candidate Answer:</span>
              
              <!-- Subjective Essay Response -->
              <div v-if="ans.textAnswer" class="font-mono text-xs text-ink-gray-9 leading-relaxed whitespace-pre-wrap">
                {{ ans.textAnswer }}
              </div>
              
              <!-- MCQ Option Choice -->
              <div v-else-if="ans.selectedOption !== null && ans.selectedOption !== undefined" class="flex items-center gap-2 flex-wrap">
                <span class="rounded bg-surface-white border border-outline-gray-2 px-2 py-0.5 font-bold text-ink-gray-9">
                  {{ formatOptionChoice(ans.selectedOption, ans.question?.options).label }}
                </span>
                <span class="text-ink-gray-8">{{ formatOptionChoice(ans.selectedOption, ans.question?.options).text }}</span>
              </div>

              <div v-else class="text-ink-gray-4 italic text-2xs">
                No answer provided by candidate.
              </div>
            </div>

            <!-- In-Place Score Input & Remarks -->
            <div class="flex flex-col sm:flex-row items-end gap-3 pt-1">
              <div class="w-full sm:w-36">
                <label class="mb-1 block text-3xs font-semibold text-ink-gray-6">Award Points (0 - {{ ans.question?.points }})</label>
                <input
                  v-model.number="ans.editScore"
                  type="number"
                  min="0"
                  :max="ans.question?.points"
                  class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-2.5 py-1.5 text-xs font-bold text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
                />
              </div>

              <div class="w-full sm:flex-1">
                <label class="mb-1 block text-3xs font-semibold text-ink-gray-6">Evaluator Remarks / Rationale</label>
                <input
                  v-model="ans.editRemarks"
                  type="text"
                  class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-2.5 py-1.5 text-xs text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
                  placeholder="e.g. Accurate implementation and time complexity."
                />
              </div>

              <button
                @click="saveQuestionScore(ans)"
                class="shrink-0 rounded-lg bg-ink-gray-9 px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity shadow-xs"
              >
                Save Score
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { evaluationService } from '../../api/services'

const attempts = ref([])
const selectedAttempt = ref(null)
const loading = ref(true)
const releasing = ref(false)

const loadEvaluations = async () => {
  loading.value = true
  try {
    const res = await evaluationService.getPendingEvaluations()
    attempts.value = res.attempts || []
    if (attempts.value.length > 0) {
      // Retain selection if exists or pick first
      if (selectedAttempt.value) {
        const found = attempts.value.find((a) => a.id === selectedAttempt.value.id)
        if (found) selectCandidate(found)
        else selectCandidate(attempts.value[0])
      } else {
        selectCandidate(attempts.value[0])
      }
    } else {
      selectedAttempt.value = null
    }
  } catch (err) {
    console.error('Failed to load evaluation attempts:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEvaluations()
})

const formatOptionChoice = (selectedOption, options = []) => {
  if (selectedOption === null || selectedOption === undefined) return { label: '', text: '' }
  const str = String(selectedOption).trim()
  if (!str) return { label: '', text: '' }

  // 1. Single letter ("A", "B", "C", "D")
  if (str.length === 1 && str.toUpperCase() >= 'A' && str.toUpperCase() <= 'Z') {
    const letter = str.toUpperCase()
    const idx = letter.charCodeAt(0) - 65
    const text = (Array.isArray(options) && options[idx]) ? options[idx] : str
    return { label: `Option ${letter}`, text }
  }

  // 2. Index number ("0", "1", "2", "3")
  if (!isNaN(str) && Number(str) >= 0 && Number(str) < 26 && String(Number(str)) === str) {
    const idx = Number(str)
    const letter = String.fromCharCode(65 + idx)
    const text = (Array.isArray(options) && options[idx]) ? options[idx] : str
    return { label: `Option ${letter}`, text }
  }

  // 3. Full option text (e.g. "Keystone: 5 hrs...")
  if (Array.isArray(options) && options.length > 0) {
    const matchIdx = options.findIndex(opt => String(opt).trim().toLowerCase() === str.toLowerCase())
    if (matchIdx >= 0) {
      const letter = String.fromCharCode(65 + matchIdx)
      return { label: `Option ${letter}`, text: options[matchIdx] }
    }
  }

  return { label: 'Selected Answer', text: str }
}

const selectCandidate = (att) => {
  selectedAttempt.value = att
  // Initialize editable fields for each answer
  if (selectedAttempt.value.answers) {
    selectedAttempt.value.answers.forEach((ans) => {
      ans.editScore = ans.scoreAwarded !== null ? ans.scoreAwarded : (ans.question?.points || 0)
      ans.editRemarks = ans.evaluatorRemarks || ''
    })
  }
}

const saveQuestionScore = async (ans) => {
  try {
    await evaluationService.submitEvaluation(ans.id, ans.editScore, ans.editRemarks)
    ans.scoreAwarded = ans.editScore
    ans.evaluatorRemarks = ans.editRemarks
    alert('Question score saved and candidate total recalculated!')
    await loadEvaluations()
  } catch (err) {
    alert(err.message || 'Failed to update score.')
  }
}

const sendResultDirectly = async () => {
  if (!selectedAttempt.value) return
  if (!confirm(`Are you sure you want to release the final result of ${selectedAttempt.value.totalScore} pts to ${selectedAttempt.value.candidate?.name}?`)) {
    return
  }

  releasing.value = true
  try {
    await evaluationService.releaseCandidateResult(selectedAttempt.value.id)
    alert(`🎉 Result successfully sent directly to ${selectedAttempt.value.candidate?.name}! The candidate can now view their official score report on their portal.`)
    await loadEvaluations()
  } catch (err) {
    alert(err.message || 'Failed to release result to candidate.')
  } finally {
    releasing.value = false
  }
}
</script>
