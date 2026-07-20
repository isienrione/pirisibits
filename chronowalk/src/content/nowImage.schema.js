import { z } from 'zod'

export const IMAGE_LICENSE_VALUES = ['CC0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'original']

export const IMAGE_SOURCE_VALUES = ['wikimedia', 'ai_generated', 'commissioned']

const imageLicenseSchema = z.enum(IMAGE_LICENSE_VALUES).nullable()

const imageSourceSchema = z.enum(IMAGE_SOURCE_VALUES).nullable()

export const nowImageSchema = z
  .object({
    file: z.string().nullable(),
    source: imageSourceSchema,
    license: imageLicenseSchema,
    credit: z.string().nullable(),
    source_url: z.string().url().nullable(),
  })
  .superRefine((nowImage, ctx) => {
    if (nowImage.source === 'wikimedia') {
      if (!nowImage.license) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'now_image.license is required when source is "wikimedia"',
          path: ['license'],
        })
      }
      if (!nowImage.credit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'now_image.credit is required when source is "wikimedia"',
          path: ['credit'],
        })
      }
    }
  })

export function validateNowImageSemantics(waypointId, nowImage, errors) {
  if (!nowImage) return

  if (nowImage.source === 'wikimedia') {
    if (!nowImage.license) {
      errors.push(`waypoint ${waypointId}: now_image.license is required for wikimedia sources`)
    }
    if (!nowImage.credit) {
      errors.push(`waypoint ${waypointId}: now_image.credit is required for wikimedia sources`)
    }
  }

  const licenseText = nowImage.license ?? ''
  if (/NC|NonCommercial/i.test(licenseText)) {
    errors.push(`waypoint ${waypointId}: non-commercial licenses are not permitted`)
  }
}
