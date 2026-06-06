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
  await userStore.init()
  app.mount('#app')
}

initApp()
