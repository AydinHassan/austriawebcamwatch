<script setup lang="ts">
import type {UserSettings} from '@/repository/webcamRepository';
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

import { computed, onMounted, provide, ref, watch, toRaw } from 'vue'
import { getRandomWebcams, getWebcamByName } from '@/services/webcams'
import { localRepository } from '@/repository/localStorageRepository'
import { supabaseRepository } from '@/repository/supabaseRepository'

import { useColorMode } from '@vueuse/core'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog/index.js'
import { Input } from '@/components/ui/input/index.js'
import useSupabase from '@/composables/useSupabase'
import useAuth from '@/composables/useAuth'
import Menu from '@/components/Menu.vue'
import { useRoute } from 'vue-router'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
const { supabase } = useSupabase();

const mode = useColorMode()
mode.value = 'dark'

const route = useRoute()
const showSwitchers = computed(() => route.path === '/' || route.path === '/map')

const firstVisit = ref(false);
const webcamSelectorRef = ref(null);
const addPresetOpen = ref(false);
const newPresetName = ref('');
const showPresetValidationError = ref(false);
const { user, onAuthenticated } = useAuth()

onAuthenticated(async (user) => {
  if (user !== null) {
    const settingsFromDb = await repository.value.getSettings();

    if (settingsFromDb.visited === false) {
      //first time logging in. let's migrate
      repository.value.savePresets(userPresets.value);
      repository.value.setSettings(userSettings.value);

      localRepository.value.savePresets([]);
      localRepository.value.setSettings({selectedPreset: null, visited: true});
    } else {
      const presetsFromDb = await repository.value.loadPresets();
      userSettings.value = settingsFromDb;
      userPresets.value = presetsFromDb;
    }
  }

  if (userSettings.value.visited === false) {
    firstVisit.value = true;

    userSettings.value.visited = true;

    addDefaultPresets();

    //set some default cams
    const cams = [
      'Wanglspitze',
      'Achensee',
      'Großglockner Hochalpenstraße - Edelweißspitze',
      'Weißenkirchen in der Wachau',
      'Pyramidenkogel - Aussichtsturm',
      'Eng'
    ];

    cams.forEach(cam => addSelectedWebcam(cam));
  }
})

const repository = computed(() => {
  return user.value ? supabaseRepository : localRepository;
})

const userPresets = ref(null);
const userSettings = ref<UserSettings>({visited: false, selectedPreset: null});

const defaultPresets = [
  { name: 'Default preset', camIds: [] },
  { name: 'Random', camIds: [] },
]

const addDefaultPresets = () => {
  userPresets.value = defaultPresets
  userSettings.value.selectedPreset = userPresets.value[0].name;
};

const presets = computed(() => {
  if (userPresets.value === null) {
    return [
      { name: 'Loading...', cams: []}
    ]
  }

  return userPresets.value.map(preset => ({
    name: preset.name,
    cams: preset.camIds.map(camId => getWebcamByName(camId))
  }))
})

const selectedPreset = computed(() => {
  if (userSettings.value.selectedPreset !== null) {
    return presets.value.find((preset) => preset.name === userSettings.value.selectedPreset);
  }

  return presets.value[0];
})

const addSelectedWebcam = (webcamName) => {

  const index = selectedPreset.value.cams.findIndex(
    (selected) => selected.name === webcamName
  )

  if (index !== -1) {
    return; //it's already in there
  }

  const preset = userPresets.value.find((preset) => preset.name === userSettings.value.selectedPreset);

  if (selectedPreset.value.cams.length >= 9) {
    preset.camIds.shift();
  }
  // Add the webcam to the selected list
  preset.camIds.push(webcamName);
}

const toggleWebcam = (webcamName) => {
  const preset = userPresets.value.find((preset) => preset.name === userSettings.value.selectedPreset);

  const index = preset.camIds.findIndex(
    (selected) => selected === webcamName
  )

  if (index !== -1) {
    // Remove the webcam if it's already selected
    preset.camIds.splice(index, 1)
  } else {
    // If more than 9 webcams are selected, remove the first one
    if (preset.camIds.length >= 9) {
      preset.camIds.shift()
    }
    // Add the webcam to the selected list
    preset.camIds.push(webcamName)
  }
}

const switchPreset = (name) => {
  const preset = userPresets.value.find(p => p.name === name);
  if (preset) {
    userSettings.value.selectedPreset = preset.name;

    randomiseCams()
  }
}

const randomiseCams = () => {
  if (userSettings.value.selectedPreset === 'Random') {
    getRandomWebcams(9).map((webcam) => toggleWebcam(webcam.name))
  }
}

const addPreset = () => {
  if (newPresetName.value.length < 3) {
    showPresetValidationError.value = true
    return;
  }

  const name = newPresetName.value.trim();

  userPresets.value.push({ name: name, camIds: [] });

  newPresetName.value = ''
  showPresetValidationError.value = false;
  addPresetOpen.value = false;

  switchPreset(name);
}

const deletePreset = (name) => {
  if (userPresets.value.length === 1) {
    return; // Prevent deletion of the last preset
  }

  userPresets.value = userPresets.value.filter(p => p.name !== name)

  if (name === userSettings.value.selectedPreset) {
    userSettings.value.selectedPreset = userPresets.value[0].name;
  }
}

provide('selectedPreset', selectedPreset);
provide('webcamSelectorRef', webcamSelectorRef);
provide('addSelectedWebcam', addSelectedWebcam);
provide('toggleWebcam', toggleWebcam);
provide('switchPreset', switchPreset);
provide('deletePreset', deletePreset);

onMounted(async () => {
  //load from local storage first
  userPresets.value = await repository.value.loadPresets();
  userSettings.value = await repository.value.getSettings();

  randomiseCams()
})

watch(userSettings, async (settings) => {
  await repository.value.setSettings(settings)
}, { deep: true })

watch(userPresets, async (presets ) => {
  if (presets === null) {
    return;
  }

  await repository.value.savePresets(presets)
}, { deep: true })


watch(user, () => {
  if (user.value === null) {
    addDefaultPresets()
  }
})

const shareLink = () => {
  createShareLink(selectedPreset.value.cams)
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
          :selectedWebcams="selectedPreset.cams"
        />
        <div v-if="showSwitchers" class="col-span-6 md:col-span-2 order-4 xl:order-2 grid grid-cols-6 lg:flex">
          <PresetSwitcher :presets="presets" :selectedPreset="selectedPreset" :class="selectedPreset.cams.length > 0 ? 'col-span-4' : 'col-span-5'" class="lg:w-[200px] " />
          <Button variant="outline" class="ml-2 lg:ml-1 col-span-1" @click="addPresetOpen = true">
            <PlusIcon></PlusIcon>
          </Button>
          <Popover v-if="selectedPreset.cams.length > 0" @update:open="val => val && shareLink()">
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

          <Menu :firstVisit="firstVisit"></Menu>
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
