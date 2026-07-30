import { T, F } from '../tokens.js'

/** Three-tab EXPLORER bar · Journey · Map · Journal */
export function TabBar({ active = 'JOURNEY', onChange }) {
  const tabs = ['JOURNEY', 'MAP', 'JOURNAL']

  return (
    <div
      style={{
        display: 'flex',
        borderTop: `1px solid ${T.ink800}22`,
        background: T.bone,
        paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
        paddingTop: 4,
        zIndex: 20,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange?.(tab)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            paddingTop: 8,
            fontFamily: F.body,
            fontSize: 10,
            letterSpacing: '0.12em',
            color: active === tab ? T.actI : T.muted,
            background: 'none',
            border: 'none',
            cursor: onChange ? 'pointer' : 'default',
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              background: active === tab ? T.actI : 'transparent',
            }}
          />
          {tab}
        </button>
      ))}
    </div>
  )
}
