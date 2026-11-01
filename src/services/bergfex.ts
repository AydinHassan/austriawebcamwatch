// Direct access to Bergfex's webcam archive. Its day listing allows calls
// from other sites and includes the full image URL for every shot.

import type { Webcam } from '@/services/webcams'
import { todayInAustria, shiftDate, type CamDay, type CamSource } from '@/services/camSource'

const API = 'https://images.bergfex.at/ajax/webcamsarchive/'
// 1: ~216px, 2: ~322px, 3: ~720px tall. Each size has its own URLs. Size 3 is
// large enough for full screen, ~130 KB per image, but can appear up to a couple
// of hours after the smaller sizes.
const SIZE = 3
const SMALLER_SIZE = 2

export type BergfexDay = CamDay & {
  srcs: Record<string, string> // time -> image URL
}

export function bergfexId(url: string): string | null {
  return url.match(/[?&]id=(\d+)/)?.[1] ?? null
}

async function load(id: string, date: string, size = SIZE): Promise<BergfexDay | null> {
  const res = await fetch(`${API}?id=${id}&date=${date}&size=${size}`)
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

// Today's full-size shots, plus smaller ones for shots not yet available in full
// size. Those are replaced on a later poll, once the full size exists.
async function loadToday(id: string, date: string): Promise<BergfexDay | null> {
  const [fullSize, smaller] = await Promise.all([
    load(id, date),
    load(id, date, SMALLER_SIZE).catch(() => null),
  ])

  if (!smaller) return fullSize
  if (!fullSize) return smaller

  // When a shot has both sizes, the full size wins
  const srcs = { ...smaller.srcs, ...fullSize.srcs }
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
    const latest = (await loadToday(id, today)) ?? (await fetchDay(id, shiftDate(today, -1)))
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
