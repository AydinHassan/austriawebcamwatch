<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDocumentVisibility, useElementSize, useElementVisibility, usePreferredReducedMotion } from '@vueuse/core'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, TrackNextIcon } from '@radix-icons/vue'
import { Loader2 } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PopoverAnchor } from 'radix-vue'
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

// --- Which shot is shown ---------------------------------------------------

const live = ref(true)
const day = ref<PanomaxDay | null>(null)
const time = ref<string | null>(null)
const error = ref<string | null>(null)
const stepping = ref(false)

const root = ref<HTMLElement | null>(null)
const { height: rootHeight, width: rootWidth } = useElementSize(root)
const resolution = computed(() => resolutionFor(rootHeight.value * (window.devicePixelRatio || 1)))

const src = computed(() =>
  day.value && time.value ? imageUrl(camId.value, day.value, time.value, resolution.value) : null,
)

// --- Polling for new shots (live mode only) --------------------------------
// New shots usually arrive every 10 minutes. After seeing one we wait roughly
// one interval before checking again, then check once a minute until it lands.

const isVisible = useElementVisibility(root)
const pageVisibility = useDocumentVisibility()
let pollTimer: ReturnType<typeof setTimeout> | null = null
let lastPollAt = 0

function shotIntervalMs(d: PanomaxDay): number {
  const t = d.times
  if (t.length < 2) return 10 * 60_000
  const toMin = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5)
  return Math.max(1, toMin(t[t.length - 1]) - toMin(t[t.length - 2])) * 60_000
}

function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

function canPoll() {
  return live.value && isVisible.value && pageVisibility.value === 'visible'
}

async function pollLatest() {
  stopPolling()
  lastPollAt = Date.now()
  let delay = 60_000
  try {
    const latest = await fetchLatestDay(camId.value)
    const newest = latest.times[latest.times.length - 1] ?? null
    const isNew = !day.value || day.value.date !== latest.date || time.value !== newest
    if (live.value && newest) {
      day.value = latest
      time.value = newest
      error.value = null
    }
    if (isNew) delay = Math.max(60_000, shotIntervalMs(latest) - 30_000)
  } catch {
    if (!day.value) error.value = 'Could not load this cam'
  }
  if (canPoll()) pollTimer = setTimeout(pollLatest, delay)
}

watch([isVisible, pageVisibility], () => {
  if (!canPoll()) return stopPolling()
  if (!pollTimer && Date.now() - lastPollAt > 60_000) pollLatest()
})

function goLive() {
  live.value = true
  pollLatest()
}

defineExpose({ refresh: goLive })

// --- History navigation ----------------------------------------------------

const today = computed(() => todayInAustria())

async function step(direction: 1 | -1) {
  if (!day.value || !time.value || stepping.value) return
  stepping.value = true
  try {
    const target = await neighbourShot(camId.value, day.value, time.value, direction, {
      min: props.webcam.firstPano,
      max: today.value,
    })
    if (target) {
      live.value = false
      stopPolling()
      day.value = target.day
      time.value = target.time
    } else if (direction === 1) {
      goLive()
    }
  } finally {
    stepping.value = false
  }
}

const pickerOpen = ref(false)
const pickerDate = ref('')
const pickerDay = ref<PanomaxDay | null>(null)
const pickerIndex = ref(0)
const pickerMessage = ref<string | null>(null)

watch(pickerOpen, (open) => {
  if (!open || !day.value) return
  pickerDate.value = day.value.date
  pickerDay.value = day.value
  pickerIndex.value = Math.max(0, day.value.times.indexOf(time.value!))
  pickerMessage.value = null
})

async function onPickDate() {
  if (!pickerDate.value) return
  pickerMessage.value = 'Loading…'
  const d = await fetchDay(camId.value, pickerDate.value).catch(() => null)
  pickerDay.value = d
  if (!d) {
    pickerMessage.value = 'No images'
    return
  }
  pickerMessage.value = null
  // Keep roughly the same time of day when switching dates
  const current = time.value ?? '12:00:00'
  pickerIndex.value = Math.max(0, d.times.findLastIndex((t) => t <= current))
  showPicked()
}

function shiftPickerDate(days: number) {
  if (!pickerDate.value) return
  pickerDate.value = shiftDate(pickerDate.value, days)
  onPickDate()
}

// Chrome on desktop only opens its calendar from the icon, so open it explicitly
function openNativePicker(e: MouseEvent) {
  try {
    ;(e.currentTarget as HTMLInputElement).showPicker?.()
  } catch {
    // Not supported or not allowed; the browser falls back to its default behaviour
  }
}

function showPicked() {
  const d = pickerDay.value
  if (!d) return
  const t = d.times[pickerIndex.value]
  if (live.value && d.date === day.value?.date && t === d.times[d.times.length - 1]) return
  live.value = false
  stopPolling()
  day.value = d
  time.value = t
}

// --- Labels ----------------------------------------------------------------

function formatDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`)
  const sameYear = date.slice(0, 4) === today.value.slice(0, 4)
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  })
}

const label = computed(() => {
  if (!day.value || !time.value) return '…'
  const t = time.value.slice(0, 5)
  if (live.value) return t
  return day.value.date === today.value ? t : `${formatDate(day.value.date)} ${t}`
})

const pickerDateLabel = computed(() => {
  if (!pickerDate.value) return ''
  return new Date(`${pickerDate.value}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
})

const pickerTimeLabel = computed(() => pickerDay.value?.times[pickerIndex.value]?.slice(0, 5) ?? '')

// --- Image loading ---------------------------------------------------------
// Preload the next image and swap it in once ready, so stepping through shots
// does not flash black.

const shown = ref<{ src: string; w: number; h: number } | null>(null)
const loading = ref(false)

watch(src, (url) => {
  if (!url) return
  loading.value = true
  const img = new Image()
  img.onload = () => {
    if (src.value !== url) return
    shown.value = { src: url, w: img.naturalWidth, h: img.naturalHeight }
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
// The image covers the viewport; pan is stored as a 0..1 fraction of the
// overflow so it survives image swaps and resizes.

const panX = ref(0.5)
const panY = ref(0.5)

const layout = computed(() => {
  if (!shown.value || !rootWidth.value || !rootHeight.value) return null
  const scale = Math.max(rootHeight.value / shown.value.h, rootWidth.value / shown.value.w)
  const w = shown.value.w * scale
  const h = shown.value.h * scale
  return { w, h, overX: Math.max(0, w - rootWidth.value), overY: Math.max(0, h - rootHeight.value) }
})

const imgStyle = computed(() => {
  const l = layout.value
  if (!l) return {}
  return {
    width: `${l.w}px`,
    height: `${l.h}px`,
    transform: `translate3d(${-panX.value * l.overX}px, ${-panY.value * l.overY}px, 0)`,
  }
})

const clamp = (v: number) => Math.min(1, Math.max(0, v))

let drag: { x: number; y: number; panX: number; panY: number; id: number } | null = null
let lastInteraction = 0

function onPointerDown(e: PointerEvent) {
  if (!layout.value) return
  drag = { x: e.clientX, y: e.clientY, panX: panX.value, panY: panY.value, id: e.pointerId }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  lastInteraction = Date.now()
}

function onPointerMove(e: PointerEvent) {
  const l = layout.value
  if (!drag || drag.id !== e.pointerId || !l) return
  if (l.overX) panX.value = clamp(drag.panX - (e.clientX - drag.x) / l.overX)
  if (l.overY) panY.value = clamp(drag.panY - (e.clientY - drag.y) / l.overY)
  lastInteraction = Date.now()
}

function onPointerUp(e: PointerEvent) {
  if (drag?.id === e.pointerId) drag = null
  lastInteraction = Date.now()
}

// Slow back-and-forth drift while idle, like the Panomax viewer
const reducedMotion = usePreferredReducedMotion()
const AUTO_PAN_PX_PER_SEC = 12
const IDLE_BEFORE_AUTO_PAN_MS = 8_000
let autoDir = 1
let raf = 0
let lastFrame = 0

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = lastFrame ? Math.min(100, now - lastFrame) : 0
  lastFrame = now
  const l = layout.value
  if (!l || !l.overX || drag || Date.now() - lastInteraction < IDLE_BEFORE_AUTO_PAN_MS) return
  if (!isVisible.value || pageVisibility.value !== 'visible') return
  let next = panX.value + (autoDir * AUTO_PAN_PX_PER_SEC * dt) / 1000 / l.overX
  if (next >= 1 || next <= 0) {
    autoDir = -autoDir
    next = clamp(next)
  }
  panX.value = next
}

onMounted(() => {
  pollLatest()
  if (reducedMotion.value !== 'reduce') raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  stopPolling()
  cancelAnimationFrame(raf)
})

watch(
  () => props.webcam.camId,
  () => {
    day.value = null
    time.value = null
    shown.value = null
    panX.value = 0.5
    panY.value = 0.5
    goLive()
  },
)
</script>

<template>
  <div ref="root" class="relative h-full w-full overflow-hidden bg-black select-none">
    <!-- Touch handlers stop propagation so dragging does not trigger the mobile cam swiper -->
    <div
      class="absolute inset-0 cursor-grab active:cursor-grabbing"
      :style="{ touchAction: layout?.overY ? 'none' : 'pan-y' }"
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
        class="absolute left-0 top-0 max-w-none will-change-transform"
        :style="imgStyle"
      />
    </div>

    <div v-if="!shown && !error" class="absolute inset-0 flex items-center justify-center bg-black/80">
      <Loader2 class="h-12 w-12 text-white animate-spin" />
    </div>
    <div v-if="error && !shown" class="absolute inset-0 flex items-center justify-center text-sm text-gray-300">
      {{ error }}
    </div>

    <!-- The whole bar is the popover anchor, so the picker lines up with it -->
    <Popover v-model:open="pickerOpen">
      <PopoverAnchor as-child>
        <div
          class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-md bg-black/35 p-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md"
        >
          <button
            class="flex h-7 w-7 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/20 disabled:opacity-30"
            :disabled="!day || stepping"
            aria-label="Previous image"
            @click="step(-1)"
          >
            <ChevronLeftIcon class="h-4 w-4" />
          </button>
          <PopoverTrigger as-child>
            <button
              class="flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 tabular-nums transition-colors hover:bg-white/20"
              aria-label="Choose date and time"
            >
              <Loader2 v-if="loading && shown" class="h-3 w-3 animate-spin" />
              {{ label }}
            </button>
          </PopoverTrigger>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/20 disabled:opacity-30"
            :disabled="!day || stepping || live"
            aria-label="Next image"
            @click="step(1)"
          >
            <ChevronRightIcon class="h-4 w-4" />
          </button>
          <button
            v-if="!live"
            class="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 transition-colors hover:bg-white/25"
            aria-label="Back to latest image"
            title="Latest"
            @click="goLive"
          >
            <TrackNextIcon class="h-3.5 w-3.5" />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        class="w-72 space-y-3 border-white/10 bg-black/75 text-white backdrop-blur-md"
        side="top"
        :side-offset="6"
      >
        <div class="space-y-1.5 text-xs text-white/60">
          <span>Date</span>
          <div class="flex items-center gap-1">
            <!-- The native date input sits invisibly on top, so tapping the
                 label opens the device's own calendar without its styling -->
            <div class="relative flex-1">
              <div class="flex h-8 items-center gap-2 whitespace-nowrap rounded-md bg-white/10 px-2.5 text-sm text-white">
                <CalendarIcon class="h-3.5 w-3.5 text-white/60" />
                {{ pickerDateLabel }}
              </div>
              <input
                v-model="pickerDate"
                type="date"
                :min="webcam.firstPano ?? undefined"
                :max="today"
                aria-label="Date"
                class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                @click="openNativePicker"
                @change="onPickDate"
              />
            </div>
            <button
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-white/15 disabled:opacity-30"
              :disabled="!!webcam.firstPano && pickerDate <= webcam.firstPano"
              aria-label="Previous day"
              @click="shiftPickerDate(-1)"
            >
              <ChevronLeftIcon class="h-4 w-4 text-white" />
            </button>
            <button
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-white/15 disabled:opacity-30"
              :disabled="pickerDate >= today"
              aria-label="Next day"
              @click="shiftPickerDate(1)"
            >
              <ChevronRightIcon class="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
        <label class="block space-y-1.5 text-xs text-white/60">
          <span class="flex justify-between">
            <span>Time</span>
            <span class="tabular-nums" :class="pickerDay ? 'text-white' : ''">
              {{ pickerMessage ?? pickerTimeLabel }}
            </span>
          </span>
          <input
            v-model.number="pickerIndex"
            type="range"
            min="0"
            :max="pickerDay ? pickerDay.times.length - 1 : 0"
            :disabled="!pickerDay"
            class="w-full accent-white disabled:opacity-30"
            @change="showPicked"
          />
          <span class="flex justify-between tabular-nums text-white/40">
            <span>{{ pickerDay?.times[0].slice(0, 5) ?? '--:--' }}</span>
            <span>{{ pickerDay?.times[pickerDay.times.length - 1].slice(0, 5) ?? '--:--' }}</span>
          </span>
        </label>
      </PopoverContent>
    </Popover>
  </div>
</template>
