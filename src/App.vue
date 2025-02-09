<script setup>
import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import MainNav from './components/MainNav.vue'

import Search from './components/Search.vue'
import CamSwitcher from "@/components/CamSwitcher.vue";

import { ref, onMounted, watch } from 'vue'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Icon } from '@iconify/vue'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode()
mode.value = 'dark'

import { ExternalLinkIcon } from '@radix-icons/vue'


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

const filePath = '../austria-cams.json';

import webcams from '@/assets/austria-cams.json';
import EmptyCard from '@/components/ui/card/EmptyCard.vue'


const selectedWebcams = ref([]);

onMounted(() => {
  const storedSelection = localStorage.getItem('selectedWebcams')
  if (storedSelection) {
    selectedWebcams.value = JSON.parse(storedSelection)
  }
})

watch(selectedWebcams, (newSelection) => {
  localStorage.setItem('selectedWebcams', JSON.stringify(newSelection))
})

const webcamSelectorRef = ref(null);
</script>

<template>
  <div class="hidden h-full flex-col md:flex ">
    <div class="border-b">
      <div class="flex h-16 items-center px-4">
        <CamSwitcher
          ref="webcamSelectorRef"
          :webcams="webcams"
          :selectedWebcams="selectedWebcams"
          @update:selectedWebcams="selectedWebcams = $event"/>
        <MainNav class="mx-6"/>
        <div class="ml-auto flex items-center space-x-4">
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
    <div class="flex flex-1 flex-grow space-y-4 p-4">
      <div class="w-full grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 lg:grid-rows-3">
        <Card v-for="cam in selectedWebcams" v-bind:key="cam.name" class="h-[500px] lg:h-full col-span-1 flex flex-col group relative">
          <CardHeader class="flex-row justify-between items-center absolute w-full hidden bg-background group-hover:flex">
            <CardTitle>{{cam.name}}</CardTitle>
            <a :href="cam.url" class="bg-secondary hover:bg-secondary/90 rounded p-0.5" target="_blank"><ExternalLinkIcon></ExternalLinkIcon></a>
          </CardHeader>
          <CardContent class="flex flex-1">
            <iframe :src="cam.url" class="w-full  aspect-1" sandbox="allow-scripts" ></iframe>
          </CardContent>
        </Card>
        <template v-if="selectedWebcams.length < 9">
          <EmptyCard v-for="i in 9 - selectedWebcams.length" v-bind:key="i" @click="webcamSelectorRef.open = true">
          </EmptyCard>
        </template>
      </div>
    </div>
  </div>
</template>
