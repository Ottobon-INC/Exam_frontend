<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from 'frappe-ui'
import { examService, sectionService } from '../api/services'

const router = useRouter()
const route = useRoute()

const exam = ref(null)
const computedTotalMarks = ref(0)
const loading = ref(true)
const cameraGranted = ref(false)
const checkingCamera = ref(false)

onMounted(async () => {
  try {
    const res = await examService.getExam(route.params.id)
    if (res?.exam) {
      exam.value = res.exam
      
      try {
        const secRes = await sectionService.getSections(route.params.id)
        const sections = secRes?.sections || []
        const questions = res.exam.questions || []
        
        let calculatedMarks = 0
        if (sections.length > 0) {
          sections.forEach(sec => {
            const secQs = questions.filter(q => q.sectionId === sec.id)
            const limit = sec.max_questions_limit
            const count = limit && limit > 0 ? Math.min(secQs.length, limit) : secQs.length
            calculatedMarks += count
          })
          const unsecQs = questions.filter(q => !q.sectionId)
          calculatedMarks += unsecQs.length
        } else {
          calculatedMarks = questions.length
        }
        computedTotalMarks.value = calculatedMarks > 0 ? calculatedMarks : res.exam.totalMarks
      } catch(secErr) {
        console.error('Failed to fetch sections:', secErr)
        computedTotalMarks.value = res.exam.totalMarks
      }
    }
  } catch (err) {
    console.error('Failed to fetch exam instructions:', err)
  } finally {
    loading.value = false
  }
})

const requestPermissions = async () => {
  checkingCamera.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    if (stream) {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.srcObject = stream
      await video.play().catch(() => {})

      await new Promise((resolve) => setTimeout(resolve, 600))

      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, 64, 64)
      const pixels = ctx.getImageData(0, 0, 64, 64).data

      let totalLum = 0
      for (let i = 0; i < pixels.length; i += 4) {
        totalLum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
      }
      const avgLum = totalLum / (pixels.length / 4)

      stream.getTracks().forEach((track) => track.stop())

      if (avgLum < 12) {
        alert('⚠️ Camera feed is covered, taped over, or pitch black. Please uncover your webcam lens and face the camera to proceed.')
        cameraGranted.value = false
        return
      }

      cameraGranted.value = true
    }
  } catch (err) {
    alert('Camera & Microphone permission is required to proceed with this proctored examination.')
  } finally {
    checkingCamera.value = false
  }
}

const beginExam = async () => {
  try {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      await elem.requestFullscreen()
    } else if (elem.webkitRequestFullscreen) {
      await elem.webkitRequestFullscreen()
    }
  } catch (err) {
    console.warn('Fullscreen request prompt:', err)
  }
  router.push(`/exam/${route.params.id}`)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-gray-1 p-4 text-ink-gray-9">
    <div v-if="loading" class="text-xs text-ink-gray-5">
      Loading examination guidelines...
    </div>

    <div v-else-if="!exam" class="rounded-xl border border-outline-gray-1 bg-surface-white p-8 text-center text-xs">
      <p class="text-ink-red-3 font-semibold">Examination not found or unavailable.</p>
      <Button variant="subtle" class="mt-4" label="Back to Dashboard" @click="router.push('/dashboard')" />
    </div>

    <div v-else class="w-full max-w-2xl rounded-xl border border-outline-gray-2 bg-surface-white p-8 shadow-sm">
      <div class="mb-2 flex items-center justify-between">
        <span class="font-mono text-xs font-semibold text-ink-gray-5">{{ exam.code }}</span>
        <span class="rounded bg-surface-gray-2 px-2 py-0.5 text-2xs font-semibold text-ink-gray-8">
          {{ exam.expectedQuestionsCount || exam.questions?.length || 0 }} Questions
        </span>
      </div>

      <h1 class="mb-4 text-2xl font-bold text-ink-gray-9">{{ exam.title }}</h1>
      
      <div class="mb-6 space-y-3 text-xs text-ink-gray-8">
        <p v-if="exam.description" class="text-ink-gray-6">{{ exam.description }}</p>

        <div class="grid grid-cols-2 gap-3 rounded-lg border border-outline-gray-1 bg-surface-gray-1 p-3 text-2xs">
          <div>
            <span class="text-ink-gray-4 block">Allocated Time</span>
            <span class="font-bold text-ink-gray-9 text-sm">{{ exam.durationMinutes }} Minutes</span>
          </div>
          <div>
            <span class="text-ink-gray-4 block">Maximum Score</span>
            <span class="font-bold text-ink-gray-9 text-sm">{{ computedTotalMarks }} Marks (Pass: {{ exam.passMarks }})</span>
          </div>
        </div>
        
        <div class="rounded-lg bg-surface-gray-1 p-4 border border-outline-gray-1 text-2xs text-ink-gray-7">
          <h4 class="font-semibold text-ink-gray-9 mb-1.5 uppercase text-3xs tracking-wider">Candidate Code of Conduct</h4>
          <ul class="list-inside list-disc space-y-1.5">
            <li>Ensure you remain in full view of the webcam throughout the session.</li>
            <li>Switching browser tabs or minimizing the window will trigger a proctoring flag.</li>
            <li><strong>Mandatory Full-Screen Mode:</strong> Exiting full-screen (pressing ESC, changing tabs, or resizing) will <strong>immediately terminate and submit</strong> your examination and report a violation to the proctor.</li>
            <li>When the countdown timer reaches zero, all answers will be automatically submitted.</li>
          </ul>
        </div>
      </div>

      <!-- Proctoring Camera Check Banner -->
      <div v-if="exam.proctoringEnabled && !cameraGranted" class="mb-6 rounded-lg border border-outline-amber-2 bg-surface-amber-1 p-4">
        <h3 class="mb-1 text-xs font-semibold text-ink-amber-3">Proctoring Camera & Microphone Check</h3>
        <p class="mb-3 text-2xs text-ink-gray-7">
          This examination is monitored in real-time. Please grant hardware permissions to unlock the exam session.
        </p>
        <Button 
          variant="solid" 
          theme="gray" 
          :loading="checkingCamera"
          label="Verify Camera & Mic" 
          @click="requestPermissions" 
        />
      </div>

      <div v-else-if="exam.proctoringEnabled && cameraGranted" class="mb-6 flex items-center gap-2 rounded-lg border border-outline-green-2 bg-surface-green-1 p-3 text-xs text-ink-green-3">
        <span class="h-2 w-2 rounded-full bg-surface-green-3"></span>
        <span class="font-medium text-2xs">Hardware Verified. Live proctor stream ready.</span>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-outline-gray-1">
        <Button 
          variant="subtle" 
          label="Cancel" 
          @click="router.push('/dashboard')" 
        />
        <Button 
          variant="solid" 
          theme="gray" 
          label="Enter Examination Room →" 
          :disabled="exam.proctoringEnabled && !cameraGranted"
          @click="beginExam" 
        />
      </div>
      
    </div>
  </div>
</template>
