<script setup>

import { inject } from 'vue'
import WebcamGrid from '@/components/WebcamGrid.vue'

const selectedPreset = inject('selectedPreset')
</script>

<template>
  <WebcamGrid :webcams="selectedPreset.cams" show-placeholders allow-share allow-toggle></WebcamGrid>
</template>
