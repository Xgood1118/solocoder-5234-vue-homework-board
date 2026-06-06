<script setup lang="ts">
import type { Homework } from '@/types/homework'
import { computed } from 'vue'
import { SUBJECT_CONFIG } from '@/utils/subject'
import { formatDate, isDeadlineNear, isOverdue } from '@/utils/date'
import { hasRevisionCard } from '@/services/revisionService'
import { Clock, FileText, AlertTriangle, CheckCircle2 } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  homework: Homework
  showStudentName?: boolean
  draggable?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', homework: Homework): void
  (e: 'dragstart', homework: Homework, event: DragEvent): void
}>()

const userStore = useUserStore()

const subjectConfig = computed(() => SUBJECT_CONFIG[props.homework.subject])

const showScore = computed(() => {
  return props.homework.status === 'graded' || props.homework.status === 'revised'
})

const showSubmitTime = computed(() => {
  return ['submitted', 'graded', 'revised'].includes(props.homework.status)
})

const needsRevisionBadge = computed(() => {
  return hasRevisionCard(props.homework)
})

const deadlineStatus = computed(() => {
  if (isOverdue(props.homework.deadline) && ['todo', 'in_progress'].includes(props.homework.status)) {
    return 'overdue'
  }
  if (isDeadlineNear(props.homework.deadline) && ['todo', 'in_progress'].includes(props.homework.status)) {
    return 'near'
  }
  return 'normal'
})

const scoreColor = computed(() => {
  const score = props.homework.score
  if (score === undefined) return 'text-gray-500'
  if (score >= 90) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  return 'text-red-600'
})

function handleClick() {
  emit('click', props.homework)
}

function handleDragStart(e: DragEvent) {
  if (props.draggable === false) {
    e.preventDefault()
    return
  }
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/json', JSON.stringify(props.homework))
    e.dataTransfer.effectAllowed = 'move'
  }
  emit('dragstart', props.homework, e)
}
</script>

<template>
  <div
    class="relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-200 group select-none"
    :class="{
      'opacity-60 cursor-not-allowed': !draggable && draggable !== undefined,
      'opacity-80 scale-[1.02] shadow-lg': false,
    }"
    :draggable="draggable !== false"
    @click="handleClick"
    @dragstart="handleDragStart"
  >
    <div
      class="absolute left-0 top-0 bottom-0 w-1.5"
      :style="{ backgroundColor: subjectConfig.color }"
    />

    <div class="p-3 pl-4">
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <SubjectTag :subject="homework.subject" size="sm" />
          <span
            v-if="showStudentName"
            class="text-xs text-gray-500 font-medium"
          >
            {{ homework.studentName }}
          </span>
        </div>

        <div v-if="showScore && homework.score !== undefined" class="flex items-center gap-1">
          <span
            class="text-lg font-bold tabular-nums"
            :class="scoreColor"
          >
            {{ homework.score }}
          </span>
          <span class="text-xs text-gray-400">分</span>
        </div>
      </div>

      <h4 class="text-sm font-medium text-gray-800 mb-2 line-clamp-2 group-hover:text-gray-900">
        {{ homework.title }}
      </h4>

      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock class="w-3 h-3 flex-shrink-0" />
          <span>布置: {{ formatDate(homework.assignedAt, 'MM-DD') }}</span>
        </div>

        <div
          class="flex items-center gap-1.5 text-xs"
          :class="{
            'text-red-500 font-medium': deadlineStatus === 'overdue',
            'text-orange-500': deadlineStatus === 'near',
            'text-gray-500': deadlineStatus === 'normal',
          }"
        >
          <AlertTriangle v-if="deadlineStatus !== 'normal'" class="w-3 h-3 flex-shrink-0" />
          <FileText v-else class="w-3 h-3 flex-shrink-0" />
          <span>
            截止: {{ formatDate(homework.deadline, 'MM-DD') }}
            <span v-if="deadlineStatus === 'overdue'" class="font-medium">(已逾期)</span>
          </span>
        </div>

        <div v-if="showSubmitTime && homework.submittedAt" class="flex items-center gap-1.5 text-xs text-gray-500">
          <CheckCircle2 class="w-3 h-3 flex-shrink-0 text-green-500" />
          <span>提交: {{ formatDate(homework.submittedAt, 'MM-DD HH:mm') }}</span>
        </div>
      </div>

      <div
        v-if="homework.comment && homework.status !== 'todo' && homework.status !== 'in_progress'"
        class="mt-2 pt-2 border-t border-gray-50"
      >
        <p class="text-xs text-gray-500 line-clamp-2">
          <span class="text-gray-400">评语: </span>{{ homework.comment }}
        </p>
      </div>

      <div
        v-if="needsRevisionBadge"
        class="absolute top-2 right-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full animate-pulse"
      >
        待订正
      </div>

      <div
        v-if="homework.status === 'revised' && homework.revisionScore !== undefined"
        class="mt-2 flex items-center gap-2 text-xs"
      >
        <span class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          订正得分: {{ homework.revisionScore }}
        </span>
      </div>
    </div>
  </div>
</template>
