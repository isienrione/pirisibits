import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { BronzeButton, Button, EditorialTitle, GlassPanel } from '../../ui'

const APP_NAME = 'ChronoWalk'

const PILLARS = [
  {
    id: 'pace',
    title: 'Your pace',
    body: 'Finish in an afternoon or spread the walk across several days — pause anytime and pick up where you left off.',
  },
  {
    id: 'audio',
    title: 'Expert companion',
    body: 'Layered audio stories, context, and fun facts about what you are actually looking at — like a brilliant guide in your pocket.',
  },
  {
    id: 'reveals',
    title: 'See ancient Rome',
    body: 'Before-and-after reconstructions at every landmark so ruins come alive under the same sky you see today.',
  },
]

export function WelcomeView({ onBrowseTours, onTryFreePreview, onPwaInstall }) {
  return (
    <GlassPanel className="rounded-3xl p-6 shadow-plaque-lg sm:p-8" grain>
      <EditorialTitle
        eyebrow={APP_NAME}
        size="lg"
        subtitle="Walk the city on your own schedule with ChronoWalk as your expert companion — always ready with layered stories, historical context, and the kind of fun knowledge that makes every ruin feel alive."
      >
        A detailed, entertaining self-guided audio tour of{' '}
        <span className="font-display italic text-bronze">Rome</span>
      </EditorialTitle>

      <ul className="mt-6 space-y-4">
        {PILLARS.map((pillar) => (
          <li
            key={pillar.id}
            className="rounded-2xl border border-parchment/70 bg-parchment/25 px-4 py-3.5"
          >
            <p className="text-sm font-semibold text-deep-slate">{pillar.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-soft-slate">{pillar.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3">
        <BronzeButton
          size="lg"
          fullWidth
          onClick={() => {
            triggerHaptic(HAPTIC_KIND.SOFT_TAP)
            onBrowseTours()
          }}
        >
          Browse tours &amp; pricing
        </BronzeButton>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => {
            triggerHaptic(HAPTIC_KIND.SUCCESS)
            onTryFreePreview()
          }}
        >
          Try for free
        </Button>
        <Button
          variant="text"
          fullWidth
          onClick={() => {
            triggerHaptic(HAPTIC_KIND.SOFT_TAP)
            onPwaInstall()
          }}
        >
          Add to home screen
        </Button>
      </div>
    </GlassPanel>
  )
}

export default WelcomeView
