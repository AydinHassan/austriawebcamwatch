<script setup>
import { Button } from '@/components/ui/button'
import CamSwitcher from '@/components/CamSwitcher.vue'
import PresetSwitcher from '@/components/PresetSwitcher.vue'
import {
  CameraIcon,
  GithubLogoIcon,
  GlobeIcon,
  HomeIcon,
  InfoCircledIcon,
  LayersIcon,
  PersonIcon,
  PlusIcon,
  TwitterLogoIcon,
  UpdateIcon
} from '@radix-icons/vue'
import { useRoute } from 'vue-router'

import { computed, onMounted, provide, ref, watch } from 'vue'
import { useRepository } from '@/composables/useRepository'
import { getRandomWebcams, getWebcamByName } from '@/services/webcams'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Icon } from '@iconify/vue'
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
import useSupabase from '@/composables/UseSupabase'
import { Badge } from '@/components/ui/badge/index.js'
const { supabase } = useSupabase();

const mode = useColorMode()
mode.value = 'dark'

const firstVisit = ref(false);
const infoOpen = ref(false);
const webcamSelectorRef = ref(null);
const addPresetOpen = ref(false);
const newPresetName = ref('');
const showPresetValidationError = ref(false);
const repository = useRepository();
const userPresets = ref(repository.loadPresets());
const selectedPresetName = ref(repository.selectedPreset());

if (userPresets.value === null) {
  userPresets.value = [
    { name: 'Default preset', camIds: [] },
    { name: 'Random', camIds: [] },
  ]
}

if (selectedPresetName.value === null) {
  selectedPresetName.value = userPresets.value[0].name
}

const presets = computed(() => {
  return userPresets.value.map(preset => ({
    name: preset.name,
    cams: preset.camIds.map(camId => getWebcamByName(camId))
  }))
})

const selectedPreset = computed(() => {
  if (selectedPresetName.value !== null) {
    return presets.value.find((preset) => preset.name === selectedPresetName.value);
  }
})

const addSelectedWebcam = (webcamName) => {

  const index = selectedPreset.value.cams.findIndex(
    (selected) => selected.name === webcamName
  )

  if (index !== -1) {
    return; //it's already in there
  }

  const preset = userPresets.value.find((preset) => preset.name === selectedPresetName.value);

  if (selectedPreset.value.cams.length >= 9) {
    preset.camIds.shift();
  }
  // Add the webcam to the selected list
  preset.camIds.push(webcamName);
}

const toggleWebcam = (webcamName) => {
  const preset = userPresets.value.find((preset) => preset.name === selectedPresetName.value);

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
    selectedPresetName.value = preset.name;

    randomiseCams()
  }
}

const randomiseCams = () => {
  if (selectedPresetName.value === 'Random') {
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

  if (name === selectedPresetName.value) {
    selectedPresetName.value = userPresets.value[0].name;
  }
}

provide('selectedPreset', selectedPreset);
provide('webcamSelectorRef', webcamSelectorRef);
provide('addSelectedWebcam', addSelectedWebcam);
provide('toggleWebcam', toggleWebcam);
provide('switchPreset', switchPreset);
provide('deletePreset', deletePreset);

const user = ref(null);

onMounted(async () => {
  const visited = repository.hasVisited();

  if (visited === false) {
    infoOpen.value = true;
    firstVisit.value = true;
    repository.setVisited();

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

  randomiseCams()

  const { data } = await supabase.auth.getUser()
  user.value = data.user ?? null;

  supabase.auth.onAuthStateChange((_, session) => {
    user.value = session?.user ?? null
    console.log(user.value);
  })
})

watch(selectedPresetName, (presetName) => {
  repository.setSelectedPreset(presetName)
}, { deep: true })

watch(userPresets, (presets) => {
  repository.savePresets(presets)
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

const loginOpen = ref(false);
const handleLogin = async (provider) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    })

    console.log(data)
  } catch (error) {
    alert(error.message);
  }
};

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()

  user.value = null;
}
</script>

<template>
  <div class="h-full flex-col flex">
    <div class="border-b">
      <div class="grid xl:flex py-2 xl:py-3 grid-cols-6 gap-2 xl:gap-6 items-center px-4">
        <CamSwitcher class="col-span-6 md:col-span-2 order-3 xl:order-1 xl:w-[300px]"
          ref="webcamSelectorRef"
          :selectedWebcams="selectedPreset.cams"
        />
        <div class="col-span-6 md:col-span-2 order-4 xl:order-2 grid grid-cols-6 lg:flex">
          <PresetSwitcher :presets="presets" :selectedPreset="selectedPreset" class="col-span-5 lg:w-[200px] " />
          <Button variant="outline" class="ml-2 lg:ml-1 col-span-1" @click="addPresetOpen = true">
            <PlusIcon></PlusIcon>
          </Button>
        </div>
        <span class="order-1 xl:order-3 col-span-3 text-sm font-medium transition-colors hover:text-primary">
          Austria Webcam Watch
        </span>
        <div class="lg:ml-auto flex justify-end space-x-2 lg:space-x-4 order-2 xl:order-4 col-span-3">
          <Dialog v-model:open="infoOpen">
            <DialogTrigger as-child>
              <Button variant="outline" class="px-3 lg:px-4">
                <InfoCircledIcon></InfoCircledIcon>
              </Button>
            </DialogTrigger>
            <DialogScrollContent class="w-[90vw] sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Info and Help</DialogTitle>
              </DialogHeader>
              <div class="flex space-x-2 flex-col pt-6">
                <p v-show="firstVisit" class="text-sm text-gray-300 mb-6">Welcome to Austria Webcam Watcher - we've added a few default webcams for you to monitor. Read on below to understand why and how to use.</p>
                <div class="grid grid-cols-8 mb-8">
                  <CameraIcon class="h-8 w-6 col-span-1 text-primary"/>
                  <p class="text-sm text-gray-300 col-span-7">This website allows you to monitor multiple webcams in Austria from <a class="underline text-primary" href="https://www.bergfex.at" target="_blank" rel="noopener">Bergfex</a> and <a class="underline text-primary" href="https://www.panomax.com/" target="_blank" rel="noopener">Panomax</a>. You can search and select up to 9 webcams per preset.</p>
                </div>

                <div class="grid grid-cols-8 mb-8">
                  <LayersIcon class="h-8 w-8 col-span-1 text-primary"/>
                  <p class="text-sm text-gray-300 col-span-7">You can create multiple presets and add up to 9 webcams on each. For example you could have presets for the Wachau, Hohe Tauern & Südsteiermark. You can easily switch presets using the drop down in the menu bar.</p>
                </div>

                <div class="grid grid-cols-8 mb-8">
                  <UpdateIcon class="h-8 w-8 col-span-1 text-primary"/>
                  <p class="text-sm text-gray-300 col-span-7">Each selected webcam can be refreshed, deleted and enlarged using the controls when hovering on a webcam. You can also visit the provider website.</p>
                </div>

                <div class="grid grid-cols-8 mb-8">
                  <GlobeIcon class="h-8 w-8 col-span-1 text-primary"/>
                  <p class="text-sm text-gray-300  col-span-7">You can also view all the webcams on a map of Austria by clicking the globe icon in the top right. From there you can add webcams to your selected preset.</p>
                </div>

                <div class="grid grid-cols-8 mb-12">
                  <GithubLogoIcon class="h-8 w-8 col-span-1 text-primary"/>
                  <p class="text-sm text-gray-300 col-span-7">I created this site as an easy way to monitor weather conditions for photography projects. The code is <a class="underline text-primary" href="https://github.com/AydinHassan/austriawebcamwatch" target="_blank" rel="noopener">fully open source on GitHub</a>.</p>
                </div>

                <p class="inline-flex items-center text-xs text-gray-300">To view this help again, click the <InfoCircledIcon class="mx-1"/> icon in the top right corner.</p>
              </div>
              <DialogFooter class="sm:justify-end">
                <DialogClose as-child>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogScrollContent>
          </Dialog>
          <RouterLink :to="toggleTo">
            <Button variant="outline" class="px-3 lg:px-4">
              <GlobeIcon v-if="path === '/'"></GlobeIcon>
              <HomeIcon v-else></HomeIcon>
            </Button>
          </RouterLink>
          <a href="https://github.com/AydinHassan/austriawebcamwatch" target="_blank">
            <Button variant="outline" class="px-3 lg:px-4">
              <GithubLogoIcon></GithubLogoIcon>
            </Button>
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="px-3 lg:px-4">
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
          <Dialog v-model:open="loginOpen">
            <DialogTrigger as-child>
              <Button variant="outline" class="px-3 lg:px-4">
                <PersonIcon :class="user ? 'text-green-500' : 'text-red-400'" />
              </Button>
            </DialogTrigger>
            <DialogScrollContent class="w-[90vw] sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Profile</DialogTitle>
              </DialogHeader>
              <div class="flex space-x-2 flex-col pt-6">
                <div v-if="user" class="flex flex-col gap-4">
                  <p v-if="user">Logged in as <Badge variant="secondary">{{user.email}}</Badge> via <Badge variant="outline">GitHub</Badge></p>

                  <Button variant="destructive" type="button" @click="handleLogout">Logout</Button>
                </div>
                <Button v-else variant="outline" type="button" @click="handleLogin('github')">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                      fill="currentColor"
                    />
                  </svg>
                  Login with GitHub
                </Button>
              </div>
              <DialogFooter class="sm:justify-end">
                <DialogClose as-child>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogScrollContent>
          </Dialog>

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
