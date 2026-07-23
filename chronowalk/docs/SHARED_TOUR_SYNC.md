# Shared tour session sync (Couple / Family)

Product truth: **shared tour progress / session synchronization** across seats — not live GPS and not millisecond-perfect audio sync.

## Discovery

Members often have **no cached session id**. After `20260725_walk_session_discovery.sql`:

1. Organizer (owner seat) calls `create_walk_session_for_credential(credential, resume_policy, device_binding)`.
2. Any claimed seat on that bundle calls `get_active_walk_session_for_credential(credential, device_binding)` — **no client-supplied bundle/session ids**.
3. Client polls via `subscribeWalkSession(null, onUpdate, { discover: true })` until a session appears, then polls by id.

Existing active Sandbox sessions remain discoverable after the migration (no remint).

## Synchronized fields

- `status` / active vs ended
- `playing` / `paused`
- `waypointId` (current stop)
- `chapterIndex`, `positionSeconds`, `playbackRate`
- `updatedAt` (stale rejection via `expectedUpdatedAt` on update)

## Autoplay

Remote **pause** pauses member narration when permitted. Remote **resume** may be blocked by mobile autoplay; the member sees synchronized “group resumed” state and an explicit **Resume with group** control. Do not claim exact synced audio playback.

## Security

- Server derives membership from credential + device binding only.
- Solo / invalid / revoked / wrong-binding / other-bundle → fail closed.
- Create session is **owner-only**; members discover.
- Leader-only: `syncEnabled`, `resumePolicy`, `clock` patches; resume when policy is `leader`.
- Seat limits unchanged: Couple 2, Family 4.
