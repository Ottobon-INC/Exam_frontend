<template>
  <div class="space-y-6">
    <!-- Header & Proctoring Grid Controls -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-surface-red-3 animate-ping"></span>
          <h1 class="text-xl font-bold text-ink-gray-9">Live Video Proctoring Hub</h1>
        </div>
        <p class="text-xs text-ink-gray-5">Real-time candidate webcam feeds, automated anti-cheat violation triggers, and proctor interventions.</p>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-2.5">
        <select
          v-model="selectedExamId"
          @change="changeExamRoom"
          class="rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-1.5 text-xs text-ink-gray-8 focus:border-outline-gray-5 focus:outline-none"
        >
          <option v-for="ex in liveExams" :key="ex.id" :value="ex.id">
            {{ ex.code }} • {{ ex.title }}
          </option>
        </select>

        <button
          @click="broadcastWarning"
          class="flex items-center gap-1.5 rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-1.5 text-xs font-medium text-ink-red-3 hover:bg-surface-red-1 transition-colors"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Broadcast Alert
        </button>
      </div>
    </div>

    <!-- Candidate Feeds Grid -->
    <div v-if="loading" class="text-center py-12 text-xs text-ink-gray-5">
      Connecting to WebSocket live stream hub...
    </div>

    <div v-else-if="candidates.length === 0" class="rounded-xl border border-outline-gray-1 bg-surface-white p-12 text-center text-xs text-ink-gray-5">
      No active candidates currently connected to this exam room.
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="candidate in candidates"
        :key="candidate.id"
        class="group relative flex flex-col rounded-xl border bg-surface-white shadow-xs overflow-hidden transition-all"
        :class="[
          candidate.status === 'Flagged'
            ? 'border-outline-red-2 ring-1 ring-outline-red-2'
            : 'border-outline-gray-1 hover:border-outline-gray-2'
        ]"
      >
        <!-- Feed Video Canvas / Container -->
        <div class="relative aspect-video w-full bg-ink-gray-9 flex items-center justify-center overflow-hidden">
          <img
            v-if="candidate.frame"
            :src="candidate.frame"
            class="h-full w-full object-cover"
            alt="Candidate Live Feed"
          />
          <div v-else class="relative flex h-full w-full items-center justify-center bg-gradient-to-t from-black/80 via-neutral-900 to-neutral-800">
            <div class="flex flex-col items-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shadow-inner"
                :class="candidate.status === 'Flagged' ? 'bg-surface-red-2 text-ink-red-3' : 'bg-surface-gray-3 text-ink-gray-8'"
              >
                {{ candidate.name ? candidate.name.split(' ').map(n=>n[0]).join('').slice(0,2) : 'CA' }}
              </div>
              <span class="mt-1 text-3xs font-mono text-ink-gray-4">Connecting video...</span>
            </div>
          </div>

          <!-- Face Detection Overlay Box -->
          <div
            class="absolute border border-dashed rounded-md pointer-events-none transition-all duration-300"
            :class="candidate.status === 'Flagged' ? 'border-surface-red-3' : 'border-surface-green-3'"
            style="width: 70px; height: 75px; top: 15%; left: 38%;"
          >
            <span
              class="absolute -top-3.5 left-0 rounded px-1 py-0.2 text-3xs font-mono"
              :class="candidate.status === 'Flagged' ? 'bg-surface-red-3 text-white' : 'bg-surface-green-3 text-white'"
            >
              {{ candidate.status === 'Flagged' ? 'FLAGGED' : 'NORMAL' }}
            </span>
          </div>

          <!-- Top Status Bar overlay -->
          <div class="absolute top-2 left-2 right-2 flex items-center justify-between">
            <span
              class="inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-3xs font-medium text-white backdrop-blur-xs"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="candidate.status === 'Flagged' ? 'bg-surface-red-3 animate-pulse' : 'bg-surface-green-3'"></span>
              {{ candidate.status || 'Active' }}
            </span>
            <span class="rounded bg-black/60 px-1.5 py-0.5 text-3xs font-mono text-white">
              {{ candidate.lastSnapshotTime || 'Live' }}
            </span>
          </div>

          <!-- Bottom Violation Counter -->
          <div v-if="candidate.violations > 0" class="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-surface-red-3/90 px-1.5 py-0.5 text-3xs font-semibold text-white">
            <span>⚠ {{ candidate.violations }} Flags</span>
          </div>
        </div>

        <!-- Candidate Information & Controls Footer -->
        <div class="p-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-semibold text-ink-gray-9 leading-none">{{ candidate.name }}</h4>
              <span class="text-3xs font-mono text-ink-gray-4">Roll: {{ candidate.rollNumber || 'CANDIDATE' }}</span>
            </div>
            <button
              @click="selectedCandidate = candidate"
              class="rounded-md border border-outline-gray-2 bg-surface-white px-2 py-1 text-3xs font-medium text-ink-gray-7 hover:bg-surface-gray-2 transition-colors"
            >
              Inspect
            </button>
          </div>

          <!-- Last Event Ticker -->
          <div class="mt-2 rounded bg-surface-gray-1 px-2 py-1 text-3xs text-ink-gray-6 border border-outline-gray-1">
            <span class="font-medium text-ink-gray-8">Last event: </span>
            <span :class="candidate.status === 'Flagged' ? 'text-ink-red-3 font-semibold' : ''">
              {{ candidate.lastEvent || 'Heartbeat received' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Candidate Detailed Inspection Modal -->
    <div v-if="selectedCandidate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div class="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-outline-gray-2 bg-surface-white shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between border-b border-outline-gray-1 px-6 py-4">
          <div class="flex items-center gap-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-surface-gray-3 text-xs font-bold text-ink-gray-8">
              {{ selectedCandidate.name ? selectedCandidate.name[0] : 'C' }}
            </div>
            <div>
              <h2 class="text-sm font-semibold text-ink-gray-9">{{ selectedCandidate.name }} ({{ selectedCandidate.rollNumber || 'CANDIDATE' }})</h2>
              <span class="text-3xs text-ink-gray-5">ID: {{ selectedCandidate.id }}</span>
            </div>
          </div>
          <button @click="selectedCandidate = null" class="text-ink-gray-4 hover:text-ink-gray-8">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto">
          <!-- Expanded Video Feed -->
          <div class="space-y-3">
            <div class="relative aspect-video w-full rounded-xl bg-ink-gray-9 flex items-center justify-center overflow-hidden border border-outline-gray-2">
              <img
                v-if="selectedCandidate.frame"
                :src="selectedCandidate.frame"
                class="h-full w-full object-cover"
                alt="Live Stream HD"
              />
              <div v-else class="flex flex-col items-center">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-surface-gray-3 text-base font-bold text-ink-gray-8">
                  {{ selectedCandidate.name ? selectedCandidate.name[0] : 'C' }}
                </div>
                <span class="mt-2 text-2xs text-ink-gray-4 font-mono">Connecting Live HD Feed...</span>
              </div>
            </div>

            <!-- Interventions Panel -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="sendIntervention('WARN')"
                class="rounded-lg border border-outline-red-2 bg-surface-red-1 py-2 text-xs font-medium text-ink-red-3 hover:bg-surface-red-2"
              >
                Send Direct Warning
              </button>
              <button
                @click="sendIntervention('PAUSE')"
                class="rounded-lg border border-outline-gray-2 bg-surface-white py-2 text-xs font-medium text-ink-gray-8 hover:bg-surface-gray-2"
              >
                Pause Attempt
              </button>
            </div>
          </div>

          <!-- Real-Time Audit Log Timeline -->
          <div class="flex flex-col rounded-xl border border-outline-gray-1 bg-surface-gray-1 p-4">
            <h3 class="text-xs font-semibold text-ink-gray-9 mb-3">Live Integrity & Anti-Cheat Events</h3>
            <div class="flex-1 space-y-3 overflow-y-auto text-2xs">
              <div
                v-for="(log, idx) in selectedCandidate.auditLogs || [{ time: 'Just now', event: 'Webcam feed active', isViolation: false }]"
                :key="idx"
                class="flex items-start gap-2 rounded-lg bg-surface-white p-2 border border-outline-gray-1"
              >
                <span class="font-mono text-3xs text-ink-gray-4 shrink-0">{{ log.time }}</span>
                <div class="flex flex-col">
                  <span class="font-medium" :class="log.isViolation ? 'text-ink-red-3' : 'text-ink-gray-8'">{{ log.event }}</span>
                  <span class="text-3xs text-ink-gray-5">{{ log.detail }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { examService } from '../../api/services'
import { initProctorSocket } from '../../api/socket'

const liveExams = ref([])
const selectedExamId = ref('ALL')
const candidates = ref([])
const selectedCandidate = ref(null)
const loading = ref(true)

let socket = null

const loadExams = async () => {
  loading.value = true
  try {
    const res = await examService.getExams()
    const rawExams = res.exams || []
    liveExams.value = [
      { id: 'ALL', code: 'ALL', title: 'All Active Examinations' },
      ...rawExams,
    ]
    selectedExamId.value = 'ALL'
    connectProctorRoom('ALL')
  } catch (err) {
    console.error('Failed to load exams:', err)
  } finally {
    loading.value = false
  }
}

const connectProctorRoom = (examId) => {
  socket = initProctorSocket()
  socket.emit('join_exam', {
    examId,
    role: 'PROCTOR',
  })

  // Remove existing listeners to avoid duplicate bindings
  socket.off('candidate_online')
  socket.off('proctor_frame_stream')
  socket.off('proctor_feed_update')
  socket.off('violation_alert')

  // Listen for new candidate joining
  socket.on('candidate_online', (data) => {
    if (selectedExamId.value !== 'ALL' && data.examId && String(data.examId) !== String(selectedExamId.value)) return
    const existing = candidates.value.find((c) => c.id === data.candidateId)
    if (!existing) {
      candidates.value.push({
        id: data.candidateId,
        examId: data.examId,
        name: data.candidateName || 'Candidate',
        rollNumber: data.rollNumber,
        status: 'Active',
        violations: 0,
        lastEvent: 'Connected to proctor hub',
        auditLogs: [{ time: new Date().toLocaleTimeString(), event: 'Candidate connected', isViolation: false }],
      })
    }
  })

  // Listen for live snapshot photo stream
  socket.on('proctor_frame_stream', (data) => {
    if (selectedExamId.value !== 'ALL' && data.examId && String(data.examId) !== String(selectedExamId.value)) return
    const formattedTime = new Date().toLocaleTimeString()
    let c = candidates.value.find((item) => item.id === data.candidateId)
    if (!c) {
      c = {
        id: data.candidateId,
        examId: data.examId,
        name: data.candidateName || 'Candidate',
        rollNumber: data.rollNumber,
        status: 'Active',
        violations: 0,
        frame: data.frame,
        lastSnapshotTime: formattedTime,
        auditLogs: [],
      }
      candidates.value.push(c)
    } else {
      c.frame = data.frame
      c.lastSnapshotTime = formattedTime
      if (data.candidateName) c.name = data.candidateName
      if (data.rollNumber) c.rollNumber = data.rollNumber
      if (data.examId) c.examId = data.examId
    }

    if (selectedCandidate.value && selectedCandidate.value.id === data.candidateId) {
      selectedCandidate.value.frame = data.frame
      selectedCandidate.value.lastSnapshotTime = formattedTime
    }
  })

  // Listen for telemetry updates
  socket.on('proctor_feed_update', (data) => {
    if (selectedExamId.value !== 'ALL' && data.examId && String(data.examId) !== String(selectedExamId.value)) return
    const c = candidates.value.find((item) => item.id === data.candidateId)
    if (c) {
      c.fps = data.fps || 24
      c.status = data.status || 'Active'
    }
  })

  // Listen for violation alerts
  socket.on('violation_alert', (data) => {
    if (selectedExamId.value !== 'ALL' && data.examId && String(data.examId) !== String(selectedExamId.value)) return
    let c = candidates.value.find((item) => item.id === data.candidateId)
    if (!c) {
      c = {
        id: data.candidateId,
        examId: data.examId,
        name: 'Candidate',
        violations: 0,
        auditLogs: [],
      }
      candidates.value.push(c)
    }
    c.violations = (c.violations || 0) + 1
    c.status = 'Flagged'
    c.lastEvent = `${data.eventType}: ${data.details || 'Integrity anomaly detected'}`
    c.auditLogs = c.auditLogs || []
    c.auditLogs.unshift({
      time: new Date().toLocaleTimeString(),
      event: data.eventType,
      detail: data.details,
      isViolation: true,
    })
  })
}

const changeExamRoom = () => {
  candidates.value = []
  if (selectedExamId.value) {
    connectProctorRoom(selectedExamId.value)
  }
}

const broadcastWarning = () => {
  if (!socket || !selectedExamId.value) return
  socket.emit('proctor_action', {
    examId: selectedExamId.value,
    action: 'WARN',
    message: 'Please ensure you remain in direct camera view at all times.',
  })
  alert('Broadcast warning sent to all candidates in this examination!')
}

const sendIntervention = (action) => {
  if (!socket || !selectedCandidate.value) return
  socket.emit('proctor_action', {
    examId: selectedExamId.value,
    candidateId: selectedCandidate.value.id,
    action,
    message: action === 'WARN' ? 'Suspicious activity flagged by proctor.' : 'Attempt paused for review.',
  })
  alert(`Intervention (${action}) sent to ${selectedCandidate.value.name}!`)
}

onMounted(() => {
  loadExams()
})

onUnmounted(() => {
  if (socket) {
    socket.off('candidate_online')
    socket.off('proctor_feed_update')
    socket.off('violation_alert')
  }
})
</script>
