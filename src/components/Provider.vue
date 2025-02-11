<script setup>
import { Badge } from '@/components/ui/badge/index.js'

const props = defineProps({
  cam: Object
})
</script>

<template>
  <Badge v-if="cam.provider === 'panomax'" variant="outline" class="ml-3 text-[9px] border-green-400/20 text-green-500">Panomax</Badge>
  <Badge v-if="cam.provider === 'bergfex'" variant="outline" class="ml-3 text-[9px] border-sky-400/20 text-sky-500">Bergfex</Badge>
</template>
