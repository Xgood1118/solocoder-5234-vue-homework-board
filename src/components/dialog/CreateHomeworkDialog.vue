<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Plus, BookOpen } from 'lucide-vue-next'
import type { Subject, HomeworkCreateInput } from '@/types/homework'
import type { User } from '@/types/user'
import { useHomeworkStore } from '@/stores/homework'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { getAllSubjects, SUBJECT_CONFIG } from '@/utils/subject'
import { addDays, formatDate } from '@/utils/date'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const homeworkStore = useHomeworkStore()
const uiStore = useUiStore()
const userStore = useUserStore()

const { students, currentUser } = storeToRefs(userStore)

const subject = ref<Subject>('math')
const title = ref('')
const description = ref('')
const deadline = ref(formatDate(addDays(new Date(), 3), 'YYYY-MM-DD'))
const selectedStudents = ref<string[]>([])
const submitting = ref(false)

const subjects = getAllSubjects()

const allStudents = computed(() => students)

const allSelected = computed(() => {
  return selectedStudents.value.length === allStudents.value.length
})

function toggleSelectAll() {
  if (allSelected.value) {
    selectedStudents.value = []
  } else {
    selectedStudents.value = allStudents.value.map((s) => s.id)
  }
}

function toggleStudent(studentId: string) {
  const index = selectedStudents.value.indexOf(studentId)
  if (index === -1) {
    selectedStudents.value.push(studentId)
  } else {
    selectedStudents.value.splice(index, 1)
  }
}

async function handleSubmit() {
  if (!currentUser.value) return
  if (!title.value.trim()) {
    uiStore.showError('请输入作业标题')
    return
  }
  if (selectedStudents.value.length === 0) {
    uiStore.showError('请至少选择一个学生')
    return
  }

  submitting.value = true
  try {
    const studentMap = new Map(allStudents.value.map((s) => [s.id, s]))

    for (const studentId of selectedStudents.value) {
      const student = studentMap.get(studentId)
      if (!student) continue

      const input: HomeworkCreateInput = {
        subject: subject.value,
        title: title.value.trim(),
        description: description.value.trim(),
        studentId: student.id,
        studentName: student.name,
        assignedBy: currentUser.value.id,
        assignedByName: currentUser.value.name,
        assignedAt: new Date().toISOString(),
        deadline: new Date(deadline.value + 'T23:59:59').toISOString(),
      }

      await homeworkStore.createHomework(input)
    }

    uiStore.showSuccess(`已布置 ${selectedStudents.value.length} 份作业`)
    emit('created')
    emit('close')
    resetForm()
  } catch (err: any) {
    uiStore.showError(err.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  subject.value = 'math'
  title.value = ''
  description.value = ''
  deadline.value = formatDate(addDays(new Date(), 3), 'YYYY-MM-DD')
  selectedStudents.value = []
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="emit('close')"
        />

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-blue-50">
            <div class="flex items-center gap-3">
              <BookOpen class="w-5 h-5 text-blue-600" />
              <h2 class="text-lg font-semibold text-gray-800">布置作业</h2>
            </div>
            <button
              @click="emit('close')"
              class="p-2 rounded-lg hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-700"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label class="text-sm font-medium text-gray-700 mb-2 block">科目</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="s in subjects"
                  :key="s"
                  @click="subject = s"
                  class="px-3 py-1.5 text-sm rounded-lg transition-colors"
                  :class="subject === s
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  :style="subject === s ? { backgroundColor: SUBJECT_CONFIG[s].color } : {}"
                >
                  {{ SUBJECT_CONFIG[s].name }}
                </button>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 mb-2 block">作业标题</label>
              <input
                v-model="title"
                type="text"
                placeholder="例如：第一章课后习题"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 mb-2 block">作业描述</label>
              <textarea
                v-model="description"
                rows="3"
                placeholder="请输入作业详细要求..."
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 mb-2 block">截止日期</label>
              <input
                v-model="deadline"
                type="date"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700">布置给</label>
                <label class="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  全选
                </label>
              </div>
              <div class="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-3 gap-2">
                <label
                  v-for="student in allStudents"
                  :key="student.id"
                  class="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    :value="student.id"
                    :checked="selectedStudents.includes(student.id)"
                    @change="toggleStudent(student.id)"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-gray-700">{{ student.name }}</span>
                </label>
              </div>
              <p class="text-xs text-gray-400 mt-2">
                已选择 {{ selectedStudents.length }} 名学生
              </p>
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
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Plus class="w-4 h-4" />
              {{ submitting ? '布置中...' : '布置作业' }}
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
</style>
