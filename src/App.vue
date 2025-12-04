<script setup lang="ts">
import { Button } from '@/components/ui/button'
import CamSwitcher from '@/components/CamSwitcher.vue'
import PresetSwitcher from '@/components/PresetSwitcher.vue'
import {
  CameraIcon,
  GithubLogoIcon,
  GlobeIcon,
  PlusIcon,
  TwitterLogoIcon,
  Share1Icon,
} from '@radix-icons/vue'
import { createShareLink } from '@/utils/share'

import { computed, onMounted, provide, ref, watch } from 'vue'
import { useColorMode } from '@vueuse/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/index.js'
import { Input } from '@/components/ui/input/index.js'
import Menu from '@/components/Menu.vue'
import { useRoute } from 'vue-router'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

import { useAuthStore } from '@/stores/auth'
import { usePresetsStore } from '@/stores/presets'

const auth = useAuthStore()
const presetsStore = usePresetsStore()

const mode = useColorMode()
mode.value = 'dark'

const route = useRoute()
const showSwitchers = computed(() => route.path === '/' || route.path === '/map')

const webcamSelectorRef = ref(null)
const addPresetOpen = ref(false)
const newPresetName = ref('')
const showPresetValidationError = ref(false)
const presetValidationError = ref('')

const addPreset = async () => {
  try {
    await presetsStore.createPreset(newPresetName.value)
    newPresetName.value = ''
    showPresetValidationError.value = false
    addPresetOpen.value = false
    presetValidationError.value = '';
  } catch (error) {
    showPresetValidationError.value = true
    presetValidationError.value = error.message
  }
}

provide('webcamSelectorRef', webcamSelectorRef)

onMounted(async () => {
  await auth.init();
  await presetsStore.init();
})

const shareLink = () => {
  createShareLink(presetsStore.selectedPreset.cams)
}

const footerNavigation = [
  { name: 'GitHub', href: 'https://www.github.com/AydinHassan', icon: GithubLogoIcon},
  { name: 'Website', href: 'https://www.aydinhassan.co.uk', icon: GlobeIcon},
  { name: 'Photography', href: 'https://www.aydinhassanphotography.com', icon: CameraIcon},
  { name: 'X', href: 'https://x.com/aydinh', icon: TwitterLogoIcon},
]

</script>

<template>
  <div class="h-full flex-col flex">
    <div class="border-b">
      <div  class="grid xl:flex py-2 xl:py-3 grid-cols-6 gap-2 xl:gap-6 items-center px-4">
        <CamSwitcher v-if="showSwitchers" class="col-span-6 md:col-span-2 order-3 xl:order-1 xl:w-[300px]"
          ref="webcamSelectorRef"
          :selectedWebcams="presetsStore.selectedPreset.cams"
        />
        <div v-if="showSwitchers" class="col-span-6 md:col-span-2 order-4 xl:order-2 grid grid-cols-6 lg:flex">
          <PresetSwitcher
            :presets="presetsStore.presets"
            :selectedPreset="presetsStore.selectedPreset"
            :class="presetsStore.selectedPreset.cams.length > 0 ? 'col-span-4' : 'col-span-5'"
            class="lg:w-[200px] "
          />
          <Button variant="outline" class="ml-2 lg:ml-1 col-span-1" @click="addPresetOpen = true">
            <PlusIcon></PlusIcon>
          </Button>
          <Popover v-if="presetsStore.selectedPreset.cams.length > 0" @update:open="val => val && shareLink()">
            <PopoverTrigger as-child>
              <Button class="ml-2 lg:ml-1 col-span-1" variant="outline">
                <Share1Icon />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto">
              <div class="grid gap-4">
                <p class="text-sm">Link copied to clipboard!</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <RouterLink to="/" class="order-1 xl:order-3 col-span-3 text-sm font-medium transition-colors hover:text-primary">
          Austria Webcam Watch
        </RouterLink>
        <div class="lg:ml-auto flex justify-end space-x-2 lg:space-x-4 order-2 xl:order-4 col-span-3">

          <Menu></Menu>
        </div>
      </div>
    </div>
    <RouterView />
    <footer class="background border-t">
      <div class="mx-auto px-6 py-4 md:flex md:items-center md:justify-between">
        <div class="flex justify-center gap-x-6 md:order-2">
          <a v-for="item in footerNavigation" :key="item.name" :href="item.href" target="_blank" class="hover:text-primary">
            <span class="sr-only">{{ item.name }}</span>
            <component :is="item.icon" class="size-4" aria-hidden="true" />
          </a>
        </div>
        <p class="mt-3 text-center text-xs md:order-1 md:mt-0">Made by Aydin Hassan</p>
      </div>
    </footer>
  </div>

  <Dialog v-model:open="addPresetOpen">
    <DialogContent class="flex flex-col max-w-l">
      <DialogHeader>
        <DialogTitle class="flex items-center">Add preset</DialogTitle>
        <DialogDescription>Give your preset a name.</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class=" items-center gap-4">
          <Input id="name" minlength="3"  v-model="newPresetName" @keyup="showPresetValidationError = false; presetValidationError = ''"/>
          <p class="mt-2 text-xs text-red-600" v-show="showPresetValidationError">{{presetValidationError}}</p>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" @click="addPreset">
          Create
        </Button>
        <Button variant="secondary" @click="addPresetOpen = false">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
