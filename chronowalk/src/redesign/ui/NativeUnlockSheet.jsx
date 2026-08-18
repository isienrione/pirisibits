import { useState } from 'react'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import {
  coverageIncludesForHero,
  coverageLabelForHero,
} from '../../lib/heroExperience.js'

export default function NativeUnlockSheet({ heroId, title, open, onClose }) {
  const t = useT()
  if (!open) return null

  return (
    <div
      data-testid="native-unlock-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="native-unlock-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(11,11,13,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <button
        type="button"
        aria-label={t('native.unlock.close')}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          background: T.bone,
          color: T.ink,
          borderRadius: '24px 24px 0 0',
          padding: '22px 22px max(22px, calc(env(safe-area-inset-bottom) + 14px))',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: T.muted,
            fontFamily: F.body,
          }}
        >
          {t('native.unlock.eyebrow')}
        </p>
        <h2
          id="native-unlock-title"
          style={{ margin: '8px 0 10px', fontFamily: F.display, fontSize: 26, fontWeight: 400 }}
        >
          {t('native.unlock.title')}
        </h2>
        <p style={{ margin: '0 0 8px', fontFamily: F.body, fontSize: 16, lineHeight: 1.45 }}>
          {coverageLabelForHero(heroId)}
          {title ? ` · ${title}` : ''}
        </p>
        <p style={{ margin: '0 0 22px', fontFamily: F.body, fontSize: 15, lineHeight: 1.5, color: T.muted }}>
          {coverageIncludesForHero(heroId)}
        </p>
        <PrimaryButton disabled color={T.gold} data-testid="native-unlock-purchase" style={{ minHeight: 48 }}>
          {t('native.unlock.purchase')}
        </PrimaryButton>
        <GhostButton
          data-testid="native-unlock-dismiss"
          onClick={onClose}
          style={{ marginTop: 10, minHeight: 48, color: T.ink, borderColor: `${T.muted}66`, background: 'transparent' }}
        >
          {t('native.unlock.notNow')}
        </GhostButton>
      </div>
    </div>
  )
}
