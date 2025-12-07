import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRepository } from '@/composables/useRepository'
import { useAuthStore } from '@/stores/auth'
import { SPECIAL_PRESETS, DEFAULT_PRESET_IDS, RepositoryType } from '@/repository/webcamRepository'
import type { Webcam } from '@/services/webcams'
import type { PresetEntity, UserSettings } from '@/repository/webcamRepository'
import { getRandomWebcams, getWebcamByName } from '@/services/webcams'

export type Preset = {
  id: string
  name: string
  cams: Webcam[]
}

function createDefaultPresets(): Preset[] {
  const defaultCamIds = [
    'Wanglspitze',
    'Achensee',
    'Großglockner Hochalpenstraße - Edelweißspitze',
    'Weißenkirchen in der Wachau',
    'Pyramidenkogel - Aussichtsturm',
    'Eng'
  ]

  return [
    {
      id: DEFAULT_PRESET_IDS.DEFAULT,
      name: SPECIAL_PRESETS.DEFAULT,
      cams: defaultCamIds.map(id => getWebcamByName(id))
    },
    {
      id: DEFAULT_PRESET_IDS.RANDOM,
      name: SPECIAL_PRESETS.RANDOM,
      cams: []
    }
  ]
}

export const usePresetsStore = defineStore('presets', () => {
  const auth = useAuthStore()
  const { getRepo } = useRepository()

  const presets = ref<Preset[]>([{ id: 'loading', name: 'Loading...', cams: [] }])
  const settings = ref<UserSettings>({ visited: false, selectedPreset: 'loading' })
  const firstVisit = ref<boolean>(false)

  const selectedPreset = computed(() => {
    const presetId = settings.value.selectedPreset
    if (!presetId) {
      return presets.value[0] ?? null
    }
    return presets.value.find(p => p.id === presetId) ?? presets.value[0]
  })

  watch(() => auth.user, async (newUser, oldUser) => {
    if (oldUser && !newUser) {
      await handleLogout()
    }
  })

  async function toggleWebcam(webcam: Webcam) {
    const preset = selectedPreset.value
    if (!preset) {
      return
    }

    const index = preset.cams.findIndex((selected) => selected === webcam)

    if (index !== -1) {
      await removeWebcamFromPreset(preset, index, webcam)
    } else {
      await addWebcamToPreset(preset, webcam)
    }
  }

  async function removeWebcamFromPreset(preset: Preset, index: number, webcam: Webcam) {
    preset.cams.splice(index, 1)
    await getRepo().removeCamFromPreset(preset.id, webcam.name)
  }

  async function addWebcamToPreset(preset: Preset, webcam: Webcam) {
    const needToRemove = preset.cams.length >= 9
    if (needToRemove) {
      const removedCam = preset.cams.shift()!
      await getRepo().removeCamFromPreset(preset.id, removedCam.name)
    }

    preset.cams.push(webcam)
    await getRepo().addCamToPreset(preset.id, webcam.name)
  }

  async function switchPreset(id: string) {
    if (selectedPreset.value.id === DEFAULT_PRESET_IDS.RANDOM) {
      selectedPreset.value.cams = [];
    }

    if (id === settings.value.selectedPreset) {
      return
    }

    const preset = presets.value.find(p => p.id === id)
    if (!preset) {
      throw new Error(`Preset "${id}" not found`)
    }

    try {
      settings.value.selectedPreset = preset.id
      await getRepo().saveSettings(settings.value)

      if (id === DEFAULT_PRESET_IDS.RANDOM) {
        randomiseCams()
      }
    } catch (error) {
      console.error('Failed to switch preset:', error)
      throw error
    }
  }

  function randomiseCams() {
    getRandomWebcams(9).forEach((webcam) => toggleWebcam(webcam))
  }

  async function createPreset(name: string) {
    const trimmedName = name.trim()

    if (trimmedName.length < 3) {
      throw new Error('Preset name must be longer than 3 characters')
    }

    if (presets.value.some(p => p.name === trimmedName)) {
      throw new Error('A preset with this name already exists')
    }

    const preset: PresetEntity = {
      id: crypto.randomUUID(),
      name: trimmedName,
      camIds: [],
    }

    try {
      await getRepo().addPreset(preset)
      presets.value.push(entityToDto(preset))
      await switchPreset(preset.id)
    } catch (error) {
      console.error('Failed to add preset:', error)
      throw error
    }
  }

  function entityToDto(entity: PresetEntity): Preset {
    return {
      id: entity.id,
      name: entity.name,
      cams: entity.camIds.map(id => getWebcamByName(id))
    }
  }

  function dtoToEntity(preset: Preset): PresetEntity {
    return {
      id: preset.id,
      name: preset.name,
      camIds: preset.cams.map((w: Webcam) => w.name)
    }
  }

  async function removePreset(id: string) {
    if (presets.value.length === 1) {
      throw new Error('Cannot delete the last preset')
    }

    const index = presets.value.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error(`Preset "${id}" not found`)
    }

    try {
      await getRepo().deletePreset(id)
      presets.value.splice(index, 1)

      if (id === settings.value.selectedPreset) {
        settings.value.selectedPreset = presets.value[0].id
        await getRepo().saveSettings(settings.value)
      }
    } catch (error) {
      console.error('Failed to delete preset:', error)
      throw error
    }
  }

  async function initializeFirstVisit() {
    settings.value.visited = true
    settings.value.selectedPreset = DEFAULT_PRESET_IDS.DEFAULT
    firstVisit.value = true

    for (const preset of presets.value) {
      await getRepo().addPreset(dtoToEntity(preset))
    }
    await getRepo().saveSettings(settings.value)
  }

  async function loadPresets(type: RepositoryType): Promise<Preset[]> {
    const repo = getRepo(type)
    const presetEntities = await repo.loadPresets()

    if (presetEntities === null || presetEntities.length === 0) {
      return createDefaultPresets()
    }

    return presetEntities.map(p => entityToDto(p))
  }

  async function loadLocalData() {
    const localPresets = await getRepo(RepositoryType.LOCAL).loadPresets()
    const localSettings = await getRepo(RepositoryType.LOCAL).loadSettings()

    return {
      presets: localPresets && localPresets.length > 0 ? localPresets.map(p => entityToDto(p)) : null,
      settings: localSettings
    }
  }

  async function loadRemoteData(localData: {presets: Preset[]|null, settings: UserSettings}) {
    const settingsFromDb = await getRepo(RepositoryType.REMOTE).loadSettings()

    if (settingsFromDb.visited === false) {
      const remote = getRepo(RepositoryType.REMOTE)

      for (const preset of localData.presets) {
        await remote.addPreset(dtoToEntity(preset))
      }

      await remote.saveSettings(localData.settings)
      presets.value = localData.presets
      settings.value = localData.settings

      await removeLocalData()
    } else {
      const presetsFromDb = await loadPresets(RepositoryType.REMOTE)
      settings.value = settingsFromDb
      presets.value = presetsFromDb
    }
  }

  async function init() {
    const localData = await loadLocalData()

    if (auth.user) {
      await loadRemoteData(localData)
    } else {
      if (localData.presets) {
        presets.value = localData.presets
      } else {
        presets.value = createDefaultPresets()
      }

      settings.value = localData.settings

      if (settings.value.visited === false) {
        await initializeFirstVisit()
      }
    }

    if (!settings.value.selectedPreset || !presets.value.find(p => p.id === settings.value.selectedPreset)) {
      settings.value.selectedPreset = DEFAULT_PRESET_IDS.DEFAULT
      await getRepo().saveSettings(settings.value)
    }

    if (selectedPreset.value?.id === DEFAULT_PRESET_IDS.RANDOM) {
      randomiseCams()
    }
  }

  async function removeLocalData(): Promise<void> {
    const repo = getRepo(RepositoryType.LOCAL)

    await repo.deletePresets()
    await repo.saveSettings({ selectedPreset: null, visited: true })
  }

  async function handleLogout() {
    presets.value = createDefaultPresets()
    settings.value.selectedPreset = DEFAULT_PRESET_IDS.DEFAULT

    for (const preset of presets.value) {
      await getRepo(RepositoryType.LOCAL).addPreset(dtoToEntity(preset))
    }

    await getRepo(RepositoryType.LOCAL).saveSettings({
      selectedPreset: DEFAULT_PRESET_IDS.DEFAULT,
      visited: true
    })
  }

  return {
    presets,
    settings,
    firstVisit,
    selectedPreset,
    toggleWebcam,
    switchPreset,
    createPreset,
    removePreset,
    init,
  }
})
