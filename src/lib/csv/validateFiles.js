/**
 * Cross-file validation across the uploaded set.
 *
 * Runs after each file passes individual validation. Checks:
 *  - duplicate months (two files for the same month)
 *  - consecutive months (no gaps between detected months)
 *  - single-month uploads (allowed, with a warning about missing history)
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2026-07" → "July 2026" */
export function formatMonth(ym) {
  if (!ym) return 'Unknown'
  const [y, m] = ym.split('-')
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`
}

/** Convert "YYYY-MM" to a comparable number, e.g. 2026-07 → 202607. */
function monthToNum(ym) {
  const [y, m] = ym.split('-').map(Number)
  return y * 12 + (m - 1)
}

/**
 * Validate the set of per-file results.
 *
 * @param {import('./types.js').ValidationResult[]} fileResults — only the `ok` ones are used
 * @returns {{
 *   ok: boolean,
 *   months: string[],            // sorted unique 'YYYY-MM'
 *   reportingMonth: string|null, // the latest month
 *   errors: import('./types.js').Issue[],
 *   warnings: import('./types.js').Issue[],
 * }}
 */
export function validateFiles(fileResults) {
  const errors = []
  const warnings = []

  const valid = fileResults.filter((r) => r.ok && r.month)

  // Nothing valid yet → nothing to check across files.
  if (valid.length === 0) {
    return { ok: false, months: [], reportingMonth: null, errors, warnings }
  }

  // --- Duplicate months ---------------------------------------------------
  const monthToFiles = new Map()
  for (const r of valid) {
    if (!monthToFiles.has(r.month)) monthToFiles.set(r.month, [])
    monthToFiles.get(r.month).push(r.file.name)
  }

  for (const [month, names] of monthToFiles) {
    if (names.length > 1) {
      errors.push({
        code: 'duplicate_month',
        message: `Multiple files cover ${formatMonth(month)}: ${names.join(', ')}. Please upload only one file per month.`,
      })
    }
  }

  // --- Consecutive months -------------------------------------------------
  const months = [...monthToFiles.keys()].sort()

  if (months.length > 1) {
    let gap = null
    for (let i = 1; i < months.length; i++) {
      const diff = monthToNum(months[i]) - monthToNum(months[i - 1])
      if (diff !== 1) {
        gap = { from: months[i - 1], to: months[i] }
        break
      }
    }
    if (gap) {
      errors.push({
        code: 'non_consecutive',
        message: `Months are not consecutive: gap between ${formatMonth(gap.from)} and ${formatMonth(gap.to)}. Please upload consecutive months.`,
      })
    }
  } else if (months.length === 1) {
    // Single month is allowed but flagged.
    warnings.push({
      code: 'single_month',
      message: `Historical comparison unavailable. Upload the previous month to enable multi-month reviews.`,
    })
  }

  const reportingMonth = months.length > 0 ? months[months.length - 1] : null

  return {
    ok: errors.length === 0,
    months,
    reportingMonth,
    errors,
    warnings,
  }
}

export default validateFiles
