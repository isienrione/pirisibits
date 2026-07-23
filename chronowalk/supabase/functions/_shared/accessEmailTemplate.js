/**
 * ChronoWalk purchase unlock email — HTML + plaintext.
 * Product-specific copy from the server-derived purchase SKU.
 * Never includes device credentials or member invite links.
 */

export const PACK_LABELS = Object.freeze({
  'rome-central': 'Roma Historica',
  'rome-essential': 'Roma Antica',
  'rome-complete': 'Roma Eterna',
  'rome-couple': 'Couple Bundle',
  'rome-family': 'Family Bundle',
})

export const BUNDLE_STOPS = 21

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function packLabel(productId) {
  if (!productId) return null
  return PACK_LABELS[String(productId)] ?? String(productId)
}

export function isBundleSku(productId) {
  return productId === 'rome-couple' || productId === 'rome-family'
}

export function formatAccessCodeDisplay(accessToken) {
  const raw = String(accessToken ?? '').trim()
  if (!raw) return ''
  return raw.toLowerCase()
}

export function formatClaimExpiry(expiresAt) {
  if (!expiresAt) return '7 days from issue'
  const d = new Date(expiresAt)
  if (!Number.isFinite(d.getTime())) return '7 days from issue'
  return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

/**
 * @param {{
 *   productId: string,
 *   seatLimit?: number | null,
 *   claimExpiresAt?: string | null,
 * }} opts
 */
export function buildSkuCopy({ productId, seatLimit = null, claimExpiresAt = null }) {
  const pack = packLabel(productId) ?? 'ChronoWalk Rome'
  const seats = Number(seatLimit)
  const expiry = formatClaimExpiry(claimExpiresAt)
  const oneTime =
    `This access link and code are one-time. They expire on ${expiry}. ` +
    'If you already used them, or they expired, request a fresh restore email from chronowalk.com/access — do not reuse an old code.'

  if (isBundleSku(productId)) {
    const cap = Number.isFinite(seats) && seats > 0 ? seats : productId === 'rome-couple' ? 2 : 4
    return {
      pack,
      kind: 'bundle',
      seatLimit: cap,
      headline: 'Your shared Rome experience is ready.',
      intro:
        `You purchased ${pack}. Every seat includes all ${BUNDLE_STOPS} Roma Eterna stops. ` +
        `Your plan covers ${cap} seats total — including you as the organizer.`,
      organizerNext:
        `After you unlock with the one-time code below, open Family / Bundle settings in the app to invite or reset members one at a time. ` +
        'We never email member seat credentials or a list of invite links together.',
      oneTime,
      showOrganizerInvite: true,
    }
  }

  return {
    pack,
    kind: 'solo',
    seatLimit: 1,
    headline: 'Your Rome experience is ready.',
    intro:
      `Thank you for choosing ChronoWalk. Your pack is ${pack}. ` +
      'Open your personal link below to unlock your walk and save progress on this device.',
    organizerNext: null,
    oneTime,
    showOrganizerInvite: false,
  }
}

export function buildAccessLink(siteUrl, claim) {
  const base = String(siteUrl ?? 'https://chronowalk.com').replace(/\/$/, '')
  return `${base}/access?token=${encodeURIComponent(String(claim ?? ''))}`
}

export function accessEmailSubject(productId) {
  const pack = packLabel(productId)
  return pack ? `Your ChronoWalk access — ${pack}` : 'Your ChronoWalk Rome access link'
}

/**
 * @param {string} orderId
 * @param {string} [emailGenerationId]
 */
export function resendIdempotencyKey(orderId, emailGenerationId) {
  const order = String(orderId ?? '').trim()
  const gen = String(emailGenerationId ?? '').trim()
  if (!gen) return `purchase-access/${order}`
  return `purchase-access/${order}/${gen}`
}

/**
 * @param {{
 *   accessToken: string,
 *   accessLink?: string,
 *   productId: string,
 *   seatLimit?: number | null,
 *   claimExpiresAt?: string | null,
 *   siteUrl?: string,
 * }} opts
 */
export function buildAccessEmailText(opts) {
  const {
    accessToken,
    productId,
    seatLimit = null,
    claimExpiresAt = null,
    siteUrl = 'https://chronowalk.com',
  } = opts
  const accessLink = opts.accessLink ?? buildAccessLink(siteUrl, accessToken)
  const copy = buildSkuCopy({ productId, seatLimit, claimExpiresAt })

  return [
    'WELCOME TO CHRONOWALK',
    '',
    copy.headline,
    '',
    copy.intro,
    '',
    `Pack: ${copy.pack}`,
    isBundleSku(productId)
      ? `Seats: ${copy.seatLimit} total (including you) · ${BUNDLE_STOPS} Roma Eterna stops per seat`
      : null,
    '',
    accessLink,
    '',
    'Or go to chronowalk.com/access and paste this one-time access code:',
    String(accessToken),
    '',
    copy.oneTime,
    '',
    copy.organizerNext,
    '',
    'WALK · LISTEN · TIME TRAVEL',
    '',
    'EU / UK note: ChronoWalk is digital content delivered immediately. By opening your access link or entering your access code, supply begins and — where the law allows — you lose the usual 14-day cooling-off / withdrawal right for this purchase. This does not affect your rights if the content is faulty or not as described. Details: https://chronowalk.com/legal/refund',
  ]
    .filter((line) => line != null && line !== '')
    .join('\n')
}

/**
 * @param {{
 *   accessToken: string,
 *   accessLink?: string,
 *   productId: string,
 *   seatLimit?: number | null,
 *   claimExpiresAt?: string | null,
 *   siteUrl?: string,
 * }} opts
 */
export function buildAccessEmailHtml(opts) {
  const {
    accessToken,
    productId,
    seatLimit = null,
    claimExpiresAt = null,
    siteUrl = 'https://chronowalk.com',
  } = opts
  const base = String(siteUrl).replace(/\/$/, '')
  const accessLink = opts.accessLink ?? buildAccessLink(base, accessToken)
  const copy = buildSkuCopy({ productId, seatLimit, claimExpiresAt })
  const emblem = `${base}/brand/emblem-dark.png`
  const lockup = `${base}/brand/lockup-horizontal-dark.png`
  const code = escapeHtml(formatAccessCodeDisplay(accessToken))
  const link = escapeHtml(accessLink)

  const bundleBlock = copy.showOrganizerInvite
    ? `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.55;color:#c4a35a;">
        ${escapeHtml(copy.intro)}
      </p>
      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.55;color:#c4a35a;">
        ${escapeHtml(copy.organizerNext)}
      </p>`
    : `<p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#c4a35a;">
        ${escapeHtml(copy.intro)}
      </p>`

  const packLine = `<p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.5;color:#c4a35a;">Pack: ${escapeHtml(copy.pack)}${
    copy.showOrganizerInvite
      ? ` · ${copy.seatLimit} seats total · ${BUNDLE_STOPS} Roma Eterna stops per seat`
      : ''
  }</p>`

  const oneTimeLine = `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#b9af9c;">${escapeHtml(copy.oneTime)}</p>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Your ChronoWalk Rome access</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;color:#f5f0e6;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your Rome experience is ready — open your ChronoWalk one-time access link.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#050505;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background-color:#0b0b0d;border:1px solid #2a2418;">
          <tr>
            <td style="padding:36px 36px 12px;">
              <img src="${escapeHtml(lockup)}" width="220" alt="ChronoWalk" style="display:block;width:220px;max-width:70%;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 0;">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#c9a227;">
                Welcome to ChronoWalk
              </p>
              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;font-weight:400;color:#faf6ef;">
                ${escapeHtml(copy.headline)}
              </h1>
              ${packLine}
              ${bundleBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #c9a227;background-color:#12110e;">
                <tr>
                  <td style="padding:22px 20px;text-align:center;">
                    <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#c9a227;">
                      One-time access code
                    </p>
                    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.45;letter-spacing:0.04em;color:#faf6ef;word-break:break-all;">
                      ${code}
                    </p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#b9af9c;">
                      Use at <a href="${escapeHtml(base)}/access" style="color:#c9a227;text-decoration:underline;">chronowalk.com/access</a>
                    </p>
                    ${oneTimeLine}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 36px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" bgcolor="#e07a2f" style="border-radius:10px;background:linear-gradient(180deg,#f0a04b 0%,#e07a2f 55%,#c45f1c 100%);">
                    <a href="${link}" style="display:inline-block;padding:16px 28px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.2;color:#0b0b0d;text-decoration:none;font-weight:600;">
                      Begin Your Chronowalk&nbsp;&rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8a8274;">
                Button not working? Paste this link into your browser:<br />
                <a href="${link}" style="color:#c9a227;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 40px;text-align:center;border-top:1px solid #2a2418;">
              <p style="margin:24px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#faf6ef;">
                Walk &bull; Listen &bull; Time Travel
              </p>
              <img src="${escapeHtml(emblem)}" width="36" height="36" alt="" style="display:inline-block;width:36px;height:36px;border:0;opacity:0.9;" />
              <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.55;color:#6e675c;text-align:left;">
                EU / UK note: ChronoWalk is digital content delivered immediately. By opening your access link or entering your access code, supply begins and — where the law allows — you lose the usual 14-day cooling-off / withdrawal right for this purchase. This does not affect your rights if the content is faulty or not as described.
                <a href="${escapeHtml(base)}/legal/refund" style="color:#c9a227;text-decoration:underline;">Refund policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
