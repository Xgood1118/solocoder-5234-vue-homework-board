import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LoginView from '@/pages/LoginView.vue'
import TeacherBoardView from '@/pages/TeacherBoardView.vue'
import StudentBoardView from '@/pages/StudentBoardView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/teacher',
    name: 'teacher',
    component: TeacherBoardView,
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/student',
    name: 'student',
    component: StudentBoardView,
    meta: { requiresAuth: true, role: 'student' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.role && userStore.currentUser?.role !== to.meta.role) {
    if (userStore.isTeacher) {
      next('/teacher')
    } else if (userStore.isStudent) {
      next('/student')
    } else {
      next('/login')
    }
    return
  }

  if (to.path === '/login' && userStore.isLoggedIn) {
    if (userStore.isTeacher) {
      next('/teacher')
    } else {
      next('/student')
    }
    return
  }

  next()
})

export default router
