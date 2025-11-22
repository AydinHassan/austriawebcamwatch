import webcams from '@/assets/austria-cams.json'

export type Webcam = {
  id: number
  name: string
  url: string
  provider: string
  latitude: number
  longitude: number
}

const webcamsWithIds: Webcam[] = webcams.map((cam, index) => ({
  ...cam,
  id: index
}))

export function getAllWebcams(): Webcam[] {
  return webcamsWithIds
}

export function getWebcamByName(name: string): Webcam | null {
  return webcamsWithIds.find(w => w.name === name) || null;
}

export function getWebcamById(id: number): Webcam | null {
  return webcamsWithIds[id] || null;
}

export function expandCamIds(camIds: string[]): Webcam[] {
  return camIds
    .map(id => getWebcamByName(id))
    .filter(Boolean) as Webcam[]
}

export function searchWebcams(q: string): Webcam[] {
  const s = q.toLowerCase()
  return webcamsWithIds.filter(w => w.name.toLowerCase().includes(s))
}

export function getRandomWebcams(num: number): Webcam[] {
  const randomCams = [];
  for (let i = 0; i <= num; i++) {
    const index = Math.floor(Math.random() * webcamsWithIds.length)
    randomCams.push(webcamsWithIds[index])
  }
  return randomCams;
}
