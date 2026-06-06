<script setup lang="ts">
import type { Subject } from '@/types/homework'
import { SUBJECT_CONFIG } from '@/utils/subject'
import { computed } from 'vue'

const props = defineProps<{
  subject: Subject
  size?: 'sm' | 'md'
}>()

const config = computed(() => SUBJECT_CONFIG[props.subject])
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
    :class="config.bgColor"
    :style="{ fontSize: size === 'sm' ? '0.65rem' : '0.75rem' }"
  >
    {{ config.name }}
  </span>
</template>
