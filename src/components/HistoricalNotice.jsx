import { AlertTriangle, Info } from 'lucide-react'
import { formatMonth } from '../lib/csv'

/**
 * Historical-comparison notice (doc Phase 13).
 *
 *   - 1 month uploaded → warn that multi-month reviews are unavailable.
 *   - 2 months uploaded → info that the 3-month (May→June→July) comparison
 *     is incomplete and which months are still missing.
 */
export function HistoricalNotice({ months, reportingMonth }) {
  if (!months?.length || !reportingMonth) return null

  if (months.length < 2) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-ink">
          Historical comparison unavailable. Upload the previous two months to
          enable 3-month reviews.
        </p>
      </div>
    )
  }

  if (months.length < 3) {
    const missing = trailingMonths(3, reportingMonth).filter(
      (m) => !months.includes(m),
    )
    return (
      <div className="flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50/50 p-3.5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <div className="text-sm text-ink">
          <p className="font-medium">
            3-month review incomplete — {`${months.length} of 3`} months uploaded
            ({months.map(formatMonth).join(', ')}).
          </p>
          {missing.length > 0 && (
            <p className="mt-0.5 text-xs text-ink-muted">
              Upload {missing.map(formatMonth).join(' and ')} for a full
              reporting-month review.
            </p>
          )}
        </div>
      </div>
    )
  }

  return null
}

/** The `count` most recent months ending at `ym` (inclusive), oldest first. */
function trailingMonths(count, ym) {
  const [y, m] = ym.split('-').map(Number)
  const base = y * 12 + (m - 1)
  const out = []
  for (let i = count - 1; i >= 0; i--) {
    const v = base - i
    out.push(`${Math.floor(v / 12)}-${String((v % 12) + 1).padStart(2, '0')}`)
  }
  return out
}

export default HistoricalNotice