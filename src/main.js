import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/css/hr1.css'
import './assets/css/leaflet1.7.1.css'
import './assets/css/jquery.mobile-1.4.5.min.css'


const app = createApp(App)

app.use(router)

app.mount('#app')
