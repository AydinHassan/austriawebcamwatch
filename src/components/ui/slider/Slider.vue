<script setup>
import { cn } from '@/lib/utils'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'radix-vue'
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: false },
  defaultValue: { type: Array, required: false },
  modelValue: { type: [Array, null], required: false },
  disabled: { type: Boolean, required: false },
  orientation: { type: String, required: false },
  dir: { type: String, required: false },
  inverted: { type: Boolean, required: false },
  min: { type: Number, required: false },
  max: { type: Number, required: false },
  step: { type: Number, required: false },
  minStepsBetweenThumbs: { type: Number, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
})
const emits = defineEmits(['update:modelValue', 'valueCommit'])

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SliderRoot
    :class="
      cn(
        'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:w-1.5 data-[orientation=vertical]:h-full data-[disabled]:opacity-50',
        props.class,
      )
    "
    v-bind="forwarded"
  >
    <SliderTrack
      class="relative h-1.5 w-full data-[orientation=vertical]:w-1.5 grow overflow-hidden rounded-full bg-secondary"
    >
      <SliderRange class="absolute h-full data-[orientation=vertical]:w-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>
