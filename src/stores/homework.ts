import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Homework, HomeworkStatus, Subject, HomeworkCreateInput } from '@/types/homework'
import type { User } from '@/types/user'
import {
  getAllHomeworkList,
  getStudentHomeworks,
  transitionHomeworkStatus,
  deleteHomeworkService,
  createHomeworkService,
  filterHomeworks,
  groupHomeworksByStatus,
} from '@/services/homeworkService'
import { useUserStore } from './user'
import { STATUS_ORDER } from '@/utils/subject'

export const useHomeworkStore = defineStore('homework', () => {
  const homeworks = ref<Homework[]>([])
  const loading = ref(false)
  const selectedHomeworkId = ref<string | null>(null)

  const filters = ref({
    subject: undefined as Subject | undefined,
    studentId: undefined as string | undefined,
    status: undefined as HomeworkStatus | undefined,
    search: '',
    sortByDeadline: false,
  })

  const userStore = useUserStore()

  const filteredHomeworks = computed(() => {
    return filterHomeworks(homeworks.value, filters.value)
  })

  const homeworksByStatus = computed(() => {
    return groupHomeworksByStatus(filteredHomeworks.value)
  })

  const selectedHomework = computed(() => {
    if (!selectedHomeworkId.value) return null
    return homeworks.value.find((h) => h.id === selectedHomeworkId.value) || null
  })

  const statusCounts = computed(() => {
    const counts: Record<HomeworkStatus, number> = {
      todo: 0,
      in_progress: 0,
      submitted: 0,
      graded: 0,
      revised: 0,
    }
    for (const hw of filteredHomeworks.value) {
      counts[hw.status]++
    }
    return counts
  })

  async function loadAllHomeworks() {
    loading.value = true
    try {
      homeworks.value = await getAllHomeworkList()
    } finally {
      loading.value = false
    }
  }

  async function loadStudentHomeworks(studentId: string) {
    loading.value = true
    try {
      homeworks.value = await getStudentHomeworks(studentId)
    } finally {
      loading.value = false
    }
  }

  async function loadHomeworksForCurrentUser() {
    if (!userStore.currentUser) return

    if (userStore.isTeacher) {
      await loadAllHomeworks()
    } else {
      await loadStudentHomeworks(userStore.currentUser.id)
    }
  }

  async function transitionStatus(
    homeworkId: string,
    targetStatus: HomeworkStatus,
    options?: any
  ) {
    if (!userStore.currentUser) throw new Error('未登录')

    const result = await transitionHomeworkStatus(
      homeworkId,
      targetStatus,
      userStore.currentUser,
      options
    )

    if (result) {
      const index = homeworks.value.findIndex((h) => h.id === homeworkId)
      if (index !== -1) {
        homeworks.value[index] = result
      }
    }

    return result
  }

  async function createHomework(input: HomeworkCreateInput) {
    if (!userStore.currentUser) throw new Error('未登录')

    const homework = await createHomeworkService(input, userStore.currentUser as User)
    homeworks.value.unshift(homework)
    return homework
  }

  async function deleteHomework(homeworkId: string) {
    if (!userStore.currentUser) throw new Error('未登录')

    await deleteHomeworkService(homeworkId, userStore.currentUser as User)
    homeworks.value = homeworks.value.filter((h) => h.id !== homeworkId)
  }

  function selectHomework(id: string | null) {
    selectedHomeworkId.value = id
  }

  function setFilter(key: keyof typeof filters.value, value: any) {
    ;(filters.value as any)[key] = value
  }

  function resetFilters() {
    filters.value = {
      subject: undefined,
      studentId: undefined,
      status: undefined,
      search: '',
      sortByDeadline: false,
    }
  }

  function getHomeworksByColumn(status: HomeworkStatus): Homework[] {
    return homeworksByStatus.value[status] || []
  }

  return {
    homeworks,
    loading,
    filters,
    filteredHomeworks,
    homeworksByStatus,
    selectedHomeworkId,
    selectedHomework,
    statusCounts,
    loadAllHomeworks,
    loadStudentHomeworks,
    loadHomeworksForCurrentUser,
    transitionStatus,
    createHomework,
    deleteHomework,
    selectHomework,
    setFilter,
    resetFilters,
    getHomeworksByColumn,
  }
})
