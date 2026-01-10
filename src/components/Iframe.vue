<template>
  <div ref="container" class="h-full w-full relative">
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
      <Loader2 class="h-12 w-12 text-white animate-spin" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import {debounce} from '@/lib/utils.js'
import { Loader2 } from 'lucide-vue-next'

// Props
const props = defineProps({
  src: { type: String, required: true },
  crossorigin: { type: String, default: 'anonymous' },
  target: { type: String, default: '_parent' },
  className: { type: String, default: '' },
  allow: { type: String, default: 'camera *; geolocation *; microphone *; autoplay *' },
  name: { type: String, default: 'vue-iframes' },
  frameId: { type: String, default: 'vue-iframes' },
  scrolling: String,
  width: [String, Number],
  height: [String, Number],
  provider: { type: String, default: null },
})

const emit = defineEmits(['iframe-load', 'load'])

// Refs and unique message IDs
const container = ref(null)
const iframeEl = ref(null)
const isLoading = ref(true)
const iframeLoadedMessage = `IFRAME_LOADED_${uuidv4()}`
const iframeOnReadyStateChangeMessage = `IFRAME_ON_READ_STATE_CHANGE_${uuidv4()}`

// Methods
function removeIframe() {
  while (container.value?.firstChild) {
    container.value.removeChild(container.value.firstChild)
  }
}

function setIframeUrl() {
  if (!iframeEl.value?.contentWindow) {
    initIframe()
  }

  requestAnimationFrame(() => {
    const doc = iframeEl.value.contentWindow.document
    doc.open()
    doc.write(`
    <body onload="window.location.href='${props.src}'; parent.postMessage('${iframeLoadedMessage}', '*')"></body>
    <script>
      window.document.onreadystatechange = function () {
        if (window.document.readyState === 'complete') {
          parent.postMessage('${iframeOnReadyStateChangeMessage}', '*')
        }
      };
    <` + `/script>`)
    doc.close()
  })
}

const reinitIframe = debounce(() => {
  isLoading.value = true
  removeIframe()
  initIframe()
}, 200)

function initIframe() {
  iframeEl.value = document.createElement('iframe')
  iframeEl.value.setAttribute('style', 'visibility: hidden; position: absolute; top: -99999px; border: none;')
  iframeEl.value.setAttribute('frameborder', '0')
  iframeEl.value.setAttribute('id', props.frameId)
  if (props.src) iframeEl.value.setAttribute('iframe-src', props.src)
  if (props.className) iframeEl.value.setAttribute('class', props.className)
  if (props.crossorigin) iframeEl.value.setAttribute('crossorigin', props.crossorigin)
  if (props.target) iframeEl.value.setAttribute('target', props.target)
  if (props.allow) iframeEl.value.setAttribute('allow', props.allow)
  if (props.name) iframeEl.value.setAttribute('name', props.name)
  if (props.scrolling) iframeEl.value.setAttribute('scrolling', props.scrolling)
  if (props.width) iframeEl.value.setAttribute('width', props.width)
  if (props.height) iframeEl.value.setAttribute('height', props.height)

  container.value?.appendChild(iframeEl.value)
  setIframeUrl()
}

defineExpose({ reinitIframe })

function listenForEvents() {
  const handler = (event) => {
    if (event.data === iframeLoadedMessage) {
      emit('iframe-load', event.data)
      iframeEl.value?.setAttribute('style', 'visibility: visible; border: none;')
      // For non-bergfex webcams, stop loading spinner on generic iframe load
      if (props.provider !== 'bergfex') {
        isLoading.value = false
      }
    }
    if (event.data === iframeOnReadyStateChangeMessage) {
      emit('load', iframeEl.value)
    }
    // Check for bergfex iframe load completion
    if (props.provider === 'bergfex' && event.origin === 'https://content.bergfex.at' && typeof event.data === 'number') {
      isLoading.value = false
    }
  }

  window.addEventListener('message', handler, false)
}

// Lifecycle
onMounted(() => {
  listenForEvents()
  initIframe()
})

// Watchers
watch(() => props.src, () => {
  reinitIframe()
})
</script>

<style scoped>
iframe {
  height: 100%;
  width: 100%;
}
</style>
