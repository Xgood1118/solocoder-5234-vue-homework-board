<script setup lang="ts">
import type { Homework, HomeworkStatus } from '@/types/homework'
import HomeworkCard from './HomeworkCard.vue'
import { STATUS_CONFIG } from '@/utils/subject'
import { computed, ref } from 'vue'

const props = defineProps<{
  status: HomeworkStatus
  homeworks: Homework[]
  showStudentName?: boolean
  canDrop?: boolean
}>()

const emit = defineEmits<{
  (e: 'card-click', homework: Homework): void
  (e: 'drop', homework: Homework): void
}>()

const config = computed(() => STATUS_CONFIG[props.status])
const isDragOver = ref(false)

function handleDragOver(e: DragEvent) {
  if (props.canDrop) {
    e.preventDefault()
    isDragOver.value = true
  }
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  if (!props.canDrop) return
  
  try {
    const homeworkData = e.dataTransfer?.getData('application/json')
    if (homeworkData) {
      const homework = JSON.parse(homeworkData)
      emit('drop', homework)
    }
  } catch (err) {
    console.error('Drop error:', err)
  }
}
</script>

<template>
  <div
    class="flex flex-col flex-shrink-0 w-72 rounded-xl overflow-hidden transition-all"
    :class="{
      'ring-2 ring-blue-400 ring-offset-2 scale-[1.02]': canDrop && isDragOver,
      'opacity-50': !canDrop && isDragOver,
    }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
      <div class="flex items-center gap-2">
        <div
          class="w-2.5 h-2.5 rounded-full"
          :class="config.dotColor"
        />
        <h3 class="text-sm font-semibold text-gray-700">{{ config.name }}</h3>
      </div>
      <span
        class="px-2 py-0.5 text-xs font-medium rounded-full"
        :class="config.bgColor + ' ' + config.color"
      >
        {{ homeworks.length }}
      </span>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/50 min-h-[200px] max-h-[calc(100vh-220px)] transition-colors"
      :class="{ 'bg-blue-50/50': canDrop && isDragOver }"
    >
      <TransitionGroup name="card">
        <HomeworkCard
          v-for="homework in homeworks"
          :key="homework.id"
          :homework="homework"
          :show-student-name="showStudentName"
          :draggable="true"
          @click="emit('card-click', homework)"
        />
      </TransitionGroup>

      <div
        v-if="homeworks.length === 0"
        class="flex items-center justify-center py-8 text-gray-400 text-sm"
      >
        暂无作业
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-enter-active,
.card-leave-active {
  transition: all 0.3s ease;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.card-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.card-move {
  transition: transform 0.3s ease;
}
</style>
