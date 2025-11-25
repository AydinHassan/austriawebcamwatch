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

import { computed, onMounted, provide, ref, watch } from 'vue'
import { getRandomWebcams, getWebcamByName } from '@/services/webcams'
import { localRepository } from '@/repository/localStorageRepository'
import type {Webcam} from '@/services/webcams'
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
import Menu from '@/components/Menu.vue'
import { useRoute } from 'vue-router'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

const { supabase } = useSupabase();
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

const mode = useColorMode()
mode.value = 'dark'

const route = useRoute()
const showSwitchers = computed(() => route.path === '/' || route.path === '/map')

const firstVisit = ref(false);
const webcamSelectorRef = ref(null);
const addPresetOpen = ref(false);
const newPresetName = ref('');
const showPresetValidationError = ref(false);

const loadPresets = async (repository): Preset  => {
  const presets = await repository.loadPresets();

  if (presets === null) {
    return defaultPresets;
  }

  return presets.map(preset => ({
    name: preset.name,
    cams: preset.camIds.map(camId => getWebcamByName(camId))
  }))
}

const saveSettings = async () => {
  await repository.value.saveSettings(userSettings.value)
}

const savePresets = async () => {
  if (!userPresets.value) {
    return
  }

  const toSave = userPresets.value.map(preset => {
    if (preset.name === 'Random') {
      return {
        name: preset.name,
        camIds: [],
      }
    }

    return {
      name: preset.name,
      camIds: preset.cams.map((cam: Webcam) => cam.name),
    }
  })

  await repository.value.savePresets(toSave)
}

const repository = computed(() => {
  return auth.user ? supabaseRepository : localRepository;
})

const defaultPresets = [
  { name: 'Default preset', cams: [] },
  { name: 'Random', cams: [] },
]

const userPresets = ref(defaultPresets);
const userSettings = ref<UserSettings>({visited: false, selectedPreset: 'Default preset'});

const addDefaultPresets = () => {
  userPresets.value = defaultPresets
  userSettings.value.selectedPreset = userPresets.value[0].name;
};

const selectedPreset = computed(() => {
  const presetName = userSettings.value.selectedPreset;
  if (!presetName) {
    return userPresets.value[0] ?? null
  }
  return userPresets.value.find(p => p.name === presetName) ?? userPresets.value[0];
})

watch(() => userSettings.value.selectedPreset, (newPreset) => {
  if (newPreset === 'Random') {
    randomiseCams();
  }
})

const getSelectedPreset = (): Preset => {
  const presetName = userSettings.value.selectedPreset;
  if (!presetName) {
    return;
  }

  return userPresets.value.find(p => p.name === presetName)
}

const toggleWebcam = async (webcam: Webcam) => {
  const preset = getSelectedPreset();

  const index = preset.cams.findIndex(
    (selected) => selected === webcam
  )

  if (index !== -1) {
    // Remove the webcam if it's already selected
    preset.cams.splice(index, 1)
  } else {
    // If more than 9 webcams are selected, remove the first one
    if (preset.cams.length >= 9) {
      preset.cams.shift()
    }

    // Add the webcam to the selected list
    preset.cams.push(webcam)
  }

  if (selectedPreset.value.name !== 'Random') {
    await savePresets()
  }
}

const switchPreset = async (name) => {
  if (name === userSettings.value.selectedPreset) {
    return;
  }

  const preset = userPresets.value.find(p => p.name === name);
  if (preset) {
    userSettings.value.selectedPreset = preset.name;
    await saveSettings();
  }
}

const randomiseCams = () => {
  getRandomWebcams(9).map((webcam) => toggleWebcam(webcam))
}

const addPreset = async () => {
  if (newPresetName.value.length < 3) {
    showPresetValidationError.value = true
    return;
  }

  const name = newPresetName.value.trim();

  userPresets.value.push({ name: name, cams: [] });

  newPresetName.value = ''
  showPresetValidationError.value = false;
  addPresetOpen.value = false;

  await savePresets();
  await switchPreset(name);
}

const deletePreset = async (name) => {
  if (userPresets.value.length === 1) {
    return; // Prevent deletion of the last preset
  }

  userPresets.value.splice(userPresets.value.findIndex(p => p.name === name), 1)

  if (name === userSettings.value.selectedPreset) {
    userSettings.value.selectedPreset = userPresets.value[0].name;
  }

  await saveSettings();
  await savePresets();
}

provide('selectedPreset', selectedPreset);
provide('webcamSelectorRef', webcamSelectorRef);
provide('toggleWebcam', toggleWebcam);
provide('switchPreset', switchPreset);
provide('deletePreset', deletePreset);

onMounted(async () => {
  userPresets.value = await loadPresets(localRepository)
  userSettings.value = await localRepository.loadSettings();

  await auth.init();

  if (auth.user) {
    await loadRemoteData(auth.user)
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

    cams.forEach(cam => toggleWebcam(getWebcamByName(cam)));
    await saveSettings();
  }
})

const loadRemoteData = async () => {
  const settingsFromDb = await supabaseRepository.loadSettings();

  if (settingsFromDb.visited === false) {
    //first time logging in. let's migrate
    await savePresets();
    await saveSettings();

    //delete local data
    localRepository.savePresets([]);
    localRepository.saveSettings({selectedPreset: null, visited: true});
  } else {
    const presetsFromDb = await loadPresets(repository.value);
    userSettings.value = settingsFromDb;
    userPresets.value = presetsFromDb;
  }
}

watch(() => auth.user, (newUser) => {
    if (newUser === null) {
      console.log('Adding default presets')
      addDefaultPresets()
    }
  }
)

type Preset = {
  name: string
  cams: Webcam[]
}

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
          :selectedWebcams="selectedPreset?.cams ?? []"
        />
        <div v-if="showSwitchers" class="col-span-6 md:col-span-2 order-4 xl:order-2 grid grid-cols-6 lg:flex">
          <PresetSwitcher
            :presets="userPresets"
            :selectedPreset="selectedPreset ?? null"
            :class="selectedPreset?.cams?.length > 0 ? 'col-span-4' : 'col-span-5'"
            class="lg:w-[200px] "
          />
          <Button variant="outline" class="ml-2 lg:ml-1 col-span-1" @click="addPresetOpen = true">
            <PlusIcon></PlusIcon>
          </Button>
          <Popover v-if="selectedPreset?.cams?.length > 0" @update:open="val => val && shareLink()">
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
