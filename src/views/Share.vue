<script setup>
import WebcamGrid from '@/components/WebcamGrid.vue'

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getWebcamById } from '@/services/webcams'

const route = useRoute()
import { useRouter } from 'vue-router'
import WebcamGridItem from '@/components/WebcamGridItem.vue'

const webcams = ref([]);

const query = route.query.c
if (query) {
  const camIds = JSON.parse(atob(query))
  webcams.value = camIds
    .map(id => getWebcamById(id))
    .filter(Boolean)

} else {
  const router = useRouter()
  router.push('/')
}
</script>

<template>
  <WebcamGrid v-if="webcams.length > 1" :webcams="webcams" :allow-share="false" :allow-toggle="false" :show-placeholders="false"></WebcamGrid>
  <div v-else class="p-4 h-full">
    <WebcamGridItem class="p-4"  :webcam="webcams[0]" :allow-toggle="false" :allow-share="false"></WebcamGridItem>
  </div>
</template>
