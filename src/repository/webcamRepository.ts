export type Preset = {
  name: string
  camIds: string[]
}

export type UserSettings = {
  visited: boolean,
  selectedPreset: string|null,
}

export interface Repository {
  loadPresets(): Promise<Preset[] | null>
  savePresets(presets: Preset[]): Promise<void>

  getSettings(): Promise<UserSettings>
  setSettings(settings: UserSettings): Promise<void>
}
