<script setup lang="ts">
import Iframe from '@/components/Iframe.vue'
import CamViewer from '@/components/CamViewer.vue'
import { hasOwnViewer, type Webcam } from '@/services/webcams'
import { computed, ref, watch } from 'vue'

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

// Use the provider's embed when our viewer cannot load the cam
const viewerFailed = ref(false)
watch(() => props.webcam.name, () => (viewerFailed.value = false))

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
  <CamViewer
    v-if="hasOwnViewer(webcam) && !viewerFailed"
    :webcam="webcam"
    class="h-full w-full"
    ref="viewerEl"
    @unavailable="viewerFailed = true"
  />
  <Iframe v-else :src="url" :provider="webcam.provider" class="h-full w-full" ref="iframeEl" />
</template>
