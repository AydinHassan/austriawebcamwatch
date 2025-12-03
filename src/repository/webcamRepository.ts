export type PresetEntity = {
  id: string
  name: string
  camIds: string[]
}

export type UserSettings = {
  visited: boolean,
  selectedPreset: string|null,
}

export enum RepositoryType {
  LOCAL = 'local',
  REMOTE = 'remote',
  AUTO = 'auto'
}

export const SPECIAL_PRESETS = {
  RANDOM: 'Random',
  DEFAULT: 'Default preset'
} as const

export const DEFAULT_PRESET_IDS = {
  DEFAULT: '00000000-0000-0000-0000-000000000001',
  RANDOM: '00000000-0000-0000-0000-000000000002'
} as const

export interface Repository {
  loadPresets(): Promise<PresetEntity[] | null>
  savePresets(presets: PresetEntity[]): Promise<void>
  addPreset(preset: PresetEntity): Promise<void>
  deletePreset(id: string): Promise<void>
  addCamToPreset(id: string, camId: string): Promise<void>
  removeCamFromPreset(id: string, camId: string): Promise<void>

  loadSettings(): Promise<UserSettings>
  saveSettings(settings: UserSettings): Promise<void>
}
