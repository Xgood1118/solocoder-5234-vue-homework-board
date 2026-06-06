import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastMessage[]>([])
  const detailDialogVisible = ref(false)
  const gradeDialogVisible = ref(false)
  const createDialogVisible = ref(false)

  let toastId = 0

  function showToast(message: string, type: ToastMessage['type'] = 'info', duration: number = 3000) {
    const id = `toast-${++toastId}`
    const toast: ToastMessage = { id, message, type, duration }
    toasts.value.push(toast)

    setTimeout(() => {
      removeToast(id)
    }, duration)

    return id
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function showSuccess(message: string) {
    return showToast(message, 'success')
  }

  function showError(message: string) {
    return showToast(message, 'error')
  }

  function showWarning(message: string) {
    return showToast(message, 'warning')
  }

  function showInfo(message: string) {
    return showToast(message, 'info')
  }

  function openDetailDialog() {
    detailDialogVisible.value = true
  }

  function closeDetailDialog() {
    detailDialogVisible.value = false
  }

  function openGradeDialog() {
    gradeDialogVisible.value = true
  }

  function closeGradeDialog() {
    gradeDialogVisible.value = false
  }

  function openCreateDialog() {
    createDialogVisible.value = true
  }

  function closeCreateDialog() {
    createDialogVisible.value = false
  }

  return {
    toasts,
    detailDialogVisible,
    gradeDialogVisible,
    createDialogVisible,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    openDetailDialog,
    closeDetailDialog,
    openGradeDialog,
    closeGradeDialog,
    openCreateDialog,
    closeCreateDialog,
  }
})
