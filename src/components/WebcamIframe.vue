<script setup lang="ts">
import Iframe from '@/components/Iframe.vue'
import { Webcam } from '@/services/webcams'
import { computed, ref } from 'vue'

const props = defineProps<{webcam: Webcam}>()

const url = computed(() => {
  if (props.webcam.provider === 'panomax') {
    const url = new URL(props.webcam.url)
    url.searchParams.set('hidetopbar', '1')
    url.searchParams.set('zoomwheel', 'false')
    url.searchParams.set('compass', 'false')
    url.searchParams.set('zoomslider', 'false')
    url.searchParams.set('weather', 'false')
    url.searchParams.set('theme', 'noGui')

    return url.toString()
  }

  return props.webcam.url
})

const iframeEl = ref(null)

const refreshCam = () => {
  iframeEl.value.reinitIframe()
}

defineExpose({refreshCam})
</script>

<template>
  <Iframe :src="url" :provider="webcam.provider" class="h-full w-full" ref="iframeEl" />
</template>

