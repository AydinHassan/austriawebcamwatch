<script setup lang="ts">
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem  } from '@/components/ui/select'

import { ref } from 'vue'

const {cams} = defineProps(['cams', 'modelValue'])

const open = ref(false)
defineExpose({
  open
})


const emit = defineEmits<{
  'update:modelValue': [string]
}>()

function onChange(name: string) {
  emit('update:modelValue', cams.find(c => c.name === name))
}
</script>

<template>
  <Select :modelValue="modelValue ? modelValue.name : null" @update:modelValue="onChange">
    <SelectTrigger class="">
      <SelectValue placeholder="Select a cam" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem v-for="cam in cams" :key="cam.name" :value="cam.name">
          {{cam.name}}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
