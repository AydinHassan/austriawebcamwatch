// Direct access to Bergfex's webcam archive. Its day listing allows calls
// from other sites and includes the full image URL for every shot.

import type { Webcam } from '@/services/webcams'
import { todayInAustria, shiftDate, type CamDay, type CamSource } from '@/services/camSource'

const API = 'https://images.bergfex.at/ajax/webcamsarchive/'
// 1: ~216px, 2: ~322px, 3: ~720px tall. Each size has its own URLs, so we
// stick to one: large enough for full screen, ~130 KB per image.
const SIZE = 3

export type BergfexDay = CamDay & {
  srcs: Record<string, string> // time -> image URL
}

export function bergfexId(url: string): string | null {
  return url.match(/[?&]id=(\d+)/)?.[1] ?? null
}

async function load(id: string, date: string): Promise<BergfexDay | null> {
  const res = await fetch(`${API}?id=${id}&date=${date}&size=${SIZE}`)
  if (!res.ok) throw new Error(`Bergfex ${res.status}`)
  const shots: { hour: number; min: number; src: string }[] | null = await res.json()
  if (!shots?.length) return null

  const srcs: Record<string, string> = {}
  for (const s of shots) {
    srcs[`${String(s.hour).padStart(2, '0')}:${String(s.min).padStart(2, '0')}:00`] = s.src
  }
  const times = Object.keys(srcs).sort()
  return { date, times, srcs }
}

const dayCache = new Map<string, Promise<BergfexDay | null>>()
const latestCache = new Map<string, { at: number; day: Promise<BergfexDay> }>()

export function fetchDay(id: string, date: string): Promise<BergfexDay | null> {
  if (date === todayInAustria()) return fetchLatestDay(id).catch(() => null)
  const key = `${id}/${date}`
  const cached = dayCache.get(key)
  if (cached) return cached
  const day = load(id, date)
  dayCache.set(key, day)
  day.catch(() => dayCache.delete(key))
  return day
}

// Today's shots, or yesterday's before the first shot of the day
export function fetchLatestDay(id: string): Promise<BergfexDay> {
  const cached = latestCache.get(id)
  if (cached && Date.now() - cached.at < 50_000) return cached.day

  const day = (async () => {
    const today = todayInAustria()
    const latest = (await load(id, today)) ?? (await fetchDay(id, shiftDate(today, -1)))
    if (!latest) throw new Error('No Bergfex images')
    return latest
  })()
  latestCache.set(id, { at: Date.now(), day })
  day.catch(() => latestCache.delete(id))
  return day
}

export function source(webcam: Webcam): CamSource | null {
  const id = bergfexId(webcam.url)
  if (!id) return null
  return {
    firstDate: null,
    latestDay: () => fetchLatestDay(id),
    day: (date) => fetchDay(id, date),
    imageUrl: (day, time) => (day as BergfexDay).srcs[time],
  }
}
