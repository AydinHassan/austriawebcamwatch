<script setup lang="ts">
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
import { CameraIcon, GithubLogoIcon, GlobeIcon, HomeIcon, InfoCircledIcon, LayersIcon,
  PersonIcon, UpdateIcon } from '@radix-icons/vue'
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuSub } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import { useColorMode } from '@vueuse/core'
const route = useRoute();
const mode = useColorMode()
const auth = useAuthStore()

const infoOpen = ref(false);
const loginOpen = ref(false);

const props = defineProps<{
  firstVisit: boolean
}>()

watch(
  () => props.firstVisit,
  (v) => {
    infoOpen.value = v
  },
  { immediate: true }
)

const toggleTo = computed(() => (route.path === '/map' ? '/' : '/map'));

</script>

<template>
  <div class="hidden md:flex space-x-2 lg:space-x-4">
    <Button @click="infoOpen = true" variant="outline" class="px-3 lg:px-4"> <InfoCircledIcon></InfoCircledIcon></Button>
    <Button @click="$router.push(toggleTo)" variant="outline" class="px-3 lg:px-4">
      <GlobeIcon v-if="route.path === '/'"></GlobeIcon>
      <HomeIcon v-else></HomeIcon>
    </Button>
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
        <DropdownMenuItem @click="mode = 'light'"> Light </DropdownMenuItem>
        <DropdownMenuItem @click="mode = 'dark'"> Dark </DropdownMenuItem>
        <DropdownMenuItem @click="mode = 'auto'"> System </DropdownMenuItem>
      </DropdownMenuContent> </DropdownMenu>
      <Button @click="loginOpen = true" variant="outline" class="px-3 lg:px-4">
        <PersonIcon :class="auth.user ? 'text-green-500' : 'text-red-400'" />
      </Button>
  </div>

  <div class="inline-flex md:hidden">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" class="px-3 lg:px-4">
          <Icon icon="radix-icons:hamburger-menu" class="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="min-w-48">
        <DropdownMenuItem @click="infoOpen = true">
          <InfoCircledIcon class="mr-2 h-4 w-4" />
          Info & Help
        </DropdownMenuItem>

        <DropdownMenuItem @click="$router.push(toggleTo)">
          <GlobeIcon v-if="route.path === '/'" class="mr-2 h-4 w-4" />
          <HomeIcon v-else class="mr-2 h-4 w-4" />
          {{ route.path === '/' ? 'Map' : 'Webcams' }}
        </DropdownMenuItem>

        <DropdownMenuItem as-child>
          <a href="https://github.com/AydinHassan/austriawebcamwatch" target="_blank" class="flex items-center">
            <GithubLogoIcon class="mr-2 h-4 w-4" />
            GitHub
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Icon icon="radix-icons:moon" class="mr-4 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Icon icon="radix-icons:sun" class="mr-4 absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem @click="mode = 'light'"> Light </DropdownMenuItem>
              <DropdownMenuItem @click="mode = 'dark'"> Dark </DropdownMenuItem>
              <DropdownMenuItem @click="mode = 'auto'"> System </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>

        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem @click="loginOpen = true">
          <PersonIcon class="mr-2 h-4 w-4" :class="auth.user ? 'text-green-500' : 'text-red-400'" />
          {{ auth.user ? 'Profile' : 'Login' }}
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  </div>


  <Dialog v-model:open="infoOpen">
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

  <Dialog v-model:open="loginOpen">
    <DialogScrollContent class="w-[90vw] sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Profile</DialogTitle>
      </DialogHeader>
      <div class="flex space-x-2 flex-col pt-6">
        <div v-if="auth.user" class="flex flex-col gap-4">
          <p>Logged in as <Badge variant="secondary">{{auth.user.email}}</Badge> via <Badge variant="outline">GitHub</Badge></p>

          <Button variant="destructive" type="button" @click="auth.logout()">Logout</Button>
        </div>
        <Button v-else variant="outline" type="button" @click="auth.login('github')">
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
</template>
