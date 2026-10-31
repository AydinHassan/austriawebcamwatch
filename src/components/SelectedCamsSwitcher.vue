<script setup lang="ts">
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import SortableList from '@/components/SortableList.vue'
import { DragHandleDots2Icon } from '@radix-icons/vue'
import { usePresetsStore } from '@/stores/presets'

import { ref } from 'vue'

const {cams} = defineProps(['cams', 'modelValue'])

const open = ref(false)
defineExpose({
  open
})

const presetsStore = usePresetsStore()

// Dropping a dragged item fires the item's own select handler, so ignore
// selection and closing while a drag is in progress or has just ended
let dragging = false
let droppedAt = 0
const isDragging = () => dragging || Date.now() - droppedAt < 400

function onDragEnd() {
  dragging = false
  droppedAt = Date.now()
}

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

function onChange(name: string) {
  if (isDragging()) return
  emit('update:modelValue', cams.find(c => c.name === name))
}

function onOpenChange(value: boolean) {
  if (!value && isDragging()) return
  open.value = value
}
</script>

<template>
  <Select
    :open="open"
    :modelValue="modelValue ? modelValue.name : null"
    @update:open="onOpenChange"
    @update:modelValue="onChange"
  >
    <SelectTrigger class="">
      <SelectValue placeholder="Select a cam" />
    </SelectTrigger>
    <SelectContent class="w-[var(--radix-select-trigger-width)]">
      <SortableList
        handle=".drag-handle"
        @start="dragging = true"
        @end="onDragEnd"
        @move="presetsStore.moveWebcam"
      >
        <SelectItem
          v-for="cam in cams"
          :key="cam.name"
          :value="cam.name"
          class="gap-2 py-0 [&>span]:min-w-0"
        >
          <span class="block truncate">{{ cam.name }}</span>
          <template #end>
            <span
              class="drag-handle ml-auto flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground"
              aria-label="Drag to reorder"
            >
              <DragHandleDots2Icon class="h-4 w-4" />
            </span>
          </template>
        </SelectItem>
      </SortableList>
    </SelectContent>
  </Select>
</template>
