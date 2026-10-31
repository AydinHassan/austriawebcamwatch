import { createRouter, createWebHistory } from 'vue-router'

import MapView from '../views/Map.vue';
import HomeView from '../views/Home.vue';
import ShareView from '../views/Share.vue';
import ReviewDuplicatesView from '../views/ReviewDuplicates.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/map', component: MapView },
    { path: '/share', component: ShareView },
    // Temporary: review possible Bergfex duplicates (not linked anywhere)
    { path: '/review-duplicates', component: ReviewDuplicatesView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ]
})

export default router
