<script setup>
import {Button} from "@/components/ui/button";
import CamSwitcher from "@/components/CamSwitcher.vue";
import { GlobeIcon, HomeIcon, GithubLogoIcon, CameraIcon, TwitterLogoIcon } from '@radix-icons/vue'
import { useRoute } from 'vue-router';


import { ref, onMounted, watch, provide, computed } from 'vue'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Icon } from '@iconify/vue'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode()
mode.value = 'dark'

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


const selectedWebcams = ref([]);
const webcamSelectorRef = ref(null);

const addSelectedWebcam = (webcam) => {
  const index = selectedWebcams.value.findIndex(
    (selected) => selected.name === webcam.name
  )

  if (index !== -1) {
    return; //it's already in there
  }

  if (selectedWebcams.value.length >= 9) {
    selectedWebcams.value.shift()
  }
  // Add the webcam to the selected list
  selectedWebcams.value.push(webcam)
}

const toggleWebcam = (webcam) => {
  const index = selectedWebcams.value.findIndex(
    (selected) => selected.name === webcam.name
  )

  if (index !== -1) {
    // Remove the webcam if it's already selected
    selectedWebcams.value.splice(index, 1)
  } else {
    // If more than 9 webcams are selected, remove the first one
    if (selectedWebcams.value.length >= 9) {
      selectedWebcams.value.shift()
    }
    // Add the webcam to the selected list
    selectedWebcams.value.push(webcam)
  }
}

provide('selectedWebcams', selectedWebcams);
provide('webcamSelectorRef', webcamSelectorRef);
provide('addSelectedWebcam', addSelectedWebcam);
provide('toggleWebcam', toggleWebcam);

onMounted(() => {
  const storedSelection = localStorage.getItem('selectedWebcams')
  if (storedSelection) {
    selectedWebcams.value = JSON.parse(storedSelection)
  }
})

watch(selectedWebcams, (newSelection) => {
  localStorage.setItem('selectedWebcams', JSON.stringify(newSelection))
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
          :selectedWebcams="selectedWebcams"
        />
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
</template>
