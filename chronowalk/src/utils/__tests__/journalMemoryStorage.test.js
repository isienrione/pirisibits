import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearJournalPhoto,
  forceJournalMemoryFallbackForTests,
  getJournalMemory,
  getJournalMemoryDbName,
  listJournalMemories,
  resetJournalMemoryStorageForTests,
  saveJournalNote,
  saveJournalPhoto,
  savePhotoToDevice,
} from '../journalMemoryStorage.js'

vi.mock('../overlayCapture.js', () => ({
  downloadCapture: vi.fn(),
}))

describe('journalMemoryStorage', () => {
  beforeEach(async () => {
    await resetJournalMemoryStorageForTests()
    forceJournalMemoryFallbackForTests()
  })

  it('exposes a dedicated database name', () => {
    expect(getJournalMemoryDbName()).toBe('chronowalk-journal-memories')
  })

  it('saves and reloads a note per waypoint', async () => {
    await saveJournalNote('colosseum', '  The concrete is still warm.  ')
    const again = await getJournalMemory('colosseum')
    expect(again.note).toBe('The concrete is still warm.')
    expect(again.noteUpdatedAt).toBeTruthy()

    await saveJournalNote('colosseum', 'Updated line')
    expect((await getJournalMemory('colosseum')).note).toBe('Updated line')
  })

  it('stores a photo blob for later reopen and lists memories', async () => {
    const blob = new Blob(['fake-image'], { type: 'image/jpeg' })
    const { record, deviceSave } = await saveJournalPhoto('palatine', blob, {
      stopLabel: 'Palatine Hill',
      saveToDevice: false,
    })

    expect(record.photoBlob).toBeInstanceOf(Blob)
    expect(record.photoMimeType).toMatch(/image\//)
    expect(deviceSave).toBe('skipped')

    const reloaded = await getJournalMemory('palatine')
    expect(reloaded.photoBlob).toBeTruthy()
    expect(await reloaded.photoBlob.text()).toBe('fake-image')

    const listed = await listJournalMemories()
    expect(listed.some((entry) => entry.waypointId === 'palatine')).toBe(true)
  })

  it('clears a stored photo while keeping the note', async () => {
    await saveJournalNote('forum', 'Forum note')
    await saveJournalPhoto('forum', new Blob(['x'], { type: 'image/png' }), {
      saveToDevice: false,
    })
    await clearJournalPhoto('forum')

    const record = await getJournalMemory('forum')
    expect(record.note).toBe('Forum note')
    expect(record.photoBlob).toBeNull()
  })

  it('offers share or download when saving to the device', async () => {
    const { downloadCapture } = await import('../overlayCapture.js')
    downloadCapture.mockClear()

    const blob = new Blob(['pic'], { type: 'image/jpeg' })
    const result = await savePhotoToDevice(blob, 'chronowalk-test.jpg')
    expect(['share', 'download']).toContain(result)
    if (result === 'download') {
      expect(downloadCapture).toHaveBeenCalled()
    }
  })
})
