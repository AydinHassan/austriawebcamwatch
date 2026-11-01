// Direct access to Bergfex's webcam archive. Its day listing allows calls
// from other sites and includes the full image URL for every shot.

import type { Webcam } from '@/services/webcams'
import { todayInAustria, shiftDate, type CamDay, type CamSource } from '@/services/camSource'

const API = 'https://images.bergfex.at/ajax/webcamsarchive/'
// Sizes by preference: 5 and 3 are ~720px tall, 2 ~514px, 4 ~360px, 1 ~345px.
// Each size has its own URLs and its own list of today's shots, and those lists
// can be over an hour apart, so no single size can be trusted to be the newest.
const SIZES = [5, 3, 2, 4, 1]
const SIZE = SIZES[0]
// Shots land on :00, :15, :30 and :45, so nothing new can appear for 15 minutes
// after the newest one. Past that, check at a pace matching the API's few minutes
// of CDN caching.
const SHOT_INTERVAL = 15 * 60_000
const MIN_RECHECK = 5 * 60_000

export type BergfexDay = CamDay & {
  srcs: Record<string, string> // time -> image URL
  newestShot: number // ms since epoch
}

export function bergfexId(url: string): string | null {
  return url.match(/[?&]id=(\d+)/)?.[1] ?? null
}

async function load(id: string, date: string, size = SIZE): Promise<BergfexDay | null> {
  const res = await fetch(`${API}?id=${id}&date=${date}&size=${size}`)
  if (!res.ok) {
    throw new Error(`Bergfex ${res.status}`)
  }
  const shots: { hour: number; min: number; filetime: number; src: string }[] | null = await res.json()
  if (!shots?.length) {
    return null
  }

  const srcs: Record<string, string> = {}
  for (const s of shots) {
    srcs[`${String(s.hour).padStart(2, '0')}:${String(s.min).padStart(2, '0')}:00`] = s.src
  }
  const times = Object.keys(srcs).sort()
  return { date, times, srcs, newestShot: Math.max(...shots.map((s) => s.filetime)) * 1000 }
}

// Every shot any size has so far, each from the largest size that has it.
// Smaller copies are replaced on a later poll, once a larger one exists.
async function loadToday(id: string, date: string): Promise<BergfexDay | null> {
  const days = await Promise.all(SIZES.map((size) => load(id, date, size).catch(() => null)))

  const srcs: Record<string, string> = {}
  for (const day of days.reverse()) {
    Object.assign(srcs, day?.srcs)
  }
  const times = Object.keys(srcs).sort()
  if (!times.length) {
    return null
  }
  const newestShot = Math.max(...days.map((day) => day?.newestShot ?? 0))
  return { date, times, srcs, newestShot }
}

const dayCache = new Map<string, Promise<BergfexDay | null>>()
const latestCache = new Map<string, { until: number; day: Promise<BergfexDay> }>()

export function fetchDay(id: string, date: string): Promise<BergfexDay | null> {
  if (date === todayInAustria()) {
    return fetchLatestDay(id).catch(() => null)
  }
  const key = `${id}/${date}`
  const cached = dayCache.get(key)
  if (cached) {
    return cached
  }
  const day = load(id, date)
  dayCache.set(key, day)
  day.catch(() => dayCache.delete(key))
  return day
}

// Today's shots, or yesterday's before the first shot of the day
export function fetchLatestDay(id: string): Promise<BergfexDay> {
  const cached = latestCache.get(id)
  if (cached && Date.now() < cached.until) {
    return cached.day
  }

  const day = (async () => {
    const today = todayInAustria()
    const latest = (await loadToday(id, today)) ?? (await fetchDay(id, shiftDate(today, -1)))
    if (!latest) {
      throw new Error('No Bergfex images')
    }
    return latest
  })()
  const entry = { until: Date.now() + MIN_RECHECK, day }
  latestCache.set(id, entry)
  day.then(
    ({ newestShot }) => (entry.until = Math.max(entry.until, newestShot + SHOT_INTERVAL)),
    () => latestCache.delete(id),
  )
  return day
}

export function source(webcam: Webcam): CamSource | null {
  const id = bergfexId(webcam.url)
  if (!id) {
    return null
  }
  return {
    firstDate: null,
    latestDay: () => fetchLatestDay(id),
    day: (date) => fetchDay(id, date),
    imageUrl: (day, time) => (day as BergfexDay).srcs[time],
  }
}
