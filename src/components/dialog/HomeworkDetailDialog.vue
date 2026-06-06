<script setup lang="ts">
import type { Homework } from '@/types/homework'
import type { HistoryRecord } from '@/types/history'
import { computed, ref, watch } from 'vue'
import { X, Clock, FileText, User, MessageSquare, Image, Send, Play, RotateCcw, Trash2, CheckCircle2 } from 'lucide-vue-next'
import SubjectTag from '@/components/common/SubjectTag.vue'
import HistoryTimeline from '@/components/timeline/HistoryTimeline.vue'
import { getStatusName, SUBJECT_CONFIG } from '@/utils/subject'
import { formatDateTime, formatDate, isOverdue, isDeadlineNear } from '@/utils/date'
import { useUserStore } from '@/stores/user'
import { useUiStore } from '@/stores/ui'
import { useHomeworkStore } from '@/stores/homework'
import { getValidTransitions, validateTransition } from '@/services/stateMachine'
import { getHomeworkHistory } from '@/services/historyService'
import { hasRevisionCard, formatRevisionTime } from '@/services/revisionService'
import { filesToBase64, validateImageFile } from '@/utils/file'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  visible: boolean
  homework: Homework | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'grade'): void
  (e: 'status-change'): void
}>()

const userStore = useUserStore()
const uiStore = useUiStore()
const homeworkStore = useHomeworkStore()

const { currentUser, isTeacher, isStudent } = storeToRefs(userStore)

const historyRecords = ref<HistoryRecord[]>([])
const activeTab = ref<'info' | 'history'>('info')
const uploadingImages = ref(false)
const newAttachments = ref<string[]>([])

const subjectConfig = computed(() => {
  if (!props.homework) return null
  return SUBJECT_CONFIG[props.homework.subject]
})

const needsRevision = computed(() => {
  if (!props.homework) return false
  return hasRevisionCard(props.homework)
})

const canStart = computed(() => {
  if (!props.homework || !isStudent.value) return false
  return props.homework.status === 'todo'
})

const canSubmit = computed(() => {
  if (!props.homework || !isStudent.value) return false
  return ['todo', 'in_progress'].includes(props.homework.status)
})

const canRevise = computed(() => {
  if (!props.homework || !isStudent.value) return false
  return props.homework.status === 'graded' && props.homework.needsRevision
})

const canGrade = computed(() => {
  if (!props.homework || !isTeacher.value) return false
  return ['todo', 'in_progress', 'submitted', 'graded'].includes(props.homework.status)
})

const canSendBack = computed(() => {
  if (!props.homework || !isTeacher.value) return false
  return ['graded', 'revised'].includes(props.homework.status)
})

const canDelete = computed(() => {
  if (!props.homework || !isTeacher.value) return false
  return true
})

const deadlineStatus = computed(() => {
  if (!props.homework) return 'normal'
  if (isOverdue(props.homework.deadline) && ['todo', 'in_progress'].includes(props.homework.status)) {
    return 'overdue'
  }
  if (isDeadlineNear(props.homework.deadline) && ['todo', 'in_progress'].includes(props.homework.status)) {
    return 'near'
  }
  return 'normal'
})

watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.homework) {
      historyRecords.value = await getHomeworkHistory(props.homework.id)
      newAttachments.value = []
    }
  }
)

watch(
  () => props.homework?.id,
  async (id) => {
    if (id && props.visible) {
      historyRecords.value = await getHomeworkHistory(id)
    }
  }
)

async function handleStart() {
  if (!props.homework) return
  try {
    await homeworkStore.transitionStatus(props.homework.id, 'in_progress')
    uiStore.showSuccess('已开始作业')
    emit('status-change')
  } catch (err: any) {
    uiStore.showError(err.message || '操作失败')
  }
}

async function handleSubmit() {
  if (!props.homework) return
  try {
    const attachments = newAttachments.value.length > 0 
      ? newAttachments.value 
      : props.homework.attachments
    await homeworkStore.transitionStatus(props.homework.id, 'submitted', {
      attachments,
    })
    uiStore.showSuccess('作业已提交')
    newAttachments.value = []
    emit('status-change')
  } catch (err: any) {
    uiStore.showError(err.message || '提交失败')
  }
}

async function handleRevise() {
  if (!props.homework) return
  try {
    await homeworkStore.transitionStatus(props.homework.id, 'revised', {
      revisionAttachments: newAttachments.value,
      revisionTime: 30,
    })
    uiStore.showSuccess('订正已提交')
    newAttachments.value = []
    emit('status-change')
  } catch (err: any) {
    uiStore.showError(err.message || '提交失败')
  }
}

function handleGrade() {
  emit('grade')
}

async function handleSendBack() {
  if (!props.homework) return
  if (!confirm('确定要打回重做吗？')) return
  
  try {
    const targetStatus = 'submitted'
    const validation = validateTransition(props.homework.status, targetStatus, 'teacher')
    if (!validation.valid) {
      uiStore.showError(validation.reason)
      return
    }
    await homeworkStore.transitionStatus(props.homework.id, targetStatus, {
      remark: '老师打回重做',
    })
    uiStore.showSuccess('已打回重做')
    emit('status-change')
  } catch (err: any) {
    uiStore.showError(err.message || '操作失败')
  }
}

async function handleDelete() {
  if (!props.homework) return
  if (!confirm('确定要删除这份作业吗？')) return
  
  try {
    await homeworkStore.deleteHomework(props.homework.id)
    uiStore.showSuccess('作业已删除')
    emit('close')
  } catch (err: any) {
    uiStore.showError(err.message || '删除失败')
  }
}

async function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  uploadingImages.value = true
  try {
    const files = Array.from(input.files)
    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        uiStore.showError(validation.error || '图片无效')
        continue
      }
    }
    const base64Images = await filesToBase64(files)
    newAttachments.value = [...newAttachments.value, ...base64Images]
    uiStore.showSuccess(`已添加 ${files.length} 张图片`)
  } catch (err) {
    uiStore.showError('图片上传失败')
  } finally {
    uploadingImages.value = false
    input.value = ''
  }
}

function removeImage(index: number) {
  newAttachments.value.splice(index, 1)
}

function previewImage(image: string) {
  window.open(image, '_blank')
}

const allAttachments = computed(() => {
  if (!props.homework) return []
  if (newAttachments.value.length > 0) {
    return newAttachments.value
  }
  if (props.homework.status === 'revised' && props.homework.revisionAttachments.length > 0) {
    return props.homework.revisionAttachments
  }
  return props.homework.attachments
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible && homework"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="emit('close')"
        />

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-100"
            :class="{ 'bg-blue-50': isTeacher, 'bg-green-50': isStudent }"
          >
            <div class="flex items-center gap-3">
              <SubjectTag :subject="homework.subject" />
              <h2 class="text-lg font-semibold text-gray-800">{{ homework.title }}</h2>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="{
                  'bg-gray-100 text-gray-700': homework.status === 'todo',
                  'bg-blue-100 text-blue-700': homework.status === 'in_progress',
                  'bg-amber-100 text-amber-700': homework.status === 'submitted',
                  'bg-purple-100 text-purple-700': homework.status === 'graded',
                  'bg-green-100 text-green-700': homework.status === 'revised',
                }"
              >
                {{ getStatusName(homework.status) }}
              </span>
            </div>
            <button
              @click="emit('close')"
              class="p-2 rounded-lg hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-700"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex border-b border-gray-100 bg-gray-50">
            <button
              @click="activeTab = 'info'"
              class="flex-1 px-4 py-2.5 text-sm font-medium transition-colors"
              :class="activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'"
            >
              作业详情
            </button>
            <button
              @click="activeTab = 'history'"
              class="flex-1 px-4 py-2.5 text-sm font-medium transition-colors"
              :class="activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'"
            >
              流转历史
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div v-if="activeTab === 'info'" class="space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <User class="w-4 h-4 text-gray-400" />
                  <span>学生: {{ homework.studentName }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <FileText class="w-4 h-4 text-gray-400" />
                  <span>布置老师: {{ homework.assignedByName }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <Clock class="w-4 h-4 text-gray-400" />
                  <span>布置时间: {{ formatDateTime(homework.assignedAt) }}</span>
                </div>
                <div
                  class="flex items-center gap-2 text-sm"
                  :class="{
                    'text-red-500 font-medium': deadlineStatus === 'overdue',
                    'text-orange-500': deadlineStatus === 'near',
                    'text-gray-600': deadlineStatus === 'normal',
                  }"
                >
                  <Clock class="w-4 h-4" />
                  <span>截止时间: {{ formatDateTime(homework.deadline) }}</span>
                </div>
              </div>

              <div class="bg-gray-50 rounded-xl p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">作业描述</h4>
                <p class="text-sm text-gray-600 leading-relaxed">{{ homework.description }}</p>
              </div>

              <div v-if="homework.score !== undefined" class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-medium text-gray-700">分数</h4>
                  <div class="text-right">
                    <span class="text-2xl font-bold text-purple-600">{{ homework.score }}</span>
                    <span class="text-sm text-gray-500">分</span>
                  </div>
                </div>
                <div v-if="homework.gradedByName" class="text-xs text-gray-500">
                  批改老师: {{ homework.gradedByName }} · {{ formatDate(homework.gradedAt!, 'YYYY-MM-DD HH:mm') }}
                </div>

                <div
                  v-if="homework.revisionScore !== undefined"
                  class="mt-3 pt-3 border-t border-purple-100"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">订正得分</span>
                    <span class="text-lg font-semibold text-green-600">{{ homework.revisionScore }}分</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    订正用时: {{ formatRevisionTime(homework.revisionTime) }}
                  </div>
                </div>
              </div>

              <div v-if="homework.comment" class="bg-amber-50 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                  <MessageSquare class="w-4 h-4 text-amber-500" />
                  <h4 class="text-sm font-medium text-gray-700">老师评语</h4>
                </div>
                <p class="text-sm text-gray-600">{{ homework.comment }}</p>
              </div>

              <div v-if="needsRevision" class="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                  <RotateCcw class="w-4 h-4 text-orange-500" />
                  <h4 class="text-sm font-medium text-orange-700">需要订正</h4>
                </div>
                <p class="text-sm text-orange-600">分数低于60分，请完成订正后重新提交。</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <Image class="w-4 h-4 text-gray-400" />
                    <h4 class="text-sm font-medium text-gray-700">
                      {{ homework.status === 'revised' ? '订正附件' : '作业附件' }}
                    </h4>
                    <span class="text-xs text-gray-400">({{ allAttachments.length }}张)</span>
                  </div>

                  <label
                    v-if="(canSubmit || canRevise) && isStudent"
                    class="cursor-pointer text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {{ uploadingImages ? '上传中...' : '+ 添加图片' }}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      class="hidden"
                      @change="handleImageUpload"
                      :disabled="uploadingImages"
                    />
                  </label>
                </div>

                <div v-if="allAttachments.length > 0" class="grid grid-cols-4 gap-2">
                  <div
                    v-for="(img, index) in allAttachments"
                    :key="index"
                    class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                    @click="previewImage(img)"
                  >
                    <img
                      :src="img"
                      :alt="`图片 ${index + 1}`"
                      class="w-full h-full object-cover"
                    />
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span class="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        点击查看
                      </span>
                    </div>
                    <button
                      v-if="(canSubmit || canRevise) && isStudent && newAttachments.length > 0"
                      @click.stop="removeImage(index)"
                      class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div
                  v-else
                  class="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400 text-sm"
                >
                  暂无图片附件
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'history'">
              <HistoryTimeline :records="historyRecords" />
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <button
                v-if="canDelete"
                @click="handleDelete"
                class="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 class="w-4 h-4" />
                删除
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="emit('close')"
                class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                关闭
              </button>

              <button
                v-if="canStart && isStudent"
                @click="handleStart"
                class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Play class="w-4 h-4" />
                开始作业
              </button>

              <button
                v-if="canSubmit && isStudent"
                @click="handleSubmit"
                class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
              >
                <Send class="w-4 h-4" />
                提交作业
              </button>

              <button
                v-if="canRevise && isStudent"
                @click="handleRevise"
                class="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw class="w-4 h-4" />
                提交订正
              </button>

              <button
                v-if="canGrade && isTeacher"
                @click="handleGrade"
                class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 class="w-4 h-4" />
                {{ homework.status === 'graded' ? '重新批改' : '批改' }}
              </button>

              <button
                v-if="canSendBack && isTeacher"
                @click="handleSendBack"
                class="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw class="w-4 h-4" />
                打回重做
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
