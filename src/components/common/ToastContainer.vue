<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const uiStore = useUiStore()
const { toasts } = storeToRefs(uiStore)

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconColorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm"
        :class="colorMap[toast.type]"
      >
        <component
          :is="iconMap[toast.type]"
          class="w-5 h-5 flex-shrink-0"
          :class="iconColorMap[toast.type]"
        />
        <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
        <button
          @click="uiStore.removeToast(toast.id)"
          class="p-0.5 rounded-full hover:bg-black/5 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
