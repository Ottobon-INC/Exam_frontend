import { reactive } from 'vue'

export const toastState = reactive({
  show: false,
  message: '',
  type: 'error', // 'error' | 'success' | 'warning' | 'info'
  title: '',
})

let timer = null

export function showToast(message, type = 'error', title = '') {
  if (!message) return
  toastState.message = String(message)
  toastState.type = type
  toastState.title = title || (type === 'error' ? 'Action Failed' : type === 'success' ? 'Success' : 'Notice')
  toastState.show = true

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    toastState.show = false
  }, 5000)
}

export function closeToast() {
  toastState.show = false
}

// Override native window.alert globally across the platform
if (typeof window !== 'undefined') {
  window.alert = function (msg) {
    if (!msg) return
    const str = String(msg)
    const lower = str.toLowerCase()
    const isSuccess =
      lower.includes('success') ||
      lower.includes('⚡') ||
      lower.includes('created') ||
      lower.includes('assigned') ||
      lower.includes('updated') ||
      lower.includes('sent') ||
      lower.includes('released')
    showToast(str, isSuccess ? 'success' : 'error')
  }
}
