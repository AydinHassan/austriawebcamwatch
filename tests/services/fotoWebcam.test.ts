import { describe, it, expect } from 'vitest'
import { fetchDay, imageUrl, sizeFor, slots, timeInAustria } from '@/services/fotoWebcam'

describe('foto-webcam service', () => {
  it('builds image urls from date and time', () => {
    expect(imageUrl('hochkar', '2025-12-25', '12:00:00', 'la')).toBe(
      'https://www.foto-webcam.eu/webcam/hochkar/2025/12/25/1200_la.jpg',
    )
  })

  it('picks the smallest sharp size', () => {
    expect(sizeFor(300)).toBe('la')
    expect(sizeFor(600)).toBe('lm')
    expect(sizeFor(900)).toBe('hd')
  })

  it('lists capture slots for a day', () => {
    const all = slots(600)
    expect(all).toHaveLength(144)
    expect(all[0]).toBe('00:00:00')
    expect(all.at(-1)).toBe('23:50:00')
    expect(slots(600, '01:15:00')).toEqual(['00:00:00', '00:10:00', '00:20:00', '00:30:00', '00:40:00', '00:50:00', '01:00:00', '01:10:00'])
  })

  it('uses the Austrian time', () => {
    expect(timeInAustria(new Date('2026-07-01T10:05:00Z'))).toBe('12:05:00')
  })

  it('returns every slot for past days without any requests', async () => {
    expect((await fetchDay('hochkar', 600, '2020-01-01'))?.times).toHaveLength(144)
  })
})
