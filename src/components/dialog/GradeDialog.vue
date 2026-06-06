<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, CheckCircle2, MessageSquare } from 'lucide-vue-next'
import type { Homework } from '@/types/homework'
import { useHomeworkStore } from '@/stores/homework'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import SubjectTag from '@/components/common/SubjectTag.vue'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  visible: boolean
  homework: Homework | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'graded'): void
}>()

const homeworkStore = useHomeworkStore()
const uiStore = useUiStore()
const userStore = useUserStore()

const { currentUser } = storeToRefs(userStore)

const score = ref<number>(0)
const comment = ref('')
const needsRevision = ref(false)
const submitting = ref(false)

const isRegrade = computed(() => props.homework?.status === 'graded')

watch(
  () => props.visible,
  (visible) => {
    if (visible && props.homework) {
      score.value = props.homework.score ?? 0
      comment.value = props.homework.comment ?? ''
      needsRevision.value = props.homework.needsRevision ?? score.value < 60
    }
  }
)

watch(score, (newScore) => {
  if (newScore < 60 && !props.homework?.needsRevision) {
    needsRevision.value = true
  }
})

async function handleSubmit() {
  if (!props.homework) return
  
  submitting.value = true
  try {
    const targetStatus = 'graded'
    await homeworkStore.transitionStatus(props.homework.id, targetStatus, {
      score: score.value,
      comment: comment.value,
      needsRevision: needsRevision.value,
      remark: isRegrade.value ? '重新批改' : '批改作业',
    })
    uiStore.showSuccess(isRegrade.value ? '已重新批改' : '批改完成')
    emit('graded')
    emit('close')
  } catch (err: any) {
    uiStore.showError(err.message || '批改失败')
  } finally {
    submitting.value = false
  }
}

function setScore(val: number) {
  score.value = Math.max(0, Math.min(100, val))
}
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

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-purple-50">
            <div class="flex items-center gap-3">
              <CheckCircle2 class="w-5 h-5 text-purple-600" />
              <h2 class="text-lg font-semibold text-gray-800">
                {{ isRegrade ? '重新批改' : '批改作业' }}
              </h2>
            </div>
            <button
              @click="emit('close')"
              class="p-2 rounded-lg hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-700"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 space-y-5">
            <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
              <SubjectTag :subject="homework.subject" />
              <span class="text-sm font-medium text-gray-700">{{ homework.title }}</span>
            </div>

            <div class="text-center">
              <label class="text-sm font-medium text-gray-700 mb-3 block">分数</label>
              <div class="flex items-center justify-center gap-4">
                <button
                  @click="setScore(score - 5)"
                  class="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
                >
                  -
                </button>
                <div class="relative">
                  <input
                    v-model.number="score"
                    type="number"
                    min="0"
                    max="100"
                    class="w-28 h-16 text-center text-4xl font-bold text-purple-600 border-b-2 border-purple-200 focus:border-purple-500 outline-none bg-transparent"
                  />
                  <span class="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-lg">分</span>
                </div>
                <button
                  @click="setScore(score + 5)"
                  class="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
                >
                  +
                </button>
              </div>
              <div class="flex justify-center gap-2 mt-3">
                <button
                  v-for="s in [60, 75, 85, 95, 100]"
                  :key="s"
                  @click="score = s"
                  class="px-3 py-1 text-xs rounded-full transition-colors"
                  :class="score === s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                >
                  {{ s }}分
                </button>
              </div>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-2">
                <MessageSquare class="w-4 h-4 text-gray-400" />
                <label class="text-sm font-medium text-gray-700">评语</label>
              </div>
              <textarea
                v-model="comment"
                rows="3"
                placeholder="请输入评语..."
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="needsRevision"
                type="checkbox"
                id="needsRevision"
                class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label for="needsRevision" class="text-sm text-gray-600">
                需要订正（分数低于60分时自动勾选）
              </label>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
            <button
              @click="emit('close')"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="handleSubmit"
              :disabled="submitting"
              class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle2 class="w-4 h-4" />
              {{ submitting ? '提交中...' : '确认批改' }}
            </button>
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

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
