import { useEffect, useId, useRef, useState } from 'react'
import { Camera, ChevronDown, ChevronUp, ImagePlus, NotebookPen, X } from 'lucide-react'
import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import {
  clearJournalPhoto,
  getJournalMemory,
  saveJournalNote,
  saveJournalPhoto,
} from '../../utils/journalMemoryStorage.js'

function memoryExpandedStorageKey(waypointId) {
  return `cw_journal_mem_expanded:${waypointId}`
}

/**
 * Per-monument note + photo controls for Journal cards.
 * Photos are kept in IndexedDB for reopen, and also offered to the device (share / download).
 */
export default function JournalCardMemories({ waypointId, stopName, accent = T.ember }) {
  const t = useT()
  const noteFieldId = useId()
  const libraryInputId = useId()
  const cameraInputId = useId()
  const photoUrlRef = useRef(null)

  const [note, setNote] = useState('')
  const [draft, setDraft] = useState('')
  const [editingNote, setEditingNote] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [ready, setReady] = useState(false)
  const [contentOpen, setContentOpen] = useState(true)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const record = await getJournalMemory(waypointId)
      if (cancelled) return
      setNote(record.note || '')
      setDraft(record.note || '')
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current)
        photoUrlRef.current = null
      }
      if (record.photoBlob) {
        const url = URL.createObjectURL(record.photoBlob)
        photoUrlRef.current = url
        setPhotoUrl(url)
      } else {
        setPhotoUrl(null)
      }

      let preferredOpen = Boolean(record.note || record.photoBlob)
      try {
        const saved = window.localStorage.getItem(memoryExpandedStorageKey(waypointId))
        if (saved === '1') preferredOpen = true
        if (saved === '0') preferredOpen = false
      } catch {
        // ignore
      }
      setContentOpen(preferredOpen)
      setReady(true)
    })()

    return () => {
      cancelled = true
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current)
        photoUrlRef.current = null
      }
    }
  }, [waypointId])

  const setExpanded = (next) => {
    setContentOpen(next)
    try {
      window.localStorage.setItem(memoryExpandedStorageKey(waypointId), next ? '1' : '0')
    } catch {
      // ignore
    }
  }
  const applyPhotoRecord = (record) => {
    if (photoUrlRef.current) {
      URL.revokeObjectURL(photoUrlRef.current)
      photoUrlRef.current = null
    }
    if (record.photoBlob) {
      const url = URL.createObjectURL(record.photoBlob)
      photoUrlRef.current = url
      setPhotoUrl(url)
    } else {
      setPhotoUrl(null)
    }
  }

  const handleSaveNote = async () => {
    setBusy(true)
    setStatus('')
    try {
      const record = await saveJournalNote(waypointId, draft)
      setNote(record.note)
      setDraft(record.note)
      setEditingNote(false)
      setStatus(record.note ? t('journal.memory.noteSaved') : t('journal.memory.noteCleared'))
    } catch {
      setStatus(t('journal.memory.saveError'))
    } finally {
      setBusy(false)
    }
  }

  const handlePhotoFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setPickerOpen(false)
    if (!file) return

    setBusy(true)
    setStatus('')
    try {
      const { record, deviceSave } = await saveJournalPhoto(waypointId, file, {
        stopLabel: stopName || waypointId,
        saveToDevice: true,
      })
      applyPhotoRecord(record)
      if (deviceSave === 'share' || deviceSave === 'download') {
        setStatus(t('journal.memory.photoSavedDevice'))
      } else if (deviceSave === 'cancelled') {
        setStatus(t('journal.memory.photoSavedApp'))
      } else {
        setStatus(t('journal.memory.photoSavedApp'))
      }
    } catch {
      setStatus(t('journal.memory.saveError'))
    } finally {
      setBusy(false)
    }
  }

  const handleClearPhoto = async () => {
    setBusy(true)
    setStatus('')
    try {
      const record = await clearJournalPhoto(waypointId)
      applyPhotoRecord(record)
      setStatus(t('journal.memory.photoCleared'))
    } catch {
      setStatus(t('journal.memory.saveError'))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return null

  const hasSavedContent = Boolean(note || photoUrl)

  return (
    <div
      data-testid={`journal-memory-${waypointId}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.ink}12` }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          data-testid={`journal-note-toggle-${waypointId}`}
          onClick={() => {
            setExpanded(true)
            setEditingNote((open) => !open)
            setPickerOpen(false)
            setStatus('')
          }}
          style={actionButtonStyle(accent)}
        >
          <NotebookPen size={14} aria-hidden />
          {note ? t('journal.memory.editNote') : t('journal.memory.addNote')}
        </button>
        <button
          type="button"
          data-testid={`journal-photo-toggle-${waypointId}`}
          onClick={() => {
            setExpanded(true)
            setPickerOpen((open) => !open)
            setEditingNote(false)
            setStatus('')
          }}
          style={actionButtonStyle(accent)}
        >
          <ImagePlus size={14} aria-hidden />
          {photoUrl ? t('journal.memory.changePhoto') : t('journal.memory.addPhoto')}
        </button>
        <button
          type="button"
          data-testid={`journal-memory-expand-${waypointId}`}
          aria-expanded={contentOpen}
          aria-label={
            contentOpen ? t('journal.memory.hideContent') : t('journal.memory.showContent')
          }
          onClick={() => {
            setExpanded(!contentOpen)
            if (contentOpen) {
              setEditingNote(false)
              setPickerOpen(false)
            }
          }}
          style={{
            ...actionButtonStyle(accent),
            marginLeft: 'auto',
            minWidth: 40,
            padding: '0 10px',
          }}
        >
          {contentOpen ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
          <span style={{ fontSize: 11 }}>
            {contentOpen ? t('journal.memory.hideShort') : t('journal.memory.showShort')}
          </span>
        </button>
      </div>

      {contentOpen ? (
        <div data-testid={`journal-memory-content-${waypointId}`}>
      {editingNote ? (
        <div style={{ marginTop: 10 }}>
          <label
            htmlFor={noteFieldId}
            style={{
              display: 'block',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: T.muted,
              marginBottom: 6,
            }}
          >
            {t('journal.memory.noteLabel')}
          </label>
          <textarea
            id={noteFieldId}
            data-testid={`journal-note-input-${waypointId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder={t('journal.memory.notePlaceholder')}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: 10,
              border: `1px solid #E9E2D5`,
              background: '#FFFEFA',
              padding: '10px 12px',
              fontFamily: F.body,
              fontSize: 14,
              lineHeight: 1.45,
              color: T.ink,
              resize: 'vertical',
              minHeight: 72,
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              data-testid={`journal-note-save-${waypointId}`}
              disabled={busy}
              onClick={handleSaveNote}
              style={{
                ...actionButtonStyle(accent),
                background: accent,
                color: T.warmWhite,
                border: 'none',
              }}
            >
              {t('journal.memory.saveNote')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setDraft(note)
                setEditingNote(false)
              }}
              style={actionButtonStyle(T.muted)}
            >
              {t('journal.memory.cancel')}
            </button>
          </div>
        </div>
      ) : null}

      {!editingNote && note ? (
        <p
          data-testid={`journal-note-preview-${waypointId}`}
          style={{
            margin: '10px 0 0',
            fontSize: 14,
            lineHeight: 1.5,
            color: '#211C15',
            fontStyle: 'italic',
          }}
        >
          {note}
        </p>
      ) : null}

      {pickerOpen ? (
        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          <label
            htmlFor={libraryInputId}
            data-testid={`journal-photo-library-${waypointId}`}
            style={{ ...actionButtonStyle(accent), cursor: busy ? 'default' : 'pointer' }}
          >
            <ImagePlus size={14} aria-hidden />
            {t('journal.memory.fromLibrary')}
          </label>
          <label
            htmlFor={cameraInputId}
            data-testid={`journal-photo-camera-${waypointId}`}
            style={{ ...actionButtonStyle(accent), cursor: busy ? 'default' : 'pointer' }}
          >
            <Camera size={14} aria-hidden />
            {t('journal.memory.takePhoto')}
          </label>
          <input
            id={libraryInputId}
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={handlePhotoFile}
            style={{ display: 'none' }}
          />
          <input
            id={cameraInputId}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={busy}
            onChange={handlePhotoFile}
            style={{ display: 'none' }}
          />
        </div>
      ) : null}

      {photoUrl ? (
        <div style={{ marginTop: 12, position: 'relative' }}>
          <img
            src={photoUrl}
            alt={t('journal.memory.photoAlt', { name: stopName })}
            data-testid={`journal-photo-preview-${waypointId}`}
            style={{
              width: '100%',
              maxHeight: 180,
              objectFit: 'cover',
              borderRadius: 10,
              display: 'block',
              background: '#E9E2D5',
            }}
          />
          <button
            type="button"
            data-testid={`journal-photo-clear-${waypointId}`}
            aria-label={t('journal.memory.removePhoto')}
            disabled={busy}
            onClick={handleClearPhoto}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 999,
              border: 'none',
              background: 'rgba(11,11,13,0.62)',
              color: T.warmWhite,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      ) : null}

      {status ? (
        <p
          role="status"
          style={{ margin: '8px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.4 }}
        >
          {status}
        </p>
      ) : null}

      {!hasSavedContent && !editingNote && !pickerOpen && !status ? (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.4 }}>
          {t('journal.memory.emptyHint')}
        </p>
      ) : null}
        </div>
      ) : null}
    </div>
  )
}

function actionButtonStyle(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 999,
    border: `1px solid ${color}55`,
    background: `${color}14`,
    color,
    fontFamily: F.body,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }
}
