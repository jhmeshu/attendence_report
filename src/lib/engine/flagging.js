import { DEFAULT_RULES } from './config.js'

/**
 * Phase 5 — 50% Late Detection.
 *
 * Flags employees whose late rate on the REPORTING month exceeds the threshold
 * (default 50%). The reporting month is the latest uploaded month (e.g. July).
 *
 * The resulting `flaggedEmployees[]` is the seed for the Phase 6 multi-month
 * investigation: we only pull historical data for people flagged here.
 *
 * @param {object[]} summaries - per employee+month summaries from aggregateByEmployeeMonth
 * @param {object} [options]
 * @param {string} [options.reportingMonth] - 'YYYY-MM'; defaults to latest month present
 * @param {number} [options.threshold] - late % above which an employee is flagged (default 50)
 * @returns {{
 *   flaggedEmployees: object[],
 *   reportingMonth: string,
 *   threshold: number,
 *   count: number,
 * }}
 */
export function detectHighLate(summaries, options = {}) {
  const threshold = options.threshold ?? DEFAULT_RULES.highLateThreshold

  // Reporting month = explicit arg, else the latest month in the data.
  const reportingMonth =
    options.reportingMonth ??
    (summaries.length
      ? summaries.map((s) => s.month).sort().slice(-1)[0]
      : null)

  if (!reportingMonth) {
    return { flaggedEmployees: [], reportingMonth: null, threshold, count: 0 }
  }

  // Only consider the reporting-month summary for each employee.
  const flagged = summaries
    .filter((s) => s.month === reportingMonth)
    .filter((s) => s.latePct > threshold)
    .map((s) => ({
      employeeId: s.employeeId,
      name: s.name,
      department: s.department,
      position: s.position,
      month: s.month,
      latePct: s.latePct,
      attendancePct: s.attendancePct,
      lateDays: s.late,
      scheduledWorkingDays: s.scheduledWorkingDays,
      // Convenience for the UI badge/label.
      highLateFlag: true,
    }))
    // Highest late rate first — the worst offenders surface to the top.
    .sort((a, b) => b.latePct - a.latePct)

  return {
    flaggedEmployees: flagged,
    reportingMonth,
    threshold,
    count: flagged.length,
  }
}

export default detectHighLate
