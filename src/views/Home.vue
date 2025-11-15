<script setup>
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { ref, inject, computed, onMounted, watch } from 'vue'
import { ExternalLinkIcon, Cross2Icon, ReloadIcon, SizeIcon } from '@radix-icons/vue'

import EmptyCard from '@/components/ui/card/EmptyCard.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription, DialogFooter, DialogHeader,
  DialogTitle
} from '@/components/ui/dialog/index.js'
import { Button } from '@/components/ui/button/index.js'
import Provider from '@/components/Provider.vue'

import Iframe from '@/components/Iframe.vue'
import SelectedCamsSwitcher from '@/components/SelectedCamsSwitcher.vue'
import Swiper from '@/components/Swiper.vue'

const selectedPreset = inject('selectedPreset')
const webcamSelectorRef = inject('webcamSelectorRef')

const openSelector = async () => {
  webcamSelectorRef.value.open = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const closeCam = (cam) => {
  selectedPreset.value.cams = selectedPreset.value.cams.filter((selectedCam) => selectedCam.name !== cam.name);
}

const refreshCam = (cam) => {
  iframes.value[cam.url].reinitIframe();
}

const iframes = ref({});

const open = ref(false);
const selectedWebcam = ref(null);

const openCam = (cam) => {
  selectedWebcam.value = cam;
  open.value = true;
}

const isMobile = computed(() => window.innerWidth < 768);

onMounted(() => {
  if (isMobile.value && selectedPreset.value.cams.length > 1) {
    selectedWebcam.value =  selectedPreset.value.cams[0];
  }
})

let startX = 0
let deltaX = 0

function startSwipe(e) {
  startX = e.touches[0].clientX
}

function moveSwipe(e) {
  deltaX = e.touches[0].clientX - startX
}

function endSwipe() {
  const threshold = 50 // px before we trigger

  if (deltaX > threshold) {
    swipeLeft()
  } else if (deltaX < -threshold) {
    swipeRight()
  }

  deltaX = 0
}

function prevCam() {
  const i = selectedPreset.value.cams.findIndex(c => c.name === selectedWebcam.value.name)
  if (i > 0) {
    selectedWebcam.value = selectedPreset.value.cams[i - 1]
  }
}

function nextCam() {
  const i = selectedPreset.value.cams.findIndex(c => c.name === selectedWebcam.value.name)
  if (i < selectedPreset.value.cams.length - 1) {
    selectedWebcam.value = selectedPreset.value.cams[i + 1]
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
      <div class="w-full px-4 pb-4">
        <SelectedCamsSwitcher v-if="selectedPreset.cams" v-model="selectedWebcam" :cams="selectedPreset.cams"  @update:modelValue="(cam) => selectedWebcam = cam"/>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-1 flex-grow overflow-scroll space-y-4 p-4">
        <div class="w-full grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 lg:grid-rows-3 h-fit lg:h-auto">
          <Card v-for="cam in selectedPreset.cams" v-bind:key="cam.name" class="h-[500px] lg:h-full col-span-1 flex flex-col group relative">
            <CardHeader class="flex-row justify-between items-center absolute w-full hidden bg-background group-hover:flex z-1">
              <div class="flex gap-x-2">
                <CardTitle>{{cam.name}}</CardTitle>
                <Badge v-if="cam.provider === 'panomax'" variant="outline" class="ml-3 text-[9px] border-green-400/20 text-green-500">Panomax</Badge>
                <Badge v-if="cam.provider === 'bergfex'" variant="outline" class="ml-3 text-[9px] border-sky-400/20 text-sky-500">Bergfex</Badge>
              </div>
              <div class="flex gap-x-2">
                <span v-if="cam.provider === 'bergfex'" class="bg-secondary hover:bg-secondary/90 rounded p-0.5 cursor-pointer" @click="refreshCam(cam)"><ReloadIcon></ReloadIcon></span>
                <span class="bg-secondary hover:bg-secondary/90 rounded p-0.5 cursor-pointer" @click="openCam(cam)"><SizeIcon></SizeIcon></span>
                <span class="bg-secondary hover:bg-secondary/90 rounded p-0.5 cursor-pointer" @click="closeCam(cam)"><Cross2Icon></Cross2Icon></span>
                <a :href="cam.url" class="bg-secondary hover:bg-secondary/90 rounded p-0.5" target="_blank"><ExternalLinkIcon></ExternalLinkIcon></a>
              </div>
            </CardHeader>
            <CardContent class="flex flex-1 group-hover:opacity-50">
              <Iframe :src="cam.url" class="w-full" :ref="(el) => { iframes[cam.url] = el }"></Iframe>
            </CardContent>
          </Card>
          <EmptyCard class="flex lg:hidden" @click="openSelector" />
          <EmptyCard class="hidden lg:flex xl:hidden" v-for="i in 10 - (selectedPreset.cams.length)" :key="i" @click="openSelector" />
          <EmptyCard class="hidden xl:flex" v-for="i in 9 - (selectedPreset.cams.length)" :key="i" @click="openSelector" />
        </div>
    </div>
  </template>
  <Dialog v-model:open="open">
    <DialogContent v-if="selectedWebcam" class="flex flex-col max-w-5xl h-[800px]">
      <DialogHeader>
        <DialogTitle class="flex items-center">{{ selectedWebcam.name }} <Provider :cam="selectedWebcam"></Provider></DialogTitle>
        <DialogDescription />
      </DialogHeader>
      <div class="flex-1">
        <Iframe  :src="selectedWebcam.url" class="h-full w-full"/>
      </div>
      <DialogFooter>
        <Button variant="secondary" @click="selectedWebcam = null">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
