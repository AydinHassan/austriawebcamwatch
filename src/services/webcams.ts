import webcams from '@/assets/austria-cams.json'

export type Webcam = {
  name: string
  url: string
  provider: string
  latitude: number
  longitude: number
}

export function getAllWebcams(): Webcam[] {
  return webcams
}

export function getWebcamByName(name: string): Webcam | null {
  return webcams.find(w => w.name === name) || null;
}

export function expandCamIds(camIds: string[]): Webcam[] {
  return camIds
    .map(id => getWebcamByName(id))
    .filter(Boolean) as Webcam[]
}

export function searchWebcams(q: string): Webcam[] {
  const s = q.toLowerCase()
  return webcams.filter(w => w.name.toLowerCase().includes(s))
}

export function getRandomWebcams(num: number): Webcam[] {
  const randomCams = [];
  for (let i = 0; i <= num; i++) {
    const index = Math.floor(Math.random() * webcams.length)
    randomCams.push(webcams[index])
  }
  return randomCams;
}
