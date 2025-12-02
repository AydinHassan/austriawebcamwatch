import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePresetsStore } from '@/stores/presets'
import type { Repository } from '@/repository/webcamRepository'
import { DEFAULT_PRESET_IDS } from '@/repository/webcamRepository'

vi.mock('@/composables/useRepository', () => ({
  useRepository: () => ({
    getRepo: vi.fn(() => mockRepo)
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: null
  })
}))

vi.mock('@/services/webcams', () => ({
  getWebcamByName: (name: string) => ({ name, url: 'test-url', location: 'test' }),
  getRandomWebcams: (count: number) => Array.from({ length: count }, (_, i) => ({
    name: `random-${i}`,
    url: 'test-url',
    location: 'test'
  }))
}))

let mockRepo: Repository

describe('usePresetsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    mockRepo = {
      loadPresets: vi.fn().mockResolvedValue(null),
      savePresets: vi.fn().mockResolvedValue(undefined),
      addPreset: vi.fn().mockResolvedValue(undefined),
      deletePreset: vi.fn().mockResolvedValue(undefined),
      addCamToPreset: vi.fn().mockResolvedValue(undefined),
      removeCamFromPreset: vi.fn().mockResolvedValue(undefined),
      loadSettings: vi.fn().mockResolvedValue({ visited: false, selectedPreset: null }),
      saveSettings: vi.fn().mockResolvedValue(undefined)
    }
  })

  describe('initialization', () => {
    it('should initialize with default presets on first visit', async () => {
      const store = usePresetsStore()
      await store.init()

      expect(store.presets).toHaveLength(2)
      expect(store.presets[0].name).toBe('Default preset')
      expect(store.presets[1].name).toBe('Random')
      expect(store.settings.visited).toBe(true)
    })

    it('should persist default presets to storage on first visit', async () => {
      const store = usePresetsStore()
      await store.init()

      expect(mockRepo.addPreset).toHaveBeenCalledTimes(2)
      expect(mockRepo.saveSettings).toHaveBeenCalledWith({
        visited: true,
        selectedPreset: DEFAULT_PRESET_IDS.DEFAULT
      })
    })

    it('should load existing presets for returning visitor', async () => {
      const existingPresets = [
        { id: '123', name: 'My Preset', camIds: ['cam1', 'cam2'] }
      ]
      mockRepo.loadPresets = vi.fn().mockResolvedValue(existingPresets)
      mockRepo.loadSettings = vi.fn().mockResolvedValue({ visited: true, selectedPreset: '123' })

      const store = usePresetsStore()
      await store.init()

      expect(store.presets).toHaveLength(1)
      expect(store.presets[0].name).toBe('My Preset')
      expect(store.settings.visited).toBe(true)
    })
  })

  describe('toggleWebcam', () => {
    it('should add a webcam to preset', async () => {
      const store = usePresetsStore()
      await store.init()

      const webcam = { name: 'TestCam', url: 'test', location: 'test' }
      await store.toggleWebcam(webcam)

      expect(store.selectedPreset?.cams).toContainEqual(webcam)
      expect(mockRepo.addCamToPreset).toHaveBeenCalledWith(
        DEFAULT_PRESET_IDS.DEFAULT,
        'TestCam'
      )
    })

    it('should remove a webcam if already selected', async () => {
      const store = usePresetsStore()
      await store.init()

      const webcam = { name: 'TestCam', url: 'test', location: 'test' }

      await store.toggleWebcam(webcam)
      const lengthAfterAdd = store.selectedPreset.cams.length;
      expect(store.selectedPreset.cams.some(c => c.name === 'TestCam')).toBe(true)

      const addedWebcam = store.selectedPreset.cams.find(c => c.name === 'TestCam')!
      await store.toggleWebcam(addedWebcam)

      expect(store.selectedPreset.cams).toHaveLength(lengthAfterAdd - 1)
      expect(store.selectedPreset.cams.some(c => c.name === 'TestCam')).toBe(false)
      expect(mockRepo.removeCamFromPreset).toHaveBeenCalledWith(
        DEFAULT_PRESET_IDS.DEFAULT,
        'TestCam'
      )
    })

    it('should remove oldest webcam when adding 10th cam', async () => {
      const store = usePresetsStore()
      await store.init()

      for (let i = 0; i < 9; i++) {
        await store.toggleWebcam({ name: `cam${i}`, url: 'test', location: 'test' })
      }

      expect(store.selectedPreset?.cams).toHaveLength(9)

      await store.toggleWebcam({ name: 'cam9', url: 'test', location: 'test' })

      expect(store.selectedPreset.cams).toHaveLength(9)
      expect(store.selectedPreset.cams[0].name).toBe('cam1')
      expect(mockRepo.removeCamFromPreset).toHaveBeenCalledWith(
        DEFAULT_PRESET_IDS.DEFAULT,
        'cam0'
      )
    })
  })

  describe('createPreset', () => {
    it('should create a new preset', async () => {
      const store = usePresetsStore()
      await store.init()

      await store.createPreset('My New Preset')

      expect(store.presets).toHaveLength(3)
      expect(store.presets[2].name).toBe('My New Preset')
      expect(mockRepo.addPreset).toHaveBeenCalled()
    })

    it('should throw error for short preset names', async () => {
      const store = usePresetsStore()
      await store.init()

      await expect(store.createPreset('ab')).rejects.toThrow('must be longer than 3 characters')
    })

    it('should throw error for duplicate preset names', async () => {
      const store = usePresetsStore()
      await store.init()

      await store.createPreset('Test Preset')
      await expect(store.createPreset('Test Preset')).rejects.toThrow('already exists')
    })
  })

  describe('removePreset', () => {
    it('should remove a preset', async () => {
      const store = usePresetsStore()
      await store.init()

      await store.createPreset('To Be Deleted')
      const presetId = store.presets[2].id

      await store.removePreset(presetId)

      expect(store.presets).toHaveLength(2)
      expect(mockRepo.deletePreset).toHaveBeenCalledWith(presetId)
    })

    it('should throw error when deleting last preset', async () => {
      const store = usePresetsStore()
      mockRepo.loadPresets = vi.fn().mockResolvedValue([
        { id: '123', name: 'Only Preset', camIds: [] }
      ])
      mockRepo.loadSettings = vi.fn().mockResolvedValue({ visited: true, selectedPreset: '123' })
      await store.init()

      await expect(store.removePreset('123')).rejects.toThrow('Cannot delete the last preset')
    })

    it('should switch to another preset if deleting selected preset', async () => {
      const store = usePresetsStore()
      await store.init()
      await store.createPreset('New Preset')

      const newPresetId = store.presets[2].id
      await store.switchPreset(newPresetId)

      await store.removePreset(newPresetId)

      expect(store.settings.selectedPreset).toBe(DEFAULT_PRESET_IDS.DEFAULT)
    })
  })

  describe('switchPreset', () => {
    it('should switch to different preset', async () => {
      const store = usePresetsStore()
      await store.init()

      await store.switchPreset(DEFAULT_PRESET_IDS.RANDOM)

      expect(store.settings.selectedPreset).toBe(DEFAULT_PRESET_IDS.RANDOM)
      expect(mockRepo.saveSettings).toHaveBeenCalledWith({
        visited: true,
        selectedPreset: DEFAULT_PRESET_IDS.RANDOM
      })
    })

    it('should not switch if already on that preset', async () => {
      const store = usePresetsStore()
      await store.init()

      vi.clearAllMocks()
      await store.switchPreset(DEFAULT_PRESET_IDS.DEFAULT)

      expect(mockRepo.saveSettings).not.toHaveBeenCalled()
    })

    it('should throw error for non-existent preset', async () => {
      const store = usePresetsStore()
      await store.init()

      await expect(store.switchPreset('invalid-id')).rejects.toThrow('not found')
    })
  })
})
