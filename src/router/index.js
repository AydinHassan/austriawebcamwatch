import { createRouter, createWebHistory } from 'vue-router'

import MapView from '../views/Map.vue';
import HomeView from '../views/Home.vue';
import ShareView from '../views/Share.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/map', component: MapView },
    { path: '/share', component: ShareView },
  ]
})

export default router
