<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { toastState, closeToast } from '../utils/toast.js'

const iconClass = computed(() => {
  switch (toastState.type) {
    case 'success':
      return 'bg-emerald-100 text-emerald-600 border-emerald-300'
    case 'warning':
      return 'bg-amber-100 text-amber-600 border-amber-300'
    case 'info':
      return 'bg-blue-100 text-blue-600 border-blue-300'
    case 'error':
    default:
      return 'bg-rose-100 text-rose-600 border-rose-300'
  }
})

const handleKeydown = (e) => {
  if (e.key === 'Escape' && toastState.show) {
    closeToast()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="toastState.show"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 select-none"
        @click.self="closeToast"
      >
        <div
          class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-zinc-200 text-center space-y-4"
        >
          <!-- Icon Header -->
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2" :class="iconClass">
            <svg v-if="toastState.type === 'success'" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="toastState.type === 'warning'" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else-if="toastState.type === 'info'" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <!-- Message Body -->
          <div class="space-y-1.5">
            <h3 class="text-base font-extrabold text-zinc-900 leading-snug">
              {{ toastState.title }}
            </h3>
            <p class="text-xs font-medium text-zinc-600 leading-relaxed px-2 break-words">
              {{ toastState.message }}
            </p>
          </div>

          <!-- Action Button -->
          <div class="pt-2">
            <button
              @click="closeToast"
              type="button"
              class="w-full rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
