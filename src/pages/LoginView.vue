<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import type { UserRole, User } from '@/types/user'
import { GraduationCap, User as UserIcon, ArrowRight, BookOpen } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUiStore()

const { teachers, students, isInitialized } = storeToRefs(userStore)

const selectedRole = ref<UserRole>('student')
const selectedUserId = ref('')

const userList = computed(() => {
  return selectedRole.value === 'teacher' ? teachers.value : students.value
})

const selectedUser = computed(() => {
  return userList.value.find((u) => u.id === selectedUserId.value)
})

const canLogin = computed(() => {
  return selectedUserId.value !== ''
})

function selectRole(role: UserRole) {
  selectedRole.value = role
  selectedUserId.value = ''
}

function selectUser(user: User) {
  selectedUserId.value = user.id
}

function handleLogin() {
  if (!selectedUser.value) return
  
  userStore.login(selectedUser.value)
  uiStore.showSuccess(`欢迎，${selectedUser.value.name}！`)
  
  if (selectedRole.value === 'teacher') {
    router.push('/teacher')
  } else {
    router.push('/student')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style="animation-delay: 1s" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style="animation-delay: 2s" />
    </div>

    <div class="relative w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
          <BookOpen class="w-8 h-8 text-blue-600" />
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">作业看板</h1>
        <p class="text-gray-500">高效管理作业，清晰掌握进度</p>
      </div>

      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="flex">
          <button
            @click="selectRole('student')"
            class="flex-1 py-4 text-center transition-all relative"
            :class="selectedRole === 'student'
              ? 'text-green-600 bg-green-50 font-semibold'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
          >
            <UserIcon class="w-5 h-5 mx-auto mb-1" />
            <span class="text-sm">学生</span>
            <div
              v-if="selectedRole === 'student'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
            />
          </button>
          <button
            @click="selectRole('teacher')"
            class="flex-1 py-4 text-center transition-all relative"
            :class="selectedRole === 'teacher'
              ? 'text-blue-600 bg-blue-50 font-semibold'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
          >
            <GraduationCap class="w-5 h-5 mx-auto mb-1" />
            <span class="text-sm">老师</span>
            <div
              v-if="selectedRole === 'teacher'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          </button>
        </div>

        <div class="p-6">
          <label class="text-sm font-medium text-gray-700 mb-3 block">
            选择身份
          </label>
          <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            <button
              v-for="user in userList"
              :key="user.id"
              @click="selectUser(user)"
              class="p-3 rounded-xl border-2 text-left transition-all"
              :class="selectedUserId === user.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  :class="selectedRole === 'teacher' ? 'bg-blue-500' : 'bg-green-500'"
                >
                  {{ user.name.charAt(0) }}
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-800">{{ user.name }}</div>
                  <div
                    v-if="user.subject"
                    class="text-xs text-gray-400"
                  >
                    {{ user.subject }}
                  </div>
                </div>
              </div>
            </button>
          </div>

          <button
            @click="handleLogin"
            :disabled="!canLogin"
            class="w-full mt-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            :class="{
              'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30': selectedRole === 'student' && canLogin,
              'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30': selectedRole === 'teacher' && canLogin,
              'bg-gray-200 text-gray-400 cursor-not-allowed': !canLogin,
            }"
          >
            <span>进入看板</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <p class="text-center text-gray-400 text-xs mt-6">
        校园内网 · 本地数据存储
      </p>
    </div>
  </div>
</template>
