<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useHomeworkStore } from '@/stores/homework'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import RoleBadge from '@/components/common/RoleBadge.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import HomeworkDetailDialog from '@/components/dialog/HomeworkDetailDialog.vue'
import KanbanBoard from '@/components/board/KanbanBoard.vue'
import type { Homework, Subject, HomeworkStatus } from '@/types/homework'
import {
  LogOut,
  Filter,
  BookOpen,
  ChevronDown,
} from 'lucide-vue-next'
import { getAllSubjects, SUBJECT_CONFIG, STATUS_CONFIG, STATUS_ORDER } from '@/utils/subject'

const router = useRouter()
const userStore = useUserStore()
const homeworkStore = useHomeworkStore()
const uiStore = useUiStore()

const { currentUser, isStudent } = storeToRefs(userStore)
const { filters, selectedHomework } = storeToRefs(homeworkStore)

const detailDialogVisible = ref(false)
const subjectDropdownOpen = ref(false)
const statusDropdownOpen = ref(false)

const subjects = getAllSubjects()

const selectedSubjectName = computed(() => {
  if (!filters.value.subject) return '全部科目'
  return SUBJECT_CONFIG[filters.value.subject].name
})

const selectedStatusName = computed(() => {
  if (!filters.value.status) return '全部状态'
  return STATUS_CONFIG[filters.value.status].name
})

async function loadData() {
  await homeworkStore.loadHomeworksForCurrentUser()
}

function handleCardClick(homework: Homework) {
  homeworkStore.selectHomework(homework.id)
  detailDialogVisible.value = true
}

function handleStatusChange() {
  // 状态变化后刷新
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

function toggleSubject(subject?: Subject) {
  homeworkStore.setFilter('subject', subject)
  subjectDropdownOpen.value = false
}

function toggleStatus(status?: HomeworkStatus) {
  homeworkStore.setFilter('status', status)
  statusDropdownOpen.value = false
}

function closeDetailDialog() {
  detailDialogVisible.value = false
  homeworkStore.selectHomework(null)
}

const statusCounts = computed(() => {
  const counts: Record<HomeworkStatus, number> = {
    todo: 0,
    in_progress: 0,
    submitted: 0,
    graded: 0,
    revised: 0,
  }
  for (const hw of homeworkStore.filteredHomeworks) {
    counts[hw.status]++
  }
  return counts
})

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
              <div class="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                <BookOpen class="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 class="text-lg font-bold text-gray-800">我的作业</h1>
                <p class="text-xs text-gray-400">学生端 · 个人视图</p>
              </div>
            </div>

            <div class="h-8 w-px bg-gray-200 mx-2" />

            <RoleBadge
              v-if="currentUser"
              :role="currentUser.role"
              :name="currentUser.name"
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
                  :class="{ 'text-green-600 bg-green-50': !filters.subject }"
                >
                  全部科目
                </button>
                <button
                  v-for="subject in subjects"
                  :key="subject"
                  @click="toggleSubject(subject)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                  :class="{ 'text-green-600 bg-green-50': filters.subject === subject }"
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
                @click="statusDropdownOpen = !statusDropdownOpen"
                class="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span class="text-gray-500">状态:</span>
                <span>{{ selectedStatusName }}</span>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
              </button>

              <div
                v-if="statusDropdownOpen"
                class="absolute top-full right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
              >
                <button
                  @click="toggleStatus(undefined)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  :class="{ 'text-green-600 bg-green-50': !filters.status }"
                >
                  全部状态
                </button>
                <button
                  v-for="status in STATUS_ORDER"
                  :key="status"
                  @click="toggleStatus(status)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  :class="{ 'text-green-600 bg-green-50': filters.status === status }"
                >
                  {{ STATUS_CONFIG[status].name }}
                  <span class="text-xs text-gray-400 ml-1">
                    ({{ statusCounts[status] }})
                  </span>
                </button>
              </div>
            </div>

            <div class="w-56">
              <SearchInput
                v-model="filters.search"
                placeholder="搜索题号/评语..."
              />
            </div>

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
        role="student"
        @card-click="handleCardClick"
        @status-change="handleStatusChange"
      />
    </main>

    <HomeworkDetailDialog
      :visible="detailDialogVisible"
      :homework="selectedHomework"
      @close="closeDetailDialog"
      @status-change="handleStatusChange"
    />

    <ToastContainer />
  </div>
</template>
