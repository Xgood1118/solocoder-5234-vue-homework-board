<script setup lang="ts">
import type { Homework, HomeworkStatus } from '@/types/homework'
import type { UserRole } from '@/types/user'
import KanbanColumn from './KanbanColumn.vue'
import { STATUS_ORDER } from '@/utils/subject'
import { computed } from 'vue'
import { validateTransition } from '@/services/stateMachine'
import { useUserStore } from '@/stores/user'
import { useUiStore } from '@/stores/ui'
import { useHomeworkStore } from '@/stores/homework'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  showStudentName?: boolean
  role?: UserRole
}>()

const emit = defineEmits<{
  (e: 'card-click', homework: Homework): void
  (e: 'status-change', homeworkId: string, newStatus: HomeworkStatus): void
}>()

const userStore = useUserStore()
const uiStore = useUiStore()
const homeworkStore = useHomeworkStore()

const { homeworksByStatus } = storeToRefs(homeworkStore)

const currentRole = computed(() => {
  return props.role || userStore.currentUser?.role || 'student'
})

function getHomeworksByStatus(status: HomeworkStatus): Homework[] {
  return homeworksByStatus.value[status] || []
}

async function handleDrop(targetStatus: HomeworkStatus, droppedHomework: Homework) {
  const homeworkId = droppedHomework.id
  const fromStatus = droppedHomework.status

  if (fromStatus === targetStatus) {
    return
  }

  const role = userStore.currentUser?.role || 'student'
  const validation = validateTransition(fromStatus, targetStatus, role)

  if (!validation.valid) {
    uiStore.showError(validation.reason)
    return
  }

  try {
    await homeworkStore.transitionStatus(homeworkId, targetStatus)
    emit('status-change', homeworkId, targetStatus)
    uiStore.showSuccess('作业状态已更新')
  } catch (err: any) {
    uiStore.showError(err.message || '操作失败')
  }
}

function handleCardClick(homework: Homework) {
  emit('card-click', homework)
}
</script>

<template>
  <div class="flex gap-4 overflow-x-auto pb-4">
    <KanbanColumn
      v-for="status in STATUS_ORDER"
      :key="status"
      :status="status"
      :homeworks="getHomeworksByStatus(status)"
      :show-student-name="showStudentName"
      can-drop
      @card-click="handleCardClick"
      @drop="(hw) => handleDrop(status, hw)"
    />
  </div>
</template>
