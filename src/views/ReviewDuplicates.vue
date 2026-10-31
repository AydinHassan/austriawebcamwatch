<script setup lang="ts">
// Temporary page to decide which Bergfex cams are copies of Panomax or
// foto-webcam cams, by looking at both side by side.
import { computed, ref, watch } from 'vue'
import { useClipboard, useLocalStorage } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import pairs from '@/assets/duplicate-review.json'
import PanomaxViewer from '@/components/PanomaxViewer.vue'

type Verdict = 'same' | 'different'

const verdicts = useLocalStorage<Record<string, Verdict>>('duplicate-review', {})
const index = ref(Math.max(0, pairs.findIndex((p) => !verdicts.value[p.bergfex.name])))
const pair = computed(() => pairs[index.value])
const done = computed(() => Object.keys(verdicts.value).length)

function decide(verdict: Verdict) {
  verdicts.value = { ...verdicts.value, [pair.value.bergfex.name]: verdict }
  if (index.value < pairs.length - 1) index.value++
}

const { copy, copied } = useClipboard()
const results = computed(() => JSON.stringify(verdicts.value, null, 1))

// Reload the Bergfex frame for each pair
const frameKey = ref(0)
watch(index, () => frameKey.value++)
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <span>Pair {{ index + 1 }} of {{ pairs.length }}</span>
      <span>{{ done }} decided</span>
    </div>

    <div class="space-y-1">
      <p class="text-sm"><span class="text-sky-500">Bergfex:</span> {{ pair.bergfex.name }}</p>
      <div class="aspect-video w-full overflow-hidden rounded-md border bg-black">
        <iframe :key="frameKey" :src="pair.bergfex.url" class="h-full w-full" />
      </div>
    </div>

    <div class="space-y-1">
      <p class="text-sm">
        <span :class="pair.direct.provider === 'panomax' ? 'text-green-500' : 'text-amber-500'">
          {{ pair.direct.provider === 'panomax' ? 'Panomax' : 'Foto W' }}:
        </span>
        {{ pair.direct.name }}
        <a :href="pair.direct.link" target="_blank" class="ml-1 underline text-muted-foreground">open</a>
      </p>
      <template v-if="pair.direct.provider === 'panomax'">
        <!-- The whole 360° view at a glance, then a swipeable viewer -->
        <img :src="pair.direct.image" class="w-full rounded-md border" />
        <div class="aspect-video w-full overflow-hidden rounded-md border">
          <PanomaxViewer :key="pair.direct.camId" :webcam="{ ...pair.direct, camId: pair.direct.camId }" />
        </div>
      </template>
      <div v-else class="aspect-video w-full overflow-hidden rounded-md border bg-black">
        <img :src="pair.direct.image" class="h-full w-full object-contain" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <Button
        :variant="verdicts[pair.bergfex.name] === 'same' ? 'default' : 'outline'"
        @click="decide('same')"
      >
        Same cam
      </Button>
      <Button
        :variant="verdicts[pair.bergfex.name] === 'different' ? 'default' : 'outline'"
        @click="decide('different')"
      >
        Different
      </Button>
    </div>

    <div class="flex justify-between">
      <Button variant="ghost" :disabled="index === 0" @click="index--">‹ Back</Button>
      <Button variant="ghost" :disabled="index === pairs.length - 1" @click="index++">Skip ›</Button>
    </div>

    <Button variant="secondary" @click="copy(results)">
      {{ copied ? 'Copied!' : `Copy results (${done}/${pairs.length})` }}
    </Button>
  </div>
</template>
