// What our cam viewer needs from a provider, plus helpers shared by providers

// A day of shots for any provider
export type CamDay = {
  date: string // YYYY-MM-DD
  times: string[] // HH:MM:SS, oldest first
}

export type CamSource = {
  // Earliest date with images, when known
  firstDate: string | null
  latestDay(): Promise<CamDay>
  day(date: string): Promise<CamDay | null>
  imageUrl(day: CamDay, time: string, pixelHeight: number): string
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Provider dates and times are local to Austria.
export function todayInAustria(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(now)
}

// Walk to the neighbouring shot, crossing into adjacent days when needed.
// Gaps of missing days are skipped, up to a week.
export async function neighbourShot<D extends CamDay>(
  getDay: (date: string) => Promise<D | null>,
  day: D,
  time: string,
  direction: 1 | -1,
  bounds: { min?: string | null; max: string },
): Promise<{ day: D; time: string } | null> {
  const i = day.times.indexOf(time)
  const next = day.times[i + direction]
  if (i !== -1 && next) return { day, time: next }

  let date = day.date
  for (let tries = 0; tries < 7; tries++) {
    date = shiftDate(date, direction)
    if (date > bounds.max || (bounds.min && date < bounds.min)) return null
    const other = await getDay(date)
    if (other) {
      return { day: other, time: direction === 1 ? other.times[0] : other.times[other.times.length - 1] }
    }
  }
  return null
}
