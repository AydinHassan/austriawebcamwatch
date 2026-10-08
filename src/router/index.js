import { createRouter, createWebHistory } from 'vue-router'

import MapView from '../views/Map.vue';
import HomeView from '../views/Home.vue';
import ShareView from '../views/Share.vue';

const SITE_URL = 'https://www.austriawebcamwatch.at'
const SITE_NAME = 'Austria Webcam Watch'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView, meta: { title: `${SITE_NAME} – Live Webcams Across Austria` } },
    { path: '/map', component: MapView, meta: { title: `Austria Webcam Map – ${SITE_NAME}` } },
    { path: '/share', component: ShareView, meta: { title: `Shared Webcams – ${SITE_NAME}`, noindex: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ]
})

function setHeadTag(selector, tag, attrs) {
  let el = document.head.querySelector(selector)
  if (!attrs) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement(tag)
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
}

router.afterEach((to) => {
  document.title = to.meta.title ?? SITE_NAME
  setHeadTag('link[rel="canonical"]', 'link', { rel: 'canonical', href: SITE_URL + to.path })
  setHeadTag('meta[name="robots"]', 'meta', to.meta.noindex ? { name: 'robots', content: 'noindex' } : null)
})

export default router
