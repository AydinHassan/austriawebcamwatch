<script setup>
import { cn } from '@/lib/utils';
import { CameraIcon } from '@radix-icons/vue'


const props = defineProps({
  class: { type: null, required: false },
});
</script>

<template>
  <button
    :class="
      cn(
        'flex items-center flex-col justify-center rounded-lg border bg-card text-card-foreground shadow-sm border border-dashed p-12 text-center hover:text-primary cursor-pointer',
        props.class,
      )
    "
  >
    <CameraIcon class="w-6 h-6" />
    <span class="mt-2 block text-sm font-semibold hover:text-primary">Add a new webcam</span>
  </button>
</template>
