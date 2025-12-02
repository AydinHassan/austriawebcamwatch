<script setup>
import WebcamGrid from '@/components/WebcamGrid.vue'
import { usePresetsStore } from '@/stores/presets'

const presetsStore = usePresetsStore()
</script>

<template>
  <WebcamGrid :webcams="presetsStore.selectedPreset?.cams ?? []" show-placeholders allow-share allow-toggle></WebcamGrid>
</template>
