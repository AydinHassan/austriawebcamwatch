<script setup lang="ts">
import { ref } from 'vue'
import { useSortable, insertNodeAt, removeNode } from '@vueuse/integrations/useSortable'

const { handle } = defineProps<{ handle?: string }>()
const emit = defineEmits<{ move: [from: number, to: number]; start: []; end: [] }>()

const el = ref<HTMLElement | null>(null)

useSortable(el, [], {
  handle,
  animation: 150,
  onStart: () => emit('start'),
  onEnd: () => emit('end'),
  onUpdate(e) {
    // Put the DOM back and let Vue re-render from the new order
    removeNode(e.item)
    insertNodeAt(e.from, e.item, e.oldIndex!)
    emit('move', e.oldIndex!, e.newIndex!)
  },
})
</script>

<template>
  <div ref="el">
    <slot />
  </div>
</template>
