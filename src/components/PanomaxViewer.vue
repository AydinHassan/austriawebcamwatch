<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  useDocumentVisibility,
  useElementSize,
  useElementVisibility,
  useIntervalFn,
  usePreferredReducedMotion,
  useRafFn,
} from '@vueuse/core'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, TrackNextIcon } from '@radix-icons/vue'
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import type { Webcam } from '@/services/webcams'
import {
  fetchDay,
  fetchLatestDay,
  imageUrl,
  neighbourShot,
  resolutionFor,
  shiftDate,
  todayInAustria,
  type PanomaxDay,
} from '@/services/panomax'

const props = defineProps<{ webcam: Webcam }>()
const camId = computed(() => props.webcam.camId!)
const today = computed(() => todayInAustria())

// --- Which shot is shown ---------------------------------------------------
// `selected` is null while following the latest shot.

const latest = ref<PanomaxDay | null>(null)
const selected = ref<{ day: PanomaxDay; time: string } | null>(null)
const error = ref<string | null>(null)
const busy = ref(false)

const live = computed(() => selected.value === null)
const day = computed(() => selected.value?.day ?? latest.value)
const time = computed(() => selected.value?.time ?? latest.value?.times.at(-1) ?? null)

function show(d: PanomaxDay, t: string) {
  const isLatest = latest.value?.date === d.date && latest.value.times.at(-1) === t
  selected.value = isLatest ? null : { day: d, time: t }
}

function goLive() {
  selected.value = null
  refreshLatest()
}

defineExpose({ refresh: goLive })

// --- Polling for new shots ---------------------------------------------------
// Only while following the latest shot and the cam is on screen.

const root = ref<HTMLElement | null>(null)
const isVisible = useElementVisibility(root)
const pageVisibility = useDocumentVisibility()

async function refreshLatest() {
  try {
    latest.value = await fetchLatestDay(camId.value)
  } catch {
    if (!latest.value) error.value = 'Could not load this cam'
  }
}

const poll = useIntervalFn(refreshLatest, 2 * 60_000, { immediate: false })
watch(
  () => live.value && isVisible.value && pageVisibility.value === 'visible',
  (active) => (active ? poll.resume() : poll.pause()),
  { immediate: true },
)

// --- History navigation ----------------------------------------------------

async function step(direction: 1 | -1) {
  if (!day.value || !time.value || busy.value) return
  busy.value = true
  try {
    const target = await neighbourShot(camId.value, day.value, time.value, direction, {
      min: props.webcam.firstPano,
      max: today.value,
    })
    if (target) show(target.day, target.time)
    else if (direction === 1) goLive()
  } finally {
    busy.value = false
  }
}

const pickerOpen = ref(false)
const pickerDate = ref('')
const pickerDay = ref<PanomaxDay | null>(null)
const pickerIndex = ref([0])
const pickerMessage = ref<string | null>(null)

watch(pickerOpen, (open) => {
  if (!open || !day.value) return
  pickerDate.value = day.value.date
  pickerDay.value = day.value
  pickerIndex.value = [Math.max(0, day.value.times.indexOf(time.value!))]
  pickerMessage.value = null
})

async function pickDate(date: string) {
  if (!date) return
  pickerDate.value = date
  pickerMessage.value = 'Loading…'
  const d = await fetchDay(camId.value, date).catch(() => null)
  pickerDay.value = d
  pickerMessage.value = d ? null : 'No images'
  if (!d) return
  // Keep roughly the same time of day when switching dates
  pickerIndex.value = [
    Math.max(
      0,
      d.times.findLastIndex((t) => t <= (time.value ?? '12:00:00')),
    ),
  ]
  showPicked()
}

function showPicked() {
  if (pickerDay.value) show(pickerDay.value, pickerDay.value.times[pickerIndex.value[0]])
}

// Desktop Chrome only opens its calendar from the icon, so open it on click
function openNativePicker(e: MouseEvent) {
  try {
    ;(e.currentTarget as HTMLInputElement).showPicker?.()
  } catch {
    // Unsupported: the browser's default behaviour applies
  }
}

// --- Labels ----------------------------------------------------------------

const formatDate = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' })

const label = computed(() => {
  if (!day.value || !time.value) return '…'
  const t = time.value.slice(0, 5)
  if (day.value.date === today.value) return t
  const sameYear = day.value.date.slice(0, 4) === today.value.slice(0, 4)
  return `${formatDate(day.value.date, { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' })} ${t}`
})

const pickerDateLabel = computed(() =>
  pickerDate.value
    ? formatDate(pickerDate.value, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '',
)
const pickerTime = (i: number) => pickerDay.value?.times[i]?.slice(0, 5) ?? '--:--'

// --- Image loading ---------------------------------------------------------
// Preload, then swap, so stepping through shots does not flash black.

const { height: rootHeight, width: rootWidth } = useElementSize(root)
const src = computed(() => {
  if (!day.value || !time.value) return null
  return imageUrl(
    camId.value,
    day.value,
    time.value,
    resolutionFor(rootHeight.value * (window.devicePixelRatio || 1)),
  )
})
const shown = ref<{ src: string; ratio: number } | null>(null)
const loading = ref(false)

watch(src, (url) => {
  if (!url) return
  loading.value = true
  const img = new Image()
  img.onload = () => {
    if (src.value !== url) return
    shown.value = { src: url, ratio: img.naturalWidth / img.naturalHeight }
    loading.value = false
    error.value = null
  }
  img.onerror = () => {
    if (src.value !== url) return
    loading.value = false
    error.value = 'Image not available'
  }
  img.src = url
})

// --- Panning ---------------------------------------------------------------
// The image fills the height; pan is a 0..1 fraction of the horizontal overflow.

const pan = ref(0.5)
const imgWidth = computed(() => (shown.value ? rootHeight.value * shown.value.ratio : 0))
const overflow = computed(() => Math.max(0, imgWidth.value - rootWidth.value))
const clamp = (v: number) => Math.min(1, Math.max(0, v))

let drag: { x: number; pan: number; id: number } | null = null
let lastInteraction = 0

function onPointerDown(e: PointerEvent) {
  drag = { x: e.clientX, pan: pan.value, id: e.pointerId }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  lastInteraction = Date.now()
}

function onPointerMove(e: PointerEvent) {
  if (drag?.id !== e.pointerId || !overflow.value) return
  pan.value = clamp(drag.pan - (e.clientX - drag.x) / overflow.value)
  lastInteraction = Date.now()
}

function onPointerUp() {
  drag = null
  lastInteraction = Date.now()
}

// Slow back-and-forth drift while idle, like the Panomax viewer
let autoDir = 1
const reducedMotion = usePreferredReducedMotion()
useRafFn(({ delta }) => {
  if (reducedMotion.value === 'reduce' || drag || !overflow.value || !isVisible.value) return
  if (Date.now() - lastInteraction < 8_000) return
  const next = pan.value + (autoDir * 12 * Math.min(delta, 100)) / 1000 / overflow.value
  if (next <= 0 || next >= 1) autoDir = -autoDir
  pan.value = clamp(next)
})

onMounted(goLive)
onBeforeUnmount(() => poll.pause())

watch(camId, () => {
  latest.value = null
  shown.value = null
  pan.value = 0.5
  goLive()
})
</script>

<template>
  <div ref="root" class="relative h-full w-full overflow-hidden bg-black select-none">
    <!-- Touch handlers stop propagation so dragging does not trigger the mobile cam swiper -->
    <div
      class="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @touchstart.stop
      @touchend.stop
    >
      <img
        v-if="shown"
        :src="shown.src"
        :alt="webcam.name"
        draggable="false"
        class="absolute top-0 h-full max-w-none will-change-transform"
        :style="{
          width: `${imgWidth}px`,
          left: overflow ? '0' : `${(rootWidth - imgWidth) / 2}px`,
          transform: `translateX(${-pan * overflow}px)`,
        }"
      />
    </div>

    <div
      v-if="!shown"
      class="absolute inset-0 flex items-center justify-center bg-black/80 text-sm text-gray-300"
    >
      <span v-if="error">{{ error }}</span>
      <Loader2 v-else class="h-12 w-12 text-white animate-spin" />
    </div>

    <!-- The whole bar anchors the picker, so the two line up -->
    <Popover v-model:open="pickerOpen">
      <PopoverAnchor as-child>
        <div
          class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-md bg-black/35 p-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md"
        >
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 hover:bg-white/20 hover:text-white"
            :disabled="!day || busy"
            aria-label="Previous image"
            @click="step(-1)"
          >
            <ChevronLeftIcon />
          </Button>
          <PopoverTrigger as-child>
            <Button
              variant="ghost"
              class="h-7 px-3 text-xs tabular-nums hover:bg-white/20 hover:text-white"
              aria-label="Choose date and time"
            >
              <Loader2 v-if="loading && shown" class="animate-spin" />
              {{ label }}
            </Button>
          </PopoverTrigger>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 hover:bg-white/20 hover:text-white"
            :disabled="!day || busy || live"
            aria-label="Next image"
            @click="step(1)"
          >
            <ChevronRightIcon />
          </Button>
          <Button
            v-if="!live"
            variant="ghost"
            size="icon"
            class="h-7 w-7 bg-white/15 hover:bg-white/25 hover:text-white"
            aria-label="Back to latest image"
            title="Latest"
            @click="goLive"
          >
            <TrackNextIcon />
          </Button>
        </div>
      </PopoverAnchor>
      <!-- No auto-focus: focusing the hidden date input would open the native picker on mobile -->
      <PopoverContent
        class="w-72 space-y-3 border-white/10 bg-black/75 text-white backdrop-blur-md"
        side="top"
        :side-offset="6"
        @open-auto-focus.prevent
      >
        <div class="flex items-center gap-1 text-xs">
          <!-- The native date input sits invisibly on top: tapping the label opens the device calendar -->
          <div class="relative flex-1">
            <div
              class="flex h-8 items-center gap-2 whitespace-nowrap rounded-md bg-white/10 px-2.5 text-sm text-white"
            >
              <CalendarIcon class="text-white/60" />
              {{ pickerDateLabel }}
            </div>
            <input
              :value="pickerDate"
              type="date"
              :min="webcam.firstPano ?? undefined"
              :max="today"
              aria-label="Date"
              class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              @click="openNativePicker"
              @change="pickDate(($event.target as HTMLInputElement).value)"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
            :disabled="!!webcam.firstPano && pickerDate <= webcam.firstPano"
            aria-label="Previous day"
            @click="pickDate(shiftDate(pickerDate, -1))"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
            :disabled="pickerDate >= today"
            aria-label="Next day"
            @click="pickDate(shiftDate(pickerDate, 1))"
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div class="space-y-2 text-xs text-white/60">
          <Slider
            v-model="pickerIndex"
            :min="0"
            :max="pickerDay ? pickerDay.times.length - 1 : 0"
            :disabled="!pickerDay"
            aria-label="Time"
            @value-commit="showPicked"
          />
          <div class="flex items-baseline justify-between tabular-nums text-white/40">
            <span>{{ pickerTime(0) }}</span>
            <span class="text-sm text-white">{{
              pickerMessage ?? pickerTime(pickerIndex[0])
            }}</span>
            <span>{{ pickerTime((pickerDay?.times.length ?? 0) - 1) }}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
