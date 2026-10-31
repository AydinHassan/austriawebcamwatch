<script setup lang="ts">
import Iframe from '@/components/Iframe.vue'
import PanomaxViewer from '@/components/PanomaxViewer.vue'
import { hasPanoViewer, type Webcam } from '@/services/webcams'
import { computed, ref } from 'vue'

const props = defineProps<{webcam: Webcam}>()

const url = computed(() => {
  if (props.webcam.provider === 'panomax') {
    // Fallback for cams without a camId: the Panomax GUI is full of ads
    const url = new URL(props.webcam.url)
    url.searchParams.set('theme', 'noGui')
    return url.toString()
  }

  return props.webcam.url
})

const iframeEl = ref(null)
const viewerEl = ref(null)

const refreshCam = () => {
  if (viewerEl.value) {
    viewerEl.value.refresh()
  } else {
    iframeEl.value.reinitIframe()
  }
}

defineExpose({refreshCam})
</script>

<template>
  <PanomaxViewer v-if="hasPanoViewer(webcam)" :webcam="webcam" class="h-full w-full" ref="viewerEl" />
  <Iframe v-else :src="url" :provider="webcam.provider" class="h-full w-full" ref="iframeEl" />
</template>
