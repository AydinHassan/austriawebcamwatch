<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { Cross2Icon, ExternalLinkIcon, ReloadIcon, Share1Icon, SizeIcon } from '@radix-icons/vue'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

import { Button } from '@/components/ui/button'
import Iframe from '@/components/Iframe.vue'
import { computed, ref } from 'vue'
import { createShareLink } from '@/utils/share'
import Provider from '@/components/Provider.vue'
import type { Webcam } from '@/services/webcam'
import { usePresetsStore } from '@/stores/presets'
import WebcamIframe from '@/components/WebcamIframe.vue'

const {
  webcam,
  allowToggle = true,
  allowShare = true,
} = defineProps<{
  webcam: Webcam
  allowToggle?: boolean
  allowShare?: boolean
}>()

const iframeEl = ref(null)
const presetsStore = usePresetsStore()

const refreshCam = () => {
  iframeEl.value.refreshCam()
}

const emit = defineEmits(['open-cam'])

const openCam = (cam) => {
  emit('open-cam', cam)
}
</script>

<template>
  <Card class="h-[500px] lg:h-full col-span-1 flex flex-col group relative">
    <CardHeader
      class="flex-row justify-between items-center absolute w-full hidden bg-background group-hover:flex z-1"
    >
      <div class="flex gap-x-2">
        <CardTitle>{{ webcam.name }}</CardTitle>
        <Badge
          v-if="webcam.provider === 'panomax'"
          variant="outline"
          class="ml-3 text-[9px] border-green-400/20 text-green-500"
          >Panomax</Badge
        >
        <Badge
          v-if="webcam.provider === 'bergfex'"
          variant="outline"
          class="ml-3 text-[9px] border-sky-400/20 text-sky-500"
          >Bergfex</Badge
        >
      </div>
      <div class="flex gap-x-2">
        <span
          v-if="webcam.provider === 'bergfex'"
          class="bg-secondary hover:bg-secondary/90 rounded p-0.5 cursor-pointer"
          @click="refreshCam()"
          ><ReloadIcon></ReloadIcon
        ></span>
        <span
          class="bg-secondary hover:bg-secondary/90 rounded p-0.5 cursor-pointer"
          @click="openCam(webcam)"
          ><SizeIcon></SizeIcon
        ></span>
        <span
          v-if="allowToggle"
          class="bg-secondary hover:bg-secondary/90 rounded p-0.5 cursor-pointer"
          @click="presetsStore.toggleWebcam(webcam)"
          ><Cross2Icon></Cross2Icon
        ></span>
        <a
          :href="webcam.url"
          class="bg-secondary hover:bg-secondary/90 rounded p-0.5"
          target="_blank"
          ><ExternalLinkIcon></ExternalLinkIcon
        ></a>
        <Popover v-if="allowShare" @update:open="(val) => val && createShareLink([webcam])">
          <PopoverTrigger as-child>
            <span
              class="bg-secondary hover:bg-secondary/90 rounded p-0.5 cursor-pointer"
              variant="outline"
            >
              <Share1Icon />
            </span>
          </PopoverTrigger>
          <PopoverContent class="rounded-lg w-auto">
            <div class="grid gap-4">
              <p class="text-sm">Link copied to clipboard!</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </CardHeader>
    <CardContent class="flex flex-1 group-hover:opacity-50">
      <WebcamIframe :webcam="webcam" ref="iframeEl" />
    </CardContent>
  </Card>
</template>
