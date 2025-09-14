<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { CaretSortIcon, CheckIcon,  PlusCircledIcon} from '@radix-icons/vue'
import { ref, computed, watch, provide, inject } from 'vue'

const emit = defineEmits(['update:selectedWebcams']);

import webcams from '@/assets/austria-cams.json';

const { selectedWebcams } = defineProps(['selectedWebcams'])

const open = ref(false)
const searchQuery = ref('')

const toggleWebcam = inject('toggleWebcam');

const webcamsToDisplay = computed(() => {
  if (searchQuery.value && searchQuery.value.length > 3) {
    return webcams.filter(i => i.name?.toLowerCase()?.includes(searchQuery.value))
  }

  return filteredCams.value
})

const filteredCams = computed(() => {
    return webcams.filter(item => !/\d$/.test(item.name)).slice(0, 500)
});

const selectCam = (camName) => {
  const webcam = webcams.find(w => w.name === camName);
  if (webcam) {
    toggleWebcam(webcam);
  }
}

defineExpose({
  open,
  selectCam
})
</script>

<template>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded="open"
          aria-label="Select a team"
          :class="cn('justify-between', $attrs.class ?? '')"
        >
          {{ selectedWebcams.length === 0
          ? 'No webcams selected'
          : selectedWebcams.length === 1
            ? selectedWebcams[0].name
            : `${selectedWebcams.length} webcams selected` }}
          <CaretSortIcon class="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[300px] p-0 mx-4">
        <Command @update:searchTerm="searchQuery = $event">
          <CommandList>
            <CommandInput placeholder="Search webcam..." />
            <CommandEmpty>No webcam found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                v-for="webcam in webcamsToDisplay"
                :key="webcam.url"
                :value="webcam.name"
                class="text-sm"
                @select="toggleWebcam(webcam)"
              >
                <span class="whitespace-nowrap text-ellipsis overflow-hidden max-w-[160px]">{{ webcam.name }}</span>
                <Badge v-if="webcam.provider === 'panomax'" variant="outline" class="ml-3 text-[9px] border-green-400/20 text-green-500">Panomax</Badge>
                <Badge v-if="webcam.provider === 'bergfex'" variant="outline" class="ml-3 text-[9px] border-sky-400/20 text-sky-500">Bergfex</Badge>
                <CheckIcon
                  :class="cn('ml-auto h-4 w-4',
                             selectedWebcams.some(w => w.name === webcam.name)
                               ? 'opacity-100'
                               : 'opacity-0',
                  )"
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
</template>
