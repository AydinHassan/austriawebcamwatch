<script setup>
import {Button} from "@/components/ui/button";
import CamSwitcher from "@/components/CamSwitcher.vue";
import PresetSwitcher from "@/components/PresetSwitcher.vue";
import { GlobeIcon, HomeIcon, GithubLogoIcon, CameraIcon, TwitterLogoIcon, PlusIcon } from '@radix-icons/vue'
import { useRoute } from 'vue-router';


import { ref, onMounted, watch, provide, computed } from 'vue'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Icon } from '@iconify/vue'
import { useColorMode } from '@vueuse/core'
import { DialogOverlay, DialogPortal, DialogRoot } from 'radix-vue'
import {
  Dialog,
  DialogContent, DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog/index.js'
import Provider from '@/components/Provider.vue'
import { Input } from '@/components/ui/input/index.js'

const mode = useColorMode()
mode.value = 'dark'

const webcamSelectorRef = ref(null);
const addPresetOpen = ref(false);
const newPresetName = ref('');
const showPresetValidationError = ref(false);
const addSelectedWebcam = (webcam) => {
  const index = selectedPreset.value.cams.findIndex(
    (selected) => selected.name === webcam.name
  )

  if (index !== -1) {
    return; //it's already in there
  }

  if (selectedPreset.value.cams.length >= 9) {
    selectedPreset.value.cams.shift()
  }
  // Add the webcam to the selected list
  selectedPreset.value.cams.push(webcam)
}

const toggleWebcam = (webcam) => {
  const index = selectedPreset.value.cams.findIndex(
    (selected) => selected.name === webcam.name
  )

  if (index !== -1) {
    // Remove the webcam if it's already selected
    selectedPreset.value.cams.splice(index, 1)
  } else {
    // If more than 9 webcams are selected, remove the first one
    if (selectedPreset.value.cams.length >= 9) {
      selectedPreset.value.cams.shift()
    }
    // Add the webcam to the selected list
    selectedPreset.value.cams.push(webcam)
  }
}

const switchPreset = (name) => {
  const preset = presets.value.find(p => p.name === name);
  if (preset) {
    selectedPreset.value = preset;
  }
}

const addPreset = () => {
  if (newPresetName.value.length < 3) {
    showPresetValidationError.value = true
    return;
  }

  const name = newPresetName.value.trim();

  presets.value.push({ name: name, cams: [] });

  newPresetName.value = ''
  showPresetValidationError.value = false;
  addPresetOpen.value = false;

  switchPreset(name);
}

const deletePreset = (name) => {
  if (presets.value.length === 1) {
    return; // Prevent deletion of the last preset
  }

  presets.value = presets.value.filter(p => p.name !== name);

  if (name === selectedPreset.value.name) {
    selectedPreset.value = presets.value[0];
  }
}

const presets = ref([
  { name: 'Default preset', cams: []},
]);

const selectedPreset = ref(presets.value[0]);

provide('selectedPreset', selectedPreset);
provide('webcamSelectorRef', webcamSelectorRef);
provide('addSelectedWebcam', addSelectedWebcam);
provide('toggleWebcam', toggleWebcam);
provide('switchPreset', switchPreset);
provide('deletePreset', deletePreset);

onMounted(() => {
  const savedPresets = localStorage.getItem('presets');

  if (savedPresets) {
    presets.value = JSON.parse(savedPresets)
  }

  const selectedPresetName = localStorage.getItem('selectedPreset');

  if (selectedPresetName) {
    switchPreset(selectedPresetName);
  } else {
    selectedPreset.value = presets.value[0];
  }

  // backwards compatibility for before presets
  const storedSelection = localStorage.getItem('selectedWebcams')
  if (storedSelection) {
    presets.value[0].cams = JSON.parse(storedSelection);
    localStorage.removeItem('selectedWebcams');
  }
})

watch(selectedPreset, (newSelection) => {
  localStorage.setItem('selectedPreset', newSelection.name)
}, { deep: true })

watch(presets, (newSelection) => {
  localStorage.setItem('presets', JSON.stringify(newSelection))
}, { deep: true })

const route = useRoute();
const toggleTo = computed(() => (route.path === '/map' ? '/' : '/map'));
const path = computed(() => (route.path));


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
      <div class="flex h-16 items-center px-4">
        <CamSwitcher
          ref="webcamSelectorRef"
          :selectedWebcams="selectedPreset.cams"
        />
        <PresetSwitcher :presets="presets" :selectedPreset="selectedPreset" class="ml-6" />
        <Button variant="outline" class="ml-1" @click="addPresetOpen = true">
          <PlusIcon></PlusIcon>
        </Button>
        <span class="mx-6 text-sm font-medium transition-colors hover:text-primary">
          Austria Webcam Watch
       </span>
        <div class="ml-auto flex items-center space-x-4">
            <RouterLink :to="toggleTo">
              <Button variant="outline">
                <GlobeIcon v-if="path === '/'"></GlobeIcon>
                <HomeIcon v-else></HomeIcon>
              </Button>
            </RouterLink>
          <a href="https://github.com/AydinHassan/austriawebcamwatch" target="_blank">
            <Button variant="outline">
              <GithubLogoIcon></GithubLogoIcon>
            </Button>
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline">
                <Icon icon="radix-icons:moon" class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Icon icon="radix-icons:sun" class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span class="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="mode = 'light'">
                Light
              </DropdownMenuItem>
              <DropdownMenuItem @click="mode = 'dark'">
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem @click="mode = 'auto'">
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </div>
    <div class="flex flex-1 flex-grow overflow-scroll space-y-4 p-4">
      <RouterView />
    </div>
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
        <DialogDescription> Give your preset a name.</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class=" items-center gap-4">
          <Input id="name" minlength="3"  v-model="newPresetName" @keyup="showPresetValidationError = false"/>
          <p class="mt-2 text-xs text-red-600" v-show="showPresetValidationError">Preset name must be longer than 3 characters</p>
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
