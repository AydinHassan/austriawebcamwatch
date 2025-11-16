export type Preset = {
  name: string
  camIds: string[]
}

export interface Repository {
  loadPresets(): Preset[]|null
  savePresets(presets: Preset[]): void

  selectedPreset(): string | null
  setSelectedPreset(presetName: string | null): void

  hasVisited(): boolean
  setVisited(): void
}
