<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { cn } from '@/lib/utils'
import { CaretSortIcon, CheckIcon} from '@radix-icons/vue'
import { ref, computed, inject } from 'vue'
import { getAllWebcams, searchWebcams, getWebcamByName } from '@/services/webcams'

const emit = defineEmits(['update:selectedWebcams']);

const { selectedWebcams } = defineProps(['selectedWebcams'])

const open = ref(false)
const searchQuery = ref('')

const toggleWebcam = inject('toggleWebcam');

const allWebcams = getAllWebcams()

const webcamsToDisplay = computed(() => {
  if (searchQuery.value && searchQuery.value.length > 3) {
    return searchWebcams(searchQuery.value)
  }

  return filteredCams.value
})

const filteredCams = computed(() => {
  return allWebcams.filter(item => !/\d$/.test(item.name)).slice(0, 500)
})

const selectCam = (camName: string) => {
  const webcam = getWebcamByName(camName)
  if (webcam) {
    toggleWebcam(webcam)
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
