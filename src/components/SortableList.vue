<script setup lang="ts">
import { ref } from 'vue'
import { useSortable, insertNodeAt, removeNode } from '@vueuse/integrations/useSortable'

const { handle } = defineProps<{ handle?: string }>()
const emit = defineEmits<{ move: [from: number, to: number]; start: []; end: [] }>()

const el = ref<HTMLElement | null>(null)

useSortable(el, [], {
  handle,
  animation: 150,
  // Same drag behaviour on mouse and touch, styled below
  forceFallback: true,
  ghostClass: 'sortable-placeholder',
  fallbackClass: 'sortable-dragging',
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

<style>
/* The gap left where the item will drop: an empty highlighted slot */
.sortable-placeholder {
  outline: 1px dashed hsl(var(--muted-foreground) / 0.5);
  outline-offset: -1px;
  border-radius: calc(var(--radius) - 2px);
}
.sortable-placeholder > * {
  visibility: hidden;
}

/* The copy that follows the finger */
.sortable-dragging {
  opacity: 1 !important;
  background: hsl(var(--accent));
  border-radius: calc(var(--radius) - 2px);
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.5);
}
</style>
