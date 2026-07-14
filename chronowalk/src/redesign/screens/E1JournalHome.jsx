import { useContext } from 'react'
import { T, F, S, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { TYPE, TYPE_SPACE, displayTitleStyle } from '../typography.js'
import {
  colosseumNow,
  severusNow,
  archTitusNow,
  palatineNow,
} from '../images.js'
import { RedesignNavCtx } from '../nav.js'
import {
  Eyebrow,
  MiniActLine,
  ScreenHeader,
  SurfaceCard,
  TabBar,
  PrimaryButton,
  CinematicImage,
  TextButton,
  GoldSeam,
} from '../ui/index.js'
import { actMilestoneCaption } from '../lib/journalMemory.js'

/**
 * Journal home — a memory book, not an activity history.
 */
export default function E1JournalHome({
  embedded = false,
  headline = 'Your Rome',
  subtitle = null,
  epigraph = null,
  walkFootnote = null,
  letter = null,
  groups: groupsProp = null,
  empty = false,
  loading = false,
  onStartWalk,
  onCardClick,
  onLetterClick,
  onSettingsClick,
}) {
  const { navigate } = useContext(RedesignNavCtx)

  const defaultGroups = [
    {
      act: 'I',
      color: T.actI,
      name: 'The Arena',
      cards: [
        {
          id: 0,
          name: 'The Colosseum',
          sigLine: 'Take a second. Look up.',
          status: 'completed',
          statusCaption: 'Remembered',
          photo: colosseumNow,
          thenPhoto: colosseumNow,
        },
        {
          id: 1,
          name: 'Arch of Constantine',
          sigLine: 'Stand where triumph entered the city.',
          status: 'completed',
          statusCaption: 'Remembered',
          photo: archTitusNow,
          thenPhoto: archTitusNow,
        },
      ],
    },
    {
      act: 'II',
      color: T.actII,
      name: 'The Sacred Way',
      cards: [
        {
          id: 2,
          name: 'The Palatine Hill',
          sigLine: 'The word palace was born on this slope.',
          status: 'current',
          statusCaption: 'Open on the page',
          photo: palatineNow,
          thenPhoto: palatineNow,
        },
      ],
    },
    {
      act: 'III',
      color: T.actIII,
      name: 'The Forum',
      cards: [
        {
          id: 3,
          name: 'The Roman Forum',
          sigLine: 'Processions passed here for a thousand years.',
          status: 'upcoming',
          statusCaption: 'Still unwritten',
          photo: severusNow,
          thenPhoto: severusNow,
        },
      ],
    },
  ]

  const groups = groupsProp ?? defaultGroups
  const showEmpty = empty

  if (loading) {
    return (
      <div
        className="cw-grain"
        style={{
          background: T.bone,
          height: '100%',
          fontFamily: F.body,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: S.m,
          color: T.muted,
        }}
      >
        <GoldSeam moment="loading" />
        <p style={{ ...TYPE.meta, color: T.muted, margin: 0 }}>Gathering your pages…</p>
      </div>
    )
  }

  return (
    <div
      className="cw-grain"
      style={{
        background: T.bone,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <ScreenHeader
        layout="split"
        title={headline}
        titleSize={30}
        subtitle={subtitle}
        onSettings={onSettingsClick}
      />

      {showEmpty ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexDirection: 'column',
            gap: S.l,
            padding: `0 ${S.xl}`,
          }}
        >
          <div style={{ position: 'relative', zIndex: 1, height: 48, display: 'grid', placeItems: 'center' }}>
            <GoldSeam moment="actTransition" length={40} />
          </div>
          <p
            style={{
              ...TYPE.prose,
              fontSize: 18,
              color: T.muted,
              fontStyle: 'italic',
              textAlign: 'center',
              maxWidth: '18em',
              margin: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            Your journey will collect itself here. Walk, and Rome writes the pages.
          </p>
          {onStartWalk ? (
            <div style={{ position: 'relative', zIndex: 1 }}>
              <PrimaryButton
                color={T.ember}
                glow={false}
                onClick={onStartWalk}
                style={{ width: 'auto', padding: `${S.m} ${S.l}` }}
              >
                Begin the walk
              </PrimaryButton>
            </div>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: S.l,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Front matter — epigraph + quiet walk line */}
          {(epigraph || walkFootnote) && (
            <div style={{ padding: `0 ${S.edge} ${S.xl}`, textAlign: 'center' }}>
              {epigraph ? (
                <p
                  style={{
                    ...TYPE.prose,
                    fontSize: 17,
                    color: T.ink,
                    fontStyle: 'italic',
                    margin: `0 auto ${TYPE_SPACE.afterParagraph}`,
                    maxWidth: '22em',
                  }}
                >
                  {epigraph}
                </p>
              ) : null}
              {walkFootnote ? (
                <p style={{ ...TYPE.meta, color: T.muted, margin: 0 }}>{walkFootnote}</p>
              ) : null}
            </div>
          )}

          {/* Journey letter — the book’s colophon / opening leaf */}
          <div style={{ padding: `0 ${S.edge} ${S.xl}` }}>
            <SurfaceCard
              tone="dark"
              radius={14}
              padding={S.l}
              style={{ cursor: 'pointer' }}
              onClick={() => (onLetterClick ? onLetterClick() : navigate('F1'))}
            >
              <div style={{ marginBottom: S.m }}>
                <svg width="100%" height="22" viewBox="0 0 310 22" preserveAspectRatio="none" aria-hidden>
                  {[
                    [T.actI, 'M 0 11 L 44 11'],
                    [T.actII, 'M 44 11 L 88 11'],
                    [T.actIII, 'M 88 11 L 132 11'],
                    [T.actIV, 'M 132 11 L 176 11'],
                    [T.actV, 'M 176 11 L 220 11'],
                    [T.actVI, 'M 220 11 L 264 11'],
                    [T.encore, 'M 264 11 L 310 11'],
                  ].map(([c, d], i) => (
                    <path
                      key={i}
                      d={d}
                      stroke={c}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 3px ${c}77)` }}
                    />
                  ))}
                </svg>
              </div>
              <p style={{ ...TYPE.kicker, color: T.ember, marginBottom: S.s }}>Your letter</p>
              <p
                style={{
                  ...TYPE.heading,
                  color: T.warmWhite,
                  marginBottom: S.m,
                }}
              >
                {letter?.title ?? 'The path you walked'}
              </p>
              {letter?.excerpt ? (
                <p
                  style={{
                    ...TYPE.ui,
                    color: `${T.muted}`,
                    fontSize: 14,
                    lineHeight: 'var(--lh-prose)',
                    marginBottom: S.m,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {letter.excerpt}
                </p>
              ) : (
                <p style={{ ...TYPE.meta, color: T.muted, marginBottom: S.m }}>
                  A letter written from the ground you covered.
                </p>
              )}
              {letter?.footnote ? (
                <p style={{ ...TYPE.caption, color: `${T.muted}cc`, marginBottom: S.m }}>
                  {letter.footnote}
                </p>
              ) : null}
              <TextButton
                onClick={(e) => {
                  e.stopPropagation()
                  if (onLetterClick) onLetterClick()
                  else navigate('F1')
                }}
                style={{ color: T.ember, letterSpacing: 'var(--tracking-meta)' }}
              >
                Open the letter
              </TextButton>
            </SurfaceCard>
          </div>

          {/* Chapters — act openers + memory leaves */}
          {groups.map((group, gi) => {
            const milestone = actMilestoneCaption(group.cards)
            return (
              <section key={group.act} aria-label={`Act ${group.act}, ${group.name}`}>
                {gi > 0 ? <MiniActLine color={group.color} /> : null}

                <div style={{ padding: `${S.l} ${S.edge} ${S.m}` }}>
                  <Eyebrow color={group.color} hairline>
                    Chapter {group.act}
                  </Eyebrow>
                  <h2
                    style={{
                      ...displayTitleStyle(26),
                      color: T.ink,
                      marginTop: S.m,
                      marginBottom: milestone ? S.s : 0,
                    }}
                  >
                    {group.name}
                  </h2>
                  {milestone ? (
                    <p style={{ ...TYPE.meta, color: T.muted, margin: 0 }}>{milestone}</p>
                  ) : null}
                </div>

                {group.cards.map((card) => {
                  const faded = card.status === 'upcoming'
                  const thenSrc = card.thenPhoto || card.photo
                  return (
                    <article
                      key={card.id}
                      style={{
                        padding: `0 ${S.edge} ${S.xl}`,
                        opacity: faded ? 0.55 : 1,
                        cursor: 'pointer',
                      }}
                      onClick={() => (onCardClick ? onCardClick(card.id) : navigate('E2'))}
                    >
                      {/* Quote leads the leaf */}
                      <p
                        style={{
                          ...TYPE.prose,
                          fontSize: 18,
                          color: faded ? T.muted : T.ink,
                          fontStyle: 'italic',
                          margin: `0 0 ${TYPE_SPACE.afterHeading}`,
                          maxWidth: '26em',
                        }}
                      >
                        “{card.sigLine}”
                      </p>

                      {/* Memory still — cinematic page image */}
                      <div
                        style={{
                          position: 'relative',
                          marginBottom: S.m,
                          borderRadius: 14,
                          overflow: 'hidden',
                        }}
                      >
                        <CinematicImage
                          src={card.photo}
                          alt=""
                          aspect="wide"
                          radius="none"
                          grade="film"
                          overlay="immersive"
                          position="landmark"
                          shadow="soft"
                          faded={faded}
                        />
                        {thenSrc && card.photo ? (
                          <div
                            aria-hidden
                            style={{
                              position: 'absolute',
                              right: S.s,
                              bottom: S.s,
                              width: 56,
                              height: 56,
                              borderRadius: 10,
                              overflow: 'hidden',
                              boxShadow: 'var(--shadow-elev-still)',
                              border: `1px solid ${T.warmWhite}33`,
                            }}
                          >
                            <CinematicImage
                              src={thenSrc}
                              alt=""
                              aspect="fill"
                              height="100%"
                              radius="none"
                              grade="none"
                              overlay="vignette"
                              position="upper"
                              shadow="none"
                              extraFilter="sepia(0.62) contrast(0.82) brightness(0.74)"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: S.m,
                        }}
                      >
                        <h3
                          style={{
                            ...TYPE.cardTitle,
                            color: faded ? T.muted : T.ink,
                            margin: 0,
                            flex: 1,
                          }}
                        >
                          {card.name}
                        </h3>
                        <span style={{ ...TYPE.caption, color: T.muted, flexShrink: 0 }}>
                          {card.statusCaption}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </section>
            )
          })}

          <div style={{ height: embedded ? SHELL_TAB_BAR_INSET : 12 }} />
        </div>
      )}

      {!embedded && <TabBar active="JOURNAL" />}
    </div>
  )
}
