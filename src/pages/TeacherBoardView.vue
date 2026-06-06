<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useHomeworkStore } from '@/stores/homework'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import RoleBadge from '@/components/common/RoleBadge.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import SubjectTag from '@/components/common/SubjectTag.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import HomeworkDetailDialog from '@/components/dialog/HomeworkDetailDialog.vue'
import GradeDialog from '@/components/dialog/GradeDialog.vue'
import CreateHomeworkDialog from '@/components/dialog/CreateHomeworkDialog.vue'
import KanbanBoard from '@/components/board/KanbanBoard.vue'
import type { Homework, Subject, HomeworkStatus } from '@/types/homework'
import {
  LogOut,
  Plus,
  Filter,
  SortAsc,
  BookOpen,
  ChevronDown,
} from 'lucide-vue-next'
import { getAllSubjects, SUBJECT_CONFIG, STATUS_CONFIG } from '@/utils/subject'

const router = useRouter()
const userStore = useUserStore()
const homeworkStore = useHomeworkStore()
const uiStore = useUiStore()

const { currentUser, isTeacher } = storeToRefs(userStore)
const { filters, selectedHomework } = storeToRefs(homeworkStore)

const detailDialogVisible = ref(false)
const gradeDialogVisible = ref(false)
const createDialogVisible = ref(false)
const subjectDropdownOpen = ref(false)
const studentDropdownOpen = ref(false)

const subjects = getAllSubjects()
const allStudents = computed(() => userStore.students)

const selectedSubjectName = computed(() => {
  if (!filters.value.subject) return '全部科目'
  return SUBJECT_CONFIG[filters.value.subject].name
})

const selectedStudentName = computed(() => {
  if (!filters.value.studentId) return '全部学生'
  const student = allStudents.value.find((s) => s.id === filters.value.studentId)
  return student?.name || '全部学生'
})

async function loadData() {
  await homeworkStore.loadHomeworksForCurrentUser()
}

function handleCardClick(homework: Homework) {
  homeworkStore.selectHomework(homework.id)
  detailDialogVisible.value = true
}

function handleGrade() {
  detailDialogVisible.value = false
  gradeDialogVisible.value = true
}

function handleGraded() {
  gradeDialogVisible.value = false
  detailDialogVisible.value = true
}

function handleStatusChange() {
  // 状态变化后刷新详情
  // 数据已经在 store 中更新了
}

function handleCreated() {
  // 作业创建后刷新
  loadData()
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

function toggleSubject(subject?: Subject) {
  homeworkStore.setFilter('subject', subject)
  subjectDropdownOpen.value = false
}

function toggleStudent(studentId?: string) {
  homeworkStore.setFilter('studentId', studentId)
  studentDropdownOpen.value = false
}

function toggleSortByDeadline() {
  homeworkStore.setFilter('sortByDeadline', !filters.value.sortByDeadline)
}

function closeDetailDialog() {
  detailDialogVisible.value = false
  homeworkStore.selectHomework(null)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="px-6 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen class="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 class="text-lg font-bold text-gray-800">作业看板</h1>
                <p class="text-xs text-gray-400">教师端 · 全班视图</p>
              </div>
            </div>

            <div class="h-8 w-px bg-gray-200 mx-2" />

            <RoleBadge
              v-if="currentUser"
              :role="currentUser.role"
              :name="currentUser.name"
              :subject="currentUser.subject"
            />
          </div>

          <div class="flex items-center gap-3">
            <div class="relative">
              <button
                @click="subjectDropdownOpen = !subjectDropdownOpen"
                class="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter class="w-4 h-4 text-gray-400" />
                <span>{{ selectedSubjectName }}</span>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
              </button>

              <div
                v-if="subjectDropdownOpen"
                class="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
              >
                <button
                  @click="toggleSubject(undefined)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  :class="{ 'text-blue-600 bg-blue-50': !filters.subject }"
                >
                  全部科目
                </button>
                <button
                  v-for="subject in subjects"
                  :key="subject"
                  @click="toggleSubject(subject)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                  :class="{ 'text-blue-600 bg-blue-50': filters.subject === subject }"
                >
                  <span
                    class="w-2.5 h-2.5 rounded-full"
                    :style="{ backgroundColor: SUBJECT_CONFIG[subject].color }"
                  />
                  {{ SUBJECT_CONFIG[subject].name }}
                </button>
              </div>
            </div>

            <div class="relative">
              <button
                @click="studentDropdownOpen = !studentDropdownOpen"
                class="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span class="text-gray-500">学生:</span>
                <span>{{ selectedStudentName }}</span>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
              </button>

              <div
                v-if="studentDropdownOpen"
                class="absolute top-full right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 max-h-60 overflow-y-auto"
              >
                <button
                  @click="toggleStudent(undefined)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  :class="{ 'text-blue-600 bg-blue-50': !filters.studentId }"
                >
                  全部学生
                </button>
                <button
                  v-for="student in allStudents"
                  :key="student.id"
                  @click="toggleStudent(student.id)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  :class="{ 'text-blue-600 bg-blue-50': filters.studentId === student.id }"
                >
                  {{ student.name }}
                </button>
              </div>
            </div>

            <button
              @click="toggleSortByDeadline"
              class="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              :class="{ 'bg-blue-50 border-blue-200 text-blue-600': filters.sortByDeadline }"
            >
              <SortAsc class="w-4 h-4" />
              <span>截止时间</span>
            </button>

            <div class="w-56">
              <SearchInput
                v-model="filters.search"
                placeholder="搜索题号/评语/学生..."
              />
            </div>

            <button
              @click="createDialogVisible = true"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus class="w-4 h-4" />
              布置作业
            </button>

            <button
              @click="handleLogout"
              class="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut class="w-4 h-4" />
              退出
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          共 <span class="font-semibold text-gray-700">{{ homeworkStore.filteredHomeworks.length }}</span> 份作业
        </div>
      </div>

      <KanbanBoard
        show-student-name
        role="teacher"
        @card-click="handleCardClick"
        @status-change="handleStatusChange"
      />
    </main>

    <HomeworkDetailDialog
      :visible="detailDialogVisible"
      :homework="selectedHomework"
      @close="closeDetailDialog"
      @grade="handleGrade"
      @status-change="handleStatusChange"
    />

    <GradeDialog
      :visible="gradeDialogVisible"
      :homework="selectedHomework"
      @close="gradeDialogVisible = false"
      @graded="handleGraded"
    />

    <CreateHomeworkDialog
      :visible="createDialogVisible"
      @close="createDialogVisible = false"
      @created="handleCreated"
    />

    <ToastContainer />
  </div>
</template>
