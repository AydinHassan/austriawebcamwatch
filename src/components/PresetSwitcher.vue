<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { cn } from '@/lib/utils'

import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-icons/vue'
import { ref, inject } from 'vue'
import { Dialog, DialogFooter, DialogHeader, DialogDescription, DialogTitle, DialogTrigger, DialogContent } from '@/components/ui/dialog'

const { presets, selectedPreset } = defineProps(['presets', 'selectedPreset'])

const open = ref(false)
const searchQuery = ref('')

defineExpose({
  open
})

const switchPreset = inject('switchPreset');
const deletePreset = inject('deletePreset');

const presetToDelete = ref(null);
const deleteOpen = ref(false)
</script>

<template>
  <Dialog v-model:open="deleteOpen">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded="open"
          aria-label="Select a preset"
          :class="cn('justify-between', $attrs.class ?? '')"
        >
          {{ selectedPreset?.name ?? 'No preset selected' }}
          <CaretSortIcon class="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0 mx-4">
        <Command @update:searchTerm="searchQuery = $event">
          <CommandList>
            <CommandInput placeholder="Search presets..." />
            <CommandEmpty>No preset found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                v-for="preset in presets"
                :key="preset.name"
                :value="preset.name"
                class="text-sm"
                @select="switchPreset(preset.name)"
              >
                <span class="whitespace-nowrap text-ellipsis overflow-hidden max-w-[160px]">{{ preset.name }}</span>
                <Badge variant="outline" class="ml-3 text-[9px] border-green-400/20 text-green-500"> {{preset.cams.length }} webcams</Badge>
                <DialogTrigger asChild>
                  <Cross2Icon @click="presetToDelete = preset.name" :class="cn('ml-2 h-4 w-4 cursor-pointer hover:text-red-400')" />
                </DialogTrigger>
                <CheckIcon
                  :class="cn('ml-auto h-4 w-4',
                             preset.name === selectedPreset?.name ?? null
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

    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. Are you sure you want to delete this preset?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="submit" @click="deletePreset(presetToDelete); deleteOpen = false">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
