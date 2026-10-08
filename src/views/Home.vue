<script setup>
import WebcamGrid from '@/components/WebcamGrid.vue'
import { usePresetsStore } from '@/stores/presets'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Austria Webcam Watch – Live Webcams Across Austria',
  link: [{ rel: 'canonical', href: 'https://www.austriawebcamwatch.at/' }],
})

const presetsStore = usePresetsStore()
</script>

<template>
  <WebcamGrid :webcams="presetsStore.selectedPreset?.cams ?? []" show-placeholders allow-share allow-toggle></WebcamGrid>
</template>
