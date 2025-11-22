<script setup lang="ts">

import Iframe from '@/components/Iframe.vue'
import SelectedCamsSwitcher from '@/components/SelectedCamsSwitcher.vue'
import EmptyCard from '@/components/ui/card/EmptyCard.vue'
import Swiper from '@/components/Swiper.vue'
import WebcamGridItem from '@/components/WebcamGridItem.vue'
import { ref, inject, computed, watchEffect, watch } from 'vue'
import type {Webcam} from '@/services/webcam'

const webcamSelectorRef = inject('webcamSelectorRef')

const {
  webcams = [],
  allowToggle = true,
  allowShare = true,
  showPlaceholders = true
} = defineProps<{
  webcams: Webcam[]
  allowToggle?: boolean
  allowShare?: boolean
  showPlaceholders?: boolean
}>()

const openSelector = async () => {
  webcamSelectorRef.value.open = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const open = ref(false);
const selectedWebcam = ref(null);

const isMobile = computed(() => window.innerWidth < 768);

watchEffect(() => {
  if (isMobile.value) {
    if (webcams.length > 0) {
      selectedWebcam.value = webcams[0];
    } else {
      selectedWebcam.value = null;
    }
  }
})

function prevCam() {
  const i = webcams.findIndex(c => c.name === selectedWebcam.value.name)
  if (i > 0) {
    selectedWebcam.value = webcams[i - 1]
  }
}

function nextCam() {
  const i = webcams.findIndex(c => c.name === selectedWebcam.value.name)
  if (i < webcams.length - 1) {
    selectedWebcam.value = webcams[i + 1]
  }
}

</script>

<template>
  <template v-if="isMobile">
    <Swiper v-if="selectedWebcam" :item-key="selectedWebcam.name" @swipe-left="nextCam" @swipe-right="prevCam">
      <div class="flex h-full flex-1 flex-grow overflow-scroll overflow-hidden p-4" v-if="selectedWebcam">
        <Iframe :src="selectedWebcam.url" class="h-full w-full"/>
      </div>
    </Swiper>
    <EmptyCard v-else class="flex lg:hidden m-4" @click="openSelector" />

    <div class="w-full px-4 pb-4">
      <SelectedCamsSwitcher v-if="selectedWebcam && webcams" v-model="selectedWebcam" :cams="webcams"  @update:modelValue="(cam) => selectedWebcam = cam"/>
    </div>
  </template>
  <template v-else>
    <div class="flex flex-1 flex-grow overflow-scroll space-y-4 p-4">
      <div class="w-full grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 lg:grid-rows-3 h-fit lg:h-auto">
        <WebcamGridItem v-for="cam in webcams" v-bind:key="cam.name" :webcam="cam" :allow-share="allowShare" :allow-toggle="allowToggle"></WebcamGridItem>
        <template v-if="showPlaceholders">
          <EmptyCard class="hidden lg:flex xl:hidden" v-for="i in 10 - (webcams.length)" :key="i" @click="openSelector" />
          <EmptyCard class="hidden xl:flex" v-for="i in 9 - (webcams.length)" :key="i" @click="openSelector" />
        </template>
      </div>
    </div>
  </template>
  </template>
