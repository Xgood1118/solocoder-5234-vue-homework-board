import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from '@/stores/user'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

app.use(router)

async function initApp() {
  const userStore = useUserStore()
  try {
    await userStore.init()
  } catch (err) {
    console.error('应用初始化失败:', err)
  }
  app.mount('#app')
}

initApp()
