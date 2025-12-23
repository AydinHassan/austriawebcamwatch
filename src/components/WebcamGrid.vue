<script setup lang="ts">
import SelectedCamsSwitcher from '@/components/SelectedCamsSwitcher.vue'
import EmptyCard from '@/components/ui/card/EmptyCard.vue'
import Swiper from '@/components/Swiper.vue'
import WebcamGridItem from '@/components/WebcamGridItem.vue'
import { ref, computed, watchEffect, inject, onMounted, onUnmounted } from 'vue'
import type { Webcam } from '@/services/webcam'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-icons/vue'
import Provider from '@/components/Provider.vue'
import WebcamIframe from '@/components/WebcamIframe.vue'

const webcamSelectorRef = inject('webcamSelectorRef', ref(null))

const {
  webcams = [],
  allowToggle = true,
  allowShare = true,
  showPlaceholders = true,
} = defineProps<{
  webcams: Webcam[]
  allowToggle?: boolean
  allowShare?: boolean
  showPlaceholders?: boolean
}>()

const openSelector = async () => {
  webcamSelectorRef.value.open = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const modalOpen = ref(false)
const modalWebcam = ref(null)
const selectedWebcam = ref(null)

const isMobile = computed(() => window.innerWidth < 768)

watchEffect(() => {
  if (isMobile.value) {
    if (webcams.length > 0) {
      selectedWebcam.value = webcams[0]
    } else {
      selectedWebcam.value = null
    }
  }
})

function prevCam() {
  const i = webcams.findIndex((c) => c.name === selectedWebcam.value.name)
  if (i > 0) {
    selectedWebcam.value = webcams[i - 1]
  }
}

function nextCam() {
  const i = webcams.findIndex((c) => c.name === selectedWebcam.value.name)
  if (i < webcams.length - 1) {
    selectedWebcam.value = webcams[i + 1]
  }
}

const openCamModal = (webcam: Webcam) => {
  modalWebcam.value = webcam
  modalOpen.value = true
}

const prevModalCam = () => {
  const i = webcams.findIndex((c) => c.name === modalWebcam.value.name)
  if (i > 0) {
    modalWebcam.value = webcams[i - 1]
  }
}

const nextModalCam = () => {
  const i = webcams.findIndex((c) => c.name === modalWebcam.value.name)
  if (i < webcams.length - 1) {
    modalWebcam.value = webcams[i + 1]
  }
}

const hasPrev = computed(() => {
  if (!modalWebcam.value) return false
  const i = webcams.findIndex((c) => c.name === modalWebcam.value.name)
  return i > 0
})

const hasNext = computed(() => {
  if (!modalWebcam.value) return false
  const i = webcams.findIndex((c) => c.name === modalWebcam.value.name)
  return i < webcams.length - 1
})

const handleKeydown = (e: KeyboardEvent) => {
  if (!modalOpen.value || isMobile.value) return

  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prevModalCam()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    nextModalCam()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <template v-if="isMobile">
    <Swiper
      v-if="selectedWebcam"
      :item-key="selectedWebcam.name"
      @swipe-left="nextCam"
      @swipe-right="prevCam"
    >
      <div
        class="flex h-full flex-1 flex-grow overflow-scroll overflow-hidden p-4"
        v-if="selectedWebcam"
      >
        <WebcamIframe :webcam="selectedWebcam" />
      </div>
    </Swiper>
    <EmptyCard v-else class="flex lg:hidden m-4" @click="openSelector" />

    <div class="w-full px-4 pb-4">
      <SelectedCamsSwitcher
        v-if="selectedWebcam && webcams"
        v-model="selectedWebcam"
        :cams="webcams"
        @update:modelValue="(cam) => (selectedWebcam = cam)"
      />
    </div>
  </template>
  <template v-else>
    <div class="flex flex-1 flex-grow overflow-scroll space-y-4 p-4">
      <div
        class="w-full grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 lg:grid-rows-3 h-fit lg:h-auto"
      >
        <WebcamGridItem
          v-for="cam in webcams"
          v-bind:key="cam.name"
          :webcam="cam"
          :allow-share="allowShare"
          :allow-toggle="allowToggle"
          @open-cam="openCamModal"
        ></WebcamGridItem>
        <template v-if="showPlaceholders">
          <EmptyCard
            class="hidden lg:flex xl:hidden"
            v-for="i in 10 - webcams.length"
            :key="i"
            @click="openSelector"
          />
          <EmptyCard
            class="hidden xl:flex"
            v-for="i in 9 - webcams.length"
            :key="i"
            @click="openSelector"
          />
        </template>
      </div>
    </div>

    <Dialog v-model:open="modalOpen">
      <DialogContent class="flex flex-col max-w-5xl h-[800px]">
        <DialogHeader>
          <DialogTitle class="flex items-center">
            {{ modalWebcam?.name }}
            <Provider v-if="modalWebcam" :cam="modalWebcam"></Provider>
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div class="flex-1">
          <WebcamIframe v-if="modalWebcam" :webcam="modalWebcam" />
        </div>
        <DialogFooter class="flex justify-between items-center">
          <div class="flex items-center gap-1">
            <Button
              v-if="hasPrev"
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click="prevModalCam"
            >
              <ChevronLeftIcon class="h-4 w-4" />
            </Button>
            <Button
              v-if="hasNext"
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click="nextModalCam"
            >
              <ChevronRightIcon class="h-4 w-4" />
            </Button>
          </div>
          <div class="flex-1"></div>
          <Button variant="secondary" @click="modalOpen = false"> Close </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </template>
</template>
