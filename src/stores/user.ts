import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types/user'
import { getTeachers, getStudents, initMockUsers } from '@/db/userDB'
import { openDB } from '@/db'
import { initMockHomeworks } from '@/db/homeworkDB'

const STORAGE_KEY = 'homework-board-current-user'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const teachers = ref<User[]>([])
  const students = ref<User[]>([])
  const isInitialized = ref(false)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const isTeacher = computed(() => currentUser.value?.role === 'teacher')
  const isStudent = computed(() => currentUser.value?.role === 'student')

  async function init() {
    if (isInitialized.value) return

    try {
      await openDB()
    } catch (e) {
      console.error('打开数据库失败:', e)
    }

    try {
      await initMockUsers()
    } catch (e) {
      console.error('初始化用户数据失败:', e)
    }

    try {
      await initMockHomeworks()
    } catch (e) {
      console.error('初始化作业数据失败:', e)
    }

    try {
      await loadUsers()
    } catch (e) {
      console.error('加载用户列表失败:', e)
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const userData = JSON.parse(saved)
        currentUser.value = userData
      } catch (e) {
        console.error('Failed to restore user session', e)
      }
    }

    isInitialized.value = true
  }

  async function loadUsers() {
    teachers.value = await getTeachers()
    students.value = await getStudents()
  }

  function login(user: User) {
    currentUser.value = user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function getUserRole(): UserRole | null {
    return currentUser.value?.role || null
  }

  return {
    currentUser,
    teachers,
    students,
    isInitialized,
    isLoggedIn,
    isTeacher,
    isStudent,
    init,
    loadUsers,
    login,
    logout,
    getUserRole,
  }
})
