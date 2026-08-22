import { SCHEMA_VERSION, type TravelerState } from './types'

const KEY = `chronowalk.traveler.v${SCHEMA_VERSION}`

export type KeyValueStore = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
}

export function serializeSession(state: TravelerState) {
  return {
    schema: SCHEMA_VERSION,
    demoOnly: true,
    profile: state.profile,
    session: state.session,
    route: state.route,
    cursor: state.cursor,
    experience: state.experience,
    savedIds: state.savedIds,
    screen: state.screen,
    onboarding: state.onboarding,
  }
}

export function deserializeSession(raw: string | null): Partial<TravelerState> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { schema?: number } & Partial<TravelerState>
    if (parsed.schema !== SCHEMA_VERSION) {
      return { screen: 'C07' }
    }
    return {
      profile: parsed.profile ?? null,
      session: parsed.session,
      route: parsed.route ?? null,
      cursor: parsed.cursor ?? 0,
      experience: parsed.experience,
      savedIds: parsed.savedIds ?? [],
      screen: parsed.route ? 'C07' : parsed.screen,
      onboarding: parsed.onboarding ?? {},
    }
  } catch {
    return null
  }
}

export async function loadSession(store: KeyValueStore) {
  return deserializeSession(await store.getItem(KEY))
}

export async function saveSession(store: KeyValueStore, state: TravelerState) {
  await store.setItem(KEY, JSON.stringify(serializeSession(state)))
}
