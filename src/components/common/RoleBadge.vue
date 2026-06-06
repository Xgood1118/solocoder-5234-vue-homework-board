<script setup lang="ts">
import type { UserRole } from '@/types/user'
import { User, GraduationCap } from 'lucide-vue-next'

defineProps<{
  role: UserRole
  name: string
  subject?: string
}>()
</script>

<template>
  <div
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
    :class="{
      'bg-blue-100 text-blue-800 border border-blue-200': role === 'teacher',
      'bg-green-100 text-green-800 border border-green-200': role === 'student',
    }"
  >
    <component
      :is="role === 'teacher' ? GraduationCap : User"
      class="w-4 h-4"
    />
    <span>{{ name }}</span>
    <span
      v-if="subject"
      class="text-xs opacity-75"
    >
      · {{ subject }}
    </span>
  </div>
</template>
