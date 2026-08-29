<template>
  <div class="min-h-screen bg-zinc-50 text-zinc-900">
    <!-- Header -->
    <header class="flex min-h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-8">
      <div class="flex items-center gap-3">
        <img src="/logo.png" class="h-8 w-8 object-contain rounded-lg shadow-2xs" alt="Ottobon Emblem" />
        <div>
          <span class="font-bold text-zinc-900 text-sm">Ottobon Examination Portal</span>
          <span class="ml-2 text-3xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold">Candidate</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
            {{ user.name ? user.name.split(' ').map(n=>n[0]).join('').slice(0,2) : 'CA' }}
          </div>
          <div class="flex flex-col text-left">
            <span class="text-xs font-bold text-zinc-900 leading-none">{{ user.name }}</span>
            <span class="text-3xs text-zinc-500 font-mono">Roll: {{ user.rollNumber || 'CANDIDATE' }}</span>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          Log Out
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-8 space-y-8">
      
      <!-- Welcome Banner -->
      <div class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-zinc-900">Welcome, {{ user.name }}</h1>
          <p class="text-xs text-zinc-600 mt-1">
            You have <span class="font-bold text-zinc-900">{{ availableExams.length }} assigned examinations</span> ready for slot selection & attempt.
          </p>
        </div>
        <div class="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600">
          <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold text-2xs">System Check: Ready</span>
        </div>
      </div>

      <!-- Available Assigned Exams Grid -->
      <section>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xs font-bold text-zinc-900 uppercase tracking-wider">Your Assigned Examinations</h2>
          <span class="text-3xs text-zinc-500 font-bold">Select Slot & Start</span>
        </div>
        
        <div v-if="loading" class="text-center py-12 text-xs text-zinc-600 font-medium">
          Loading assigned examinations...
        </div>

        <div v-else-if="availableExams.length === 0" class="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-600">
          No examinations assigned to your account at this time.
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div 
            v-for="exam in availableExams" 
            :key="exam.id"
            class="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-zinc-300"
          >
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="font-mono text-3xs font-bold text-zinc-500 uppercase">{{ exam.code }}</span>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-3xs font-bold"
                  :class="getExamStatusClass(exam)"
                >
                  {{ getExamStatusBadge(exam) }}
                </span>
              </div>
              <h3 class="font-bold text-zinc-900 text-sm leading-snug">{{ exam.title }}</h3>
              
              <div class="mt-4 space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-2xs text-zinc-600">
                <div class="flex justify-between">
                  <span class="text-zinc-500">Duration:</span>
                  <span class="font-bold text-zinc-900">{{ exam.durationMinutes }} Minutes</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Total Marks:</span>
                  <span class="font-bold text-zinc-900">{{ exam.totalMarks }} Marks</span>
                </div>

                <!-- Booked Slot Details if Available -->
                <div v-if="exam.bookedSlot" class="mt-2 pt-2 border-t border-zinc-200">
                  <span class="font-bold text-zinc-900 block">📅 Your Scheduled Slot:</span>
                  <span class="text-3xs text-indigo-700 font-bold block">
                    {{ new Date(exam.bookedSlot.startTime).toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="mt-5">
              <!-- Case 0: Direct Access Mode (Slot booking disabled) -->
              <button
                v-if="exam.slotBookingEnabled === false"
                @click="startExam(exam.id)"
                :disabled="exam.status !== 'LIVE'"
                class="w-full rounded-lg py-2.5 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
                :class="exam.status === 'LIVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-zinc-300 text-zinc-600 cursor-not-allowed'"
              >
                <span v-if="exam.status === 'LIVE'">🚀 Start Examination Now</span>
                <span v-else>⏳ Waiting for Assessment to go LIVE</span>
              </button>

              <!-- Case 1: No Slot Booked Yet -->
              <button
                v-else-if="!exam.bookedSlot"
                @click="openSlotBookingModal(exam)"
                class="w-full rounded-lg bg-zinc-900 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                ⏰ Select Exam Time Slot
              </button>

              <!-- Case 2: Slot Booked - Active Window Open or Exam LIVE -->
              <button
                v-else-if="isSlotActive(exam)"
                @click="startExam(exam.id)"
                class="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
              >
                🚀 Start Examination Now
              </button>

              <!-- Case 3: Slot Booked - Slot Pending / Not Started -->
              <button
                v-else-if="isSlotUpcoming(exam.bookedSlot)"
                disabled
                class="w-full rounded-lg bg-zinc-200 py-2.5 text-xs font-bold text-zinc-500 cursor-not-allowed"
              >
                🔒 Slot Opens at {{ new Date(exam.bookedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </button>

              <!-- Case 4: Slot Expired -->
              <button
                v-else
                @click="openSlotBookingModal(exam)"
                class="w-full rounded-lg bg-red-100 py-2.5 text-xs font-bold text-red-700 hover:bg-red-200 transition-colors shadow-sm cursor-pointer"
              >
                🔴 Slot Expired - Re-Book Now
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Completed Exams List -->
      <section v-if="completedExams.length > 0" class="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <h2 class="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">Completed Submissions & Score Reports</h2>
        
        <div class="divide-y divide-zinc-200">
          <div 
            v-for="exam in completedExams" 
            :key="exam.id"
            class="flex items-center justify-between py-3"
          >
            <div>
              <div class="text-xs font-bold text-zinc-900">{{ exam.title }}</div>
              <div class="mt-0.5 flex items-center gap-2 text-2xs text-zinc-500">
                <span>Code: {{ exam.code }}</span>
                <span>•</span>
                <span 
                  v-if="exam.publishedResults || exam.userAttempt?.status === 'EVALUATED'" 
                  class="font-bold text-emerald-700"
                >
                  Results Published
                </span>
                <span 
                  v-else 
                  class="font-bold text-amber-600"
                >
                  Under Evaluation
                </span>
              </div>
            </div>
            <div>
              <button
                @click="router.push(`/results/${exam.id}`)"
                class="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                {{ (exam.publishedResults || exam.userAttempt?.status === 'EVALUATED') ? 'View Score Report' : 'Check Status' }}
              </button>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- ============================================================================= -->
    <!-- CANDIDATE SELF-SERVICE SLOT SELECTION MODAL                                   -->
    <!-- ============================================================================= -->
    <div v-if="showSlotModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-lg rounded-2xl border border-zinc-300 bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <h3 class="text-sm font-bold text-zinc-900">Select Time Slot for {{ targetExam?.title }}</h3>
            <p class="text-3xs text-zinc-500">Choose your preferred exam window below to lock your seat.</p>
          </div>
          <button @click="showSlotModal = false" class="text-zinc-400 hover:text-zinc-800 cursor-pointer">✕</button>
        </div>

        <div v-if="loadingOpenSlots" class="py-8 text-center text-xs text-zinc-500 font-medium">
          Fetching open exam slots...
        </div>

        <div v-else-if="openSlots.length === 0" class="py-8 text-center text-xs text-zinc-500">
          No open time slots configured for this exam yet. Please contact your examiner.
        </div>

        <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
          <div
            v-for="s in openSlots"
            :key="s.id"
            class="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 hover:border-zinc-400 transition-colors"
          >
            <div>
              <div class="text-xs font-bold text-zinc-900">
                📅 {{ new Date(s.startTime).toLocaleString() }}
              </div>
              <div class="text-3xs text-zinc-500 mt-0.5">
                Ends: {{ new Date(s.endTime).toLocaleTimeString() }} • <span class="font-bold text-indigo-700">{{ s.remainingSeats }} seats remaining</span>
              </div>
            </div>

            <button
                @click="confirmBookSlot(s.id)"
                :disabled="s.remainingSeats <= 0 || bookingInProgress || isSlotExpired(s)"
                class="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-40 cursor-pointer shadow-sm"
              >
                {{ isSlotExpired(s) ? 'Expired' : (s.remainingSeats <= 0 ? 'Full' : 'Book Seat') }}
              </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService, slotService } from '../api/services'

const router = useRouter()

const user = ref(JSON.parse(localStorage.getItem('candidate_user') || '{"name":"Candidate","rollNumber":"CS21B045"}'))
const availableExams = ref([])
const completedExams = ref([])
const loading = ref(true)

// Slot Booking Modal State
const showSlotModal = ref(false)
const targetExam = ref(null)
const openSlots = ref([])
const loadingOpenSlots = ref(false)
const bookingInProgress = ref(false)

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const profileRes = await authService.getMe().catch(() => null)
    if (profileRes?.user) {
      user.value = profileRes.user
      localStorage.setItem('candidate_user', JSON.stringify(profileRes.user))
    }
    
    const localCompleted = JSON.parse(localStorage.getItem(`completed_exams_${user.value?.id}`) || '[]')

    const examsRes = await slotService.getCandidateAssignedExams()
    if (examsRes?.exams) {
      availableExams.value = examsRes.exams.filter((e) => {
        if (e.userAttempt || localCompleted.includes(e.id)) return false
        return e.status === 'LIVE' || e.status === 'SCHEDULED'
      })
      
      completedExams.value = examsRes.exams.filter((e) => {
        if (e.userAttempt || localCompleted.includes(e.id)) return true
        return e.status === 'COMPLETED'
      })
    }
  } catch (err) {
    console.error('Failed to load candidate dashboard data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

const openSlotBookingModal = async (exam) => {
  targetExam.value = exam
  showSlotModal.value = true
  loadingOpenSlots.value = true
  try {
    const res = await slotService.getSlots(exam.id)
    openSlots.value = res.slots || []
  } catch (err) {
    console.error('Error fetching slots:', err)
  } finally {
    loadingOpenSlots.value = false
  }
}

const confirmBookSlot = async (slotId) => {
  if (!targetExam.value) return
  bookingInProgress.value = true
  try {
    await slotService.bookSlot(targetExam.value.id, slotId)
    alert('Time slot booked successfully!')
    showSlotModal.value = false
    await fetchDashboardData()
  } catch (err) {
    alert(err.message || 'Failed to book slot.')
  } finally {
    bookingInProgress.value = false
  }
}

const isSlotActive = (exam) => {
  if (!exam) return false
  if (exam.status !== 'LIVE') return false
  if (exam.slotBookingEnabled === false || exam.bookedSlot?.isDirectAccess) return true
  if (!exam.bookedSlot) return false
  
  const now = new Date()
  const start = new Date(exam.bookedSlot.startTime)
  const end = new Date(exam.bookedSlot.endTime)
  return now >= start && now <= end
}

const isSlotUpcoming = (slot) => {
  if (!slot) return false
  const now = new Date()
  const start = new Date(slot.startTime)
  return now < start
}

const isSlotExpired = (slot) => {
  if (!slot) return false
  const now = new Date()
  const start = new Date(slot.startTime)
  return now > start
}

const getExamStatusBadge = (exam) => {
  if (exam.slotBookingEnabled === false || exam.bookedSlot?.isDirectAccess) {
    return exam.status === 'LIVE' ? 'Direct Access Live' : 'Direct Access'
  }
  if (!exam.bookedSlot) return 'Slot Pending'
  if (isSlotActive(exam)) return 'Slot Active'
  if (isSlotUpcoming(exam.bookedSlot)) return 'Slot Scheduled'
  return 'Slot Expired'
}

const getExamStatusClass = (exam) => {
  if (exam.slotBookingEnabled === false || exam.bookedSlot?.isDirectAccess) {
    return exam.status === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
  }
  if (!exam.bookedSlot) return 'bg-amber-100 text-amber-800'
  if (isSlotActive(exam)) return 'bg-emerald-100 text-emerald-800'
  if (isSlotUpcoming(exam.bookedSlot)) return 'bg-blue-100 text-blue-800'
  return 'bg-red-100 text-red-700'
}

const startExam = (id) => {
  router.push(`/instructions/${id}`)
}

const handleLogout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('candidate_user')
  router.push('/login')
}
</script>
