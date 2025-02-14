<script setup>
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { ref, inject } from 'vue'
import { ExternalLinkIcon, Cross2Icon, ReloadIcon, SizeIcon } from '@radix-icons/vue'


// const webcams = [
//   { name: 'Weissenkirchen', url: 'https://content.bergfex.at/webcam/?id=12484&initTagManager=1&showCopyright=0' },
//   { name: 'Magdalensberg', url: 'https://content.bergfex.at/webcam/?id=15083&initTagManager=1&showCopyright=0' },
//   { name: 'Schafbergspitze', url: 'https://schafberg.panomax.com' },
//   { name: 'Schneeberg', url: 'https://schneeberg.panomax.com' },
//   { name: 'Goldeck', url: 'https://goldeck.panomax.com?embedded=true&controls=false&branding=false' },
//   { name: 'Dachstein', url: 'https://dachstein.panomax.com' },
//   { name: 'Vienna', url: 'https://a1-arsenal.panomax.com' },
//   { name: 'Weissenkirchen 2', url: 'https://content.bergfex.at/webcam/?id=12484&initTagManager=1&showCopyright=0' },
//   { name: 'Weissenkirchen 3', url: 'https://content.bergfex.at/webcam/?id=12484&initTagManager=1&showCopyright=0' }
// ];

import EmptyCard from '@/components/ui/card/EmptyCard.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription, DialogFooter, DialogHeader,
  DialogTitle
} from '@/components/ui/dialog/index.js'
import { Button } from '@/components/ui/button/index.js'
import Provider from '@/components/Provider.vue'
const selectedWebcams = inject('selectedWebcams')
const webcamSelectorRef = inject('webcamSelectorRef')

const openSelector = async () => {
  webcamSelectorRef.value.open = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const closeCam = (cam) => {
  selectedWebcams.value = selectedWebcams.value.filter((selectedCam) => selectedCam.name !== cam.name);
}

const refreshCam = (cam) => {
  iframes.value[cam.url].src = cam.url;
}

const iframes = ref({});

const open = ref(false);
const selectedWebcam = ref(null);

const openCam = (cam) => {
  selectedWebcam.value = cam;
  open.value = true;
}

</script>

<template>
  <div class="w-full grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 lg:grid-rows-3 h-fit lg:h-auto">
    <Card v-for="cam in selectedWebcams" v-bind:key="cam.name" class="h-[500px] lg:h-full col-span-1 flex flex-col group relative">
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
        <iframe :src="cam.url" class="w-full" :ref="(el) => { iframes[cam.url] = el }"></iframe>
      </CardContent>
    </Card>
    <EmptyCard class="flex lg:hidden" @click="openSelector" />
    <EmptyCard class="hidden lg:flex xl:hidden" v-for="i in 10 - (selectedWebcams.length)" :key="i" @click="openSelector" />
    <EmptyCard class="hidden xl:flex" v-for="i in 9 - (selectedWebcams.length)" :key="i" @click="openSelector" />
  </div>

  <Dialog v-model:open="open">
    <DialogContent v-if="selectedWebcam" class="flex flex-col max-w-5xl h-[800px]">
      <DialogHeader>
        <DialogTitle class="flex items-center">{{ selectedWebcam.name }} <Provider :cam="selectedWebcam"></Provider></DialogTitle>
        <DialogDescription />
      </DialogHeader>
      <div class="flex-1">
        <iframe  :src="selectedWebcam.url" class="h-full w-full"/>
      </div>
      <DialogFooter>
        <Button variant="secondary" @click="selectedWebcam = null">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
