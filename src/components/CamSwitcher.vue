
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
// import CaretSortIcon from '~icons/radix-icons/caret-sort'
import { CaretSortIcon, CheckIcon,  PlusCircledIcon} from '@radix-icons/vue'
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['update:selectedWebcams']);

const { webcams, selectedWebcams } = defineProps(['webcams', 'selectedWebcams'])

const open = ref(false)
const searchQuery = ref('')
const apiResults = ref([])
const filteredWebcams = computed(() => {
  const searchLower = searchQuery.value.toLowerCase()

  // Filter the predefined webcams list based on the search query
  const filteredPanomax = webcams.filter(webcam =>
    webcam.name.toLowerCase().includes(searchLower)
  )

  // Return merged list: filtered predefined webcams + API results
  return [
    ...filteredPanomax,
    ...apiResults.value.filter(apiWebcam =>
      apiWebcam.name.toLowerCase().includes(searchLower)
    ),
  ]
})
import { debounce } from '@/lib/utils'
// Debounced function to fetch API results
const fetchApiResults = debounce(async (query) => {
  if (!query) {
    return
  }

  try {
    const response = await fetch(`https://www.bergfex.com/presentation/api/search/webcams/?q=${query}`, {
      mode: 'no-cors'
    })
    const data = await response.json()

    console.log(data);
    apiResults.value = data.result.map((webcam) => ({
      name: webcam.name,
      id: webcam.id,
      link: webcam.link,
    }))
  } catch (error) {
    console.error('Error fetching API results:', error)
  }
}, 500)

// Watch for changes in the search query and trigger the API call
watch(searchQuery, (newQuery) => {
  fetchApiResults(newQuery)
})

defineExpose({
  open
})

const toggleSelection = (webcam) => {
  // Make a copy of the selectedWebcams array
  const updatedSelection = [...selectedWebcams]

  const index = updatedSelection.findIndex(
    (selected) => selected.name === webcam.name
  )

  if (index !== -1) {
    // Remove the webcam if it's already selected
    updatedSelection.splice(index, 1)
  } else {
    // If more than 9 webcams are selected, remove the first one
    if (updatedSelection.length >= 9) {
      updatedSelection.shift()
    }
    // Add the webcam to the selected list
    updatedSelection.push(webcam)
  }

  // Emit the updated selection to the parent
  emit('update:selectedWebcams', updatedSelection)
}
</script>

<template>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded="open"
          aria-label="Select a team"
          :class="cn('w-[200px] justify-between', $attrs.class ?? '')"
        >
          {{ selectedWebcams.length === 0
          ? 'No webcams selected'
          : selectedWebcams.length === 1
            ? selectedWebcams[0].name
            : `${selectedWebcams.length} webcams selected` }}
          <CaretSortIcon class="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-0">
        <Command @update:searchTerm="searchQuery = $event" :filter-function="(list, term) => list.filter(i => i?.toLowerCase()?.includes(term)) ">
          <CommandList>
            <CommandInput placeholder="Search webcam..." />
            <CommandEmpty>No webcam found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                v-for="webcam in filteredWebcams"
                :key="webcam.name"
                :value="webcam.name"
                class="text-sm"
                @select="toggleSelection(webcam)"
              >
                {{ webcam.name }}
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
