<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from 'frappe-ui'
import { attemptService } from '../api/services'
import { initProctorSocket } from '../api/socket'

const router = useRouter()
const route = useRoute()

const videoRef = ref(null)
const attemptId = ref(null)
const exam = ref(null)
const sections = ref([])           // [{id, name, cutoffMarks, questions:[]}]
const unsectionedQuestions = ref([])
const activeSectionIdx = ref(0)
const currentQuestionIndex = ref(0)
const answers = ref({})
const markedForReview = ref({})
const timeLeft = ref(60 * 60)
const loading = ref(true)
const stream = ref(null)
const user = ref(JSON.parse(localStorage.getItem('candidate_user') || '{}'))

// Full Screen Enforcement State
const isFullScreen = ref(true)
const isTerminated = ref(false)
const terminationReason = ref('')
const violationWarnings = ref(0)
const showWarningModal = ref(false)
const warningMessage = ref('')
const showSubmitConfirmModal = ref(false)


let timerInterval = null
let socket = null
let autoSaveTimeout = null
let captureAndSendSnapshot = () => {}

// ─── Derived: current section questions list ──────────────────────────────────
const allSectionTabs = computed(() => {
  const tabs = sections.value.map((s) => ({
    id: s.id,
    name: s.name,
    cutoffMarks: s.cutoffMarks,
    questions: s.questions || [],
  }))
  if (unsectionedQuestions.value.length > 0) {
    tabs.push({ id: '__unsectioned__', name: 'General', cutoffMarks: 0, questions: unsectionedQuestions.value })
  }
  return tabs
})

const hasSections = computed(() => allSectionTabs.value.length > 0)

const currentSectionTab = computed(() => allSectionTabs.value[activeSectionIdx.value] || null)

const currentSectionQuestions = computed(() => currentSectionTab.value?.questions || [])

const currentQuestion = computed(() => currentSectionQuestions.value[currentQuestionIndex.value] || null)

const allQuestions = computed(() => allSectionTabs.value.flatMap((s) => s.questions))

// Progress per section tab
const sectionProgress = (tab) => {
  const qs = tab.questions || []
  const answered = qs.filter((q) => answers.value[q.id] !== undefined && answers.value[q.id] !== null && answers.value[q.id] !== '').length
  return { answered, total: qs.length }
}

const globalQuestionNumber = computed(() => {
  let offset = 0
  for (let i = 0; i < activeSectionIdx.value; i++) {
    offset += allSectionTabs.value[i]?.questions?.length || 0
  }
  return offset + currentQuestionIndex.value + 1
})

const totalQuestions = computed(() => allQuestions.value.length)

// ─── Switch section tab ───────────────────────────────────────────────────────
const requestFullScreen = async () => {
  try {
    const elem = document.documentElement
    if (elem.requestFullscreen) await elem.requestFullscreen()
    else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen()
  } catch (err) {
    console.warn('Fullscreen request prompt:', err)
  }
}

const triggerAntiCheatViolation = async (eventType, baseDetails) => {
  if (isTerminated.value || loading.value || !attemptId.value) return
  
  violationWarnings.value++
  if (attemptId.value) {
    localStorage.setItem(`exam_warnings_${attemptId.value}`, violationWarnings.value.toString())
  }
  
  if (socket && attemptId.value) {
    socket.emit('log_violation', {
      examId: route.params.id,
      attemptId: attemptId.value,
      candidateId: user.value.id,
      eventType: eventType,
      severity: 'HIGH',
      details: `${baseDetails} (Warning ${violationWarnings.value} of 3)`,
    })
  }

  if (violationWarnings.value > 3) {
    isTerminated.value = true
    terminationReason.value = `Security Violation: Multiple unauthorized navigations away from exam (Exceeded 3 warnings).`
    
    // Immediately submit to backend to prevent refresh exploits
    try {
      await attemptService.submitAttempt(attemptId.value)
      markExamAsCompletedLocally()
    } catch (err) {
      console.error('Error auto-submitting on final violation:', err)
    }

    // Delay the redirect so they can read the termination message
    setTimeout(() => {
      router.push(`/results/${route.params.id}`)
    }, 5000)
    
  } else {
    warningMessage.value = `Warning ${violationWarnings.value} of 3: Navigating away from the exam interface is strictly prohibited. Further violations will result in automatic exam termination.`
    showWarningModal.value = true
  }
}

const handleFullScreenChange = async () => {
  const isFS = Boolean(document.fullscreenElement || document.webkitFullscreenElement)
  isFullScreen.value = isFS

  if (!isFS && !isTerminated.value && attemptId.value && !loading.value) {
    await triggerAntiCheatViolation('FULLSCREEN_EXIT', 'Candidate exited Full-Screen mode')
  }
}

const acknowledgeWarning = async () => {
  showWarningModal.value = false
  await requestFullScreen()
}

const switchSection = (idx) => {
  activeSectionIdx.value = idx
  currentQuestionIndex.value = 0
}

onMounted(async () => {
  try {
    const examId = route.params.id
    const res = await attemptService.startAttempt(examId)

    attemptId.value = res.attemptId
    exam.value = res.exam
    
    // Restore warnings from localStorage
    violationWarnings.value = parseInt(localStorage.getItem(`exam_warnings_${res.attemptId}`) || '0')
    
    // If they already exceeded warnings in a previous session, terminate immediately
    if (violationWarnings.value > 3) {
      isTerminated.value = true
      terminationReason.value = `Security Violation: Multiple unauthorized navigations away from exam (Exceeded 3 warnings).`
      setTimeout(() => {
        router.push(`/results/${route.params.id}`)
      }, 3000)
      return
    }

    sections.value = res.exam.sections || []
    unsectionedQuestions.value = res.exam.unsectionedQuestions || []
    timeLeft.value = (res.exam.durationMinutes || 60) * 60

    // Restore saved answers
    if (res.savedAnswers) {
      res.savedAnswers.forEach((ans) => {
        answers.value[ans.questionId] = ans.selectedOption ?? ans.textAnswer ?? null
      })
    }

    // Timer
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        submitExam(true)
      }
    }, 1000)

    loading.value = false

    // Camera
    try {
      stream.value = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
      if (videoRef.value) {
        videoRef.value.srcObject = stream.value
        await videoRef.value.play().catch(() => {})
      }
    } catch (err) {
      console.warn('Camera stream error:', err)
    }

    // WebSocket Proctoring
    socket = initProctorSocket()
    const targetExamId = exam.value?.id || route.params.id

    socket.emit('join_exam', {
      examId: targetExamId,
      role: 'CANDIDATE',
      candidateId: user.value.id,
      candidateName: user.value.name,
      rollNumber: user.value.rollNumber,
    })

    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')

    captureAndSendSnapshot = () => {
      const v = videoRef.value
      if (v && socket) {
        try {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
          const photoData = canvas.toDataURL('image/jpeg', 0.8)
          socket.emit('candidate_frame', {
            examId: targetExamId,
            candidateId: user.value.id,
            candidateName: user.value.name,
            rollNumber: user.value.rollNumber,
            frame: photoData,
            timestamp: new Date().toISOString(),
          })
        } catch (e) {
          console.warn('[Proctoring] Snapshot error:', e)
        }
      }
    }

    if (videoRef.value) {
      videoRef.value.onloadeddata = () => captureAndSendSnapshot()
    }
    setTimeout(captureAndSendSnapshot, 1000)
    setTimeout(captureAndSendSnapshot, 3000)
    setInterval(captureAndSendSnapshot, 30000)

        document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullScreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange)
    requestFullScreen()

    socket.on('proctor_intervention', (data) => {
      if (data.targetCandidateId === user.value.id) {
        if (data.action === 'WARN') alert(`⚠️ PROCTOR WARNING: ${data.message || 'Please look at the camera.'}`)
        else if (data.action === 'PAUSE') alert('⏸️ Your exam has been paused by the proctor.')
      }
    })
  } catch (err) {
    console.error('Failed to initialize attempt:', err)
    alert(err.message || 'Failed to start examination attempt.')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  clearInterval(timerInterval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('fullscreenchange', handleFullScreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullScreenChange)
  if (stream.value) stream.value.getTracks().forEach((t) => t.stop())
})

const handleVisibilityChange = async () => {
  if (document.hidden && !isTerminated.value && attemptId.value && !loading.value) {
    await triggerAntiCheatViolation('TAB_SWITCH', 'Candidate navigated away from exam tab')
  }
}

const handleAnswerChange = (qId, val) => {
  answers.value[qId] = val
  clearTimeout(autoSaveTimeout)
  autoSaveTimeout = setTimeout(() => {
    const q = allQuestions.value.find((item) => item.id === qId)
    const isSubjective = q?.type === 'SUBJECTIVE'
    attemptService.saveAnswer(
      attemptId.value,
      qId,
      !isSubjective ? val : undefined,
      isSubjective ? val : undefined,
    )
  }, 400)
}

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

const markExamAsCompletedLocally = () => {
  const storedCompleted = JSON.parse(localStorage.getItem(`completed_exams_${user.value.id}`) || '[]')
  if (!storedCompleted.includes(route.params.id)) {
    storedCompleted.push(route.params.id)
    localStorage.setItem(`completed_exams_${user.value.id}`, JSON.stringify(storedCompleted))
  }
}

const executeSubmit = async () => {
  try {
    await attemptService.submitAttempt(attemptId.value)
    markExamAsCompletedLocally()
    router.push(`/results/${route.params.id}`)
  } catch (err) {
    alert(err.message || 'Error submitting exam.')
  }
}

const submitExam = async (isAuto = false) => {
  if (isAuto) {
    await executeSubmit()
  } else {
    showSubmitConfirmModal.value = true
  }
}
</script>

<template>
  <div class="flex h-screen flex-col bg-surface-gray-1 text-ink-gray-9">

    <!-- Header -->
    <header class="flex min-h-14 shrink-0 items-center justify-between border-b border-outline-gray-1 bg-surface-white px-4 sm:px-6">
      <div class="flex items-center gap-3">
        <span class="font-mono text-xs font-semibold text-ink-gray-5">{{ exam?.code }}</span>
        <span class="text-ink-gray-3">·</span>
        <span class="font-semibold text-sm text-ink-gray-9 truncate max-w-md">{{ exam?.title || 'Live Assessment' }}</span>
      </div>
      <div class="flex items-center gap-6">
        <div
          class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-mono font-bold"
          :class="timeLeft < 300 ? 'text-ink-red-3 border-outline-red-2 animate-pulse bg-surface-red-1' : 'text-ink-gray-9 border-outline-gray-2 bg-surface-gray-1'"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ formatTime(timeLeft) }}</span>
        </div>
        <Button variant="solid" theme="gray" label="Submit Examination" @click="() => submitExam(false)" />
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-1 items-center justify-center text-xs text-ink-gray-5">
      Initializing proctored assessment workspace...
    </div>

    <div v-else class="flex min-h-0 flex-1 flex-col">

      <!-- Section Tab Bar (only shown when sections exist) -->
      <nav v-if="hasSections" class="flex shrink-0 overflow-x-auto border-b border-outline-gray-1 bg-surface-white px-4">
        <button
          v-for="(tab, idx) in allSectionTabs"
          :key="tab.id"
          @click="switchSection(idx)"
          class="relative flex flex-col items-center gap-0.5 px-5 py-2.5 text-xs font-medium transition-colors shrink-0"
          :class="activeSectionIdx === idx
            ? 'text-ink-gray-9 border-b-2 border-ink-gray-9 -mb-px'
            : 'text-ink-gray-5 hover:text-ink-gray-7'"
        >
          <span>{{ tab.name }}</span>
          <span class="text-3xs font-normal" :class="activeSectionIdx === idx ? 'text-ink-gray-6' : 'text-ink-gray-4'">
            {{ sectionProgress(tab).answered }}/{{ sectionProgress(tab).total }} answered
          </span>
          <!-- Cutoff badge -->
          <span v-if="tab.cutoffMarks > 0" class="absolute -top-0.5 -right-0.5 rounded-full bg-surface-amber-2 px-1 text-3xs text-ink-amber-3 font-semibold leading-tight">
            min {{ tab.cutoffMarks }}
          </span>
        </button>
      </nav>

      <!-- Body -->
      <div class="flex min-h-0 flex-1">

        <!-- Main question canvas -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6">
          <div v-if="currentQuestion" class="mx-auto max-w-3xl rounded-xl border border-outline-gray-1 bg-surface-white p-6 shadow-xs">

            <!-- Question header -->
            <div class="mb-6 flex items-center justify-between border-b border-outline-gray-1 pb-4">
              <div class="flex items-center gap-2">
                <span class="rounded bg-surface-gray-2 px-2 py-0.5 text-xs font-bold text-ink-gray-9">
                  Q{{ globalQuestionNumber }} of {{ totalQuestions }}
                </span>
                <span v-if="hasSections" class="rounded bg-surface-blue-1 px-2 py-0.5 text-xs font-medium text-ink-blue-3">
                  {{ currentSectionTab?.name }}
                </span>
                <span class="text-2xs text-ink-gray-5 font-medium">({{ currentQuestion.points }} pts)</span>
              </div>
              <label class="flex items-center gap-1.5 text-xs text-ink-gray-7 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="markedForReview[currentQuestion.id]"
                  class="rounded border-outline-gray-3 text-ink-gray-9 focus:ring-0"
                />
                <span>Mark for Review</span>
              </label>
            </div>

            <!-- Statement -->
            <div class="mb-8 text-sm font-medium text-ink-gray-9 leading-relaxed whitespace-pre-wrap">
              {{ currentQuestion.statement }}
            </div>

            <!-- MCQ Options -->
            <div v-if="currentQuestion.type !== 'SUBJECTIVE' && currentQuestion.options?.length" class="space-y-3">
              <label
                v-for="(option, idx) in currentQuestion.options"
                :key="idx"
                class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-xs font-medium transition-all"
                :class="[
                  String(answers[currentQuestion.id]) === String(option) || String(answers[currentQuestion.id]) === String(idx)
                    ? 'border-ink-gray-9 bg-surface-gray-2 text-ink-gray-9 font-semibold'
                    : 'border-outline-gray-1 bg-surface-white text-ink-gray-8 hover:bg-surface-gray-1 hover:border-outline-gray-2'
                ]"
              >
                <input
                  type="radio"
                  :name="`q-${currentQuestion.id}`"
                  :value="option"
                  :checked="String(answers[currentQuestion.id]) === String(option) || String(answers[currentQuestion.id]) === String(idx)"
                  @change="handleAnswerChange(currentQuestion.id, option)"
                  class="h-4 w-4 border-outline-gray-3 text-ink-gray-9 focus:ring-0"
                />
                <span>{{ option }}</span>
              </label>
            </div>

            <!-- Subjective -->
            <div v-else>
              <textarea
                :value="answers[currentQuestion.id] || ''"
                @input="handleAnswerChange(currentQuestion.id, $event.target.value)"
                class="w-full rounded-xl border border-outline-gray-2 bg-surface-white p-4 text-xs font-mono text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
                rows="7"
                placeholder="Type your structured solution and technical rationale here..."
              ></textarea>
            </div>

            <!-- Bottom nav -->
            <div class="mt-8 flex items-center justify-between border-t border-outline-gray-1 pt-4">
              <Button
                variant="subtle"
                label="Clear Answer"
                @click="handleAnswerChange(currentQuestion.id, null)"
              />
              <div class="flex gap-2">
                <Button
                  variant="subtle"
                  label="← Previous"
                  :disabled="currentQuestionIndex === 0"
                  @click="currentQuestionIndex--"
                />
                <Button
                  variant="solid"
                  theme="gray"
                  label="Next →"
                  :disabled="currentQuestionIndex === currentSectionQuestions.length - 1"
                  @click="currentQuestionIndex++"
                />
              </div>
            </div>
          </div>

          <!-- Empty section -->
          <div v-else class="mx-auto max-w-3xl rounded-xl border border-dashed border-outline-gray-2 bg-surface-white p-12 text-center text-xs text-ink-gray-4">
            No questions in this section.
          </div>
        </main>

        <!-- Sidebar -->
        <aside class="hidden sm:flex w-72 shrink-0 flex-col border-l border-outline-gray-1 bg-surface-white p-4">

          <!-- Live PIP Camera -->
          <div class="mb-5 rounded-xl border border-outline-gray-2 bg-black overflow-hidden relative shadow-xs aspect-video">
            <video ref="videoRef" class="w-full h-full object-cover" autoplay muted playsinline></video>
            <div class="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/70 px-2 py-0.5 text-3xs font-medium text-white">
              <span class="h-1.5 w-1.5 rounded-full bg-surface-green-3 animate-pulse"></span>
              <span>Live Video Active</span>
            </div>
          </div>

          <!-- Section summary (when sections exist) -->
          <div v-if="hasSections" class="mb-4">
            <div class="text-xs font-bold text-ink-gray-9 uppercase tracking-wider mb-2">Sections</div>
            <div class="space-y-1.5">
              <button
                v-for="(tab, idx) in allSectionTabs"
                :key="tab.id"
                @click="switchSection(idx)"
                class="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors"
                :class="activeSectionIdx === idx ? 'bg-surface-gray-2 text-ink-gray-9 font-semibold' : 'text-ink-gray-6 hover:bg-surface-gray-1'"
              >
                <span>{{ tab.name }}</span>
                <span class="tabular-nums font-medium" :class="sectionProgress(tab).answered === sectionProgress(tab).total ? 'text-ink-green-3' : 'text-ink-gray-5'">
                  {{ sectionProgress(tab).answered }}/{{ sectionProgress(tab).total }}
                </span>
              </button>
            </div>
            <div class="mt-3 border-t border-outline-gray-1 pt-3 text-xs font-bold text-ink-gray-9 uppercase tracking-wider">
              Question Matrix — {{ currentSectionTab?.name }}
            </div>
          </div>
          <div v-else class="text-xs font-bold text-ink-gray-9 uppercase tracking-wider mb-3">Question Matrix</div>

          <!-- Question grid for current section -->
          <div class="grid grid-cols-4 gap-2 overflow-y-auto max-h-56 p-1">
            <button
              v-for="(q, idx) in currentSectionQuestions"
              :key="q.id"
              @click="currentQuestionIndex = idx"
              class="flex h-9 items-center justify-center rounded-lg border text-xs font-semibold transition-all"
              :class="[
                currentQuestionIndex === idx ? 'ring-2 ring-ink-gray-9 ring-offset-1' : '',
                markedForReview[q.id]
                  ? 'border-outline-amber-2 bg-surface-amber-1 text-ink-amber-3'
                  : answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ''
                  ? 'border-outline-green-2 bg-surface-green-1 text-ink-green-3'
                  : 'border-outline-gray-1 bg-surface-gray-1 text-ink-gray-6 hover:bg-surface-gray-2'
              ]"
            >
              {{ idx + 1 }}
            </button>
          </div>

          <!-- Legend -->
          <div class="mt-auto border-t border-outline-gray-1 pt-3 space-y-1.5 text-3xs text-ink-gray-6">
            <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded bg-surface-green-2 border border-outline-green-2"></span><span>Answered</span></div>
            <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded bg-surface-amber-1 border border-outline-amber-2"></span><span>Marked for Review</span></div>
            <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded bg-surface-gray-1 border border-outline-gray-2"></span><span>Unanswered</span></div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <!-- Anti-Cheat Warning Modal -->
  <Teleport to="body">
    <div v-if="isTerminated" class="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-900/30 text-red-500 mb-6">
        <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-2xl font-black text-white uppercase tracking-wider">Exam Terminated</h2>
      <p class="mt-4 max-w-md text-sm font-medium text-red-400">{{ terminationReason }}</p>
      <p class="mt-6 text-xs text-zinc-500">Your exam has been automatically submitted. You are being redirected...</p>
    </div>

    <!-- Submit Confirmation Modal -->
    <div v-else-if="showSubmitConfirmModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center space-y-5">
        <h3 class="text-xl font-black text-zinc-900">Submit Examination?</h3>
        <p class="text-sm font-medium text-zinc-600">Are you sure you want to submit your examination? You will not be able to change your answers.</p>
        <div class="flex items-center gap-3 mt-4">
          <button
            @click="showSubmitConfirmModal = false"
            class="flex-1 rounded-xl bg-zinc-200 py-3 text-xs font-bold text-zinc-700 hover:bg-zinc-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="executeSubmit"
            class="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Yes, Submit Exam
          </button>
        </div>
      </div>
    </div>

    <!-- Warning Modal -->
    <div v-else-if="showWarningModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center space-y-5">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <span class="text-3xl">⚠️</span>
        </div>
        <div>
          <h3 class="text-lg font-black text-red-700 uppercase tracking-wide">Security Warning</h3>
          <p class="mt-2 text-sm font-bold text-zinc-800">{{ warningMessage }}</p>
          <p class="mt-2 text-xs text-zinc-500">Please remain in full-screen mode and do not switch tabs.</p>
        </div>
        <button
          @click="acknowledgeWarning"
          class="w-full rounded-xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          I Understand & Resume Exam
        </button>
      </div>
    </div>
  </Teleport>
</template>