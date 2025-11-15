<template>
  <div
    class="relative overflow-hidden touch-pan-y w-full h-full"
    @touchstart="onStart"
    @touchend="onEnd"
  >
    <Transition
      :enter-active-class="shouldAnimate ? 'transition-transform duration-200' : ''"
      :enter-from-class="shouldAnimate ? (dir === 'left' ? 'translate-x-full' : '-translate-x-full') : ''"
      :enter-to-class="shouldAnimate ? 'translate-x-0' : ''"
      :leave-active-class="shouldAnimate ? 'transition-transform duration-200' : ''"
      :leave-from-class="shouldAnimate ? 'translate-x-0' : ''"
      :leave-to-class="shouldAnimate ? (dir === 'left' ? '-translate-x-full' : 'translate-x-full') : ''"
      mode="out-in"
    >
      <div :key="itemKey" class="w-full h-full">
        <slot />
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps(['itemKey'])

let startX = 0

const shouldAnimate = ref(false)
const dir = ref('left')

function onStart(e) {
  startX = e.touches[0].clientX
}

function onEnd(e) {
  const dx = e.changedTouches[0].clientX - startX

  if (dx > 50) {
    dir.value = 'right'
    triggerAnimation()
    emit('swipe-right')
  } else if (dx < -50) {
    dir.value = 'left'
    triggerAnimation()
    emit('swipe-left')
  }
}

const emit = defineEmits(['swipe-left', 'swipe-right'])

function triggerAnimation() {
  shouldAnimate.value = true
  requestAnimationFrame(() => {
    shouldAnimate.value = false
  })
}
</script>

<style scoped>
.touch-pan-y {
  touch-action: pan-y;
}
</style>
