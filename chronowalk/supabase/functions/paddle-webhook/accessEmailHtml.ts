/**
 * Re-export shared access email template (worker is the send path).
 * Kept for deploy compatibility with older paste workflows.
 */
export {
  accessEmailSubject,
  buildAccessEmailHtml,
  buildAccessEmailText,
  formatAccessCodeDisplay,
  packLabel,
} from '../_shared/accessEmailTemplate.js'
