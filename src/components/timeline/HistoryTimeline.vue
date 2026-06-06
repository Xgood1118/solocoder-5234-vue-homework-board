<script setup lang="ts">
import type { HistoryRecord } from '@/types/history'
import { getActionLabel } from '@/services/historyService'
import { formatDateTime } from '@/utils/date'
import { getStatusName } from '@/utils/subject'
import {
  FilePlus,
  Play,
  Send,
  CheckSquare,
  RotateCcw,
  Redo2,
  Undo2,
  Trash2,
  RefreshCw,
  Edit,
} from 'lucide-vue-next'
import { computed } from 'vue'

defineProps<{
  records: HistoryRecord[]
}>()

const iconMap: Record<string, any> = {
  create: FilePlus,
  start: Play,
  submit: Send,
  grade: CheckSquare,
  regrade: RotateCcw,
  revise: Redo2,
  send_back: Undo2,
  force_grade: CheckSquare,
  soft_delete: Trash2,
  restore: RefreshCw,
  update: Edit,
}

const colorMap: Record<string, string> = {
  create: 'bg-blue-500',
  start: 'bg-green-500',
  submit: 'bg-amber-500',
  grade: 'bg-purple-500',
  regrade: 'bg-purple-400',
  revise: 'bg-teal-500',
  send_back: 'bg-orange-500',
  force_grade: 'bg-red-500',
  soft_delete: 'bg-gray-500',
  restore: 'bg-blue-400',
  update: 'bg-gray-400',
}

function getIcon(action: string) {
  return iconMap[action] || Edit
}

function getColor(action: string) {
  return colorMap[action] || 'bg-gray-400'
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="(record, index) in records"
      :key="record.id"
      class="relative pl-8 pb-4"
    >
      <div
        v-if="index < records.length - 1"
        class="absolute left-[11px] top-6 w-0.5 h-full bg-gray-200"
      />

      <div
        class="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm"
        :class="getColor(record.action)"
      >
        <component :is="getIcon(record.action)" class="w-3.5 h-3.5" />
      </div>

      <div class="pt-0.5">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-medium text-gray-800">
            {{ getActionLabel(record.action) }}
          </span>
          <span
            class="px-1.5 py-0.5 text-xs rounded"
            :class="record.operatorRole === 'teacher' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'"
          >
            {{ record.operatorName }}
          </span>
        </div>

        <div class="text-xs text-gray-500 mb-1">
          {{ formatDateTime(record.timestamp) }}
        </div>

        <div v-if="record.fromStatus && record.toStatus" class="text-xs text-gray-500">
          {{ record.fromStatus === record.toStatus ? '重新批改' : `${getStatusName(record.fromStatus)} → ${getStatusName(record.toStatus)}` }}
        </div>

        <div v-if="record.score !== undefined" class="text-xs text-gray-500">
          分数: {{ record.score }} 分
        </div>

        <div v-if="record.remark" class="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">
          {{ record.remark }}
        </div>
      </div>
    </div>

    <div v-if="records.length === 0" class="text-center py-8 text-gray-400 text-sm">
      暂无历史记录
    </div>
  </div>
</template>
