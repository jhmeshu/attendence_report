import { runEngine } from './runEngine.js'
import { aggregateByEmployeeMonth } from './aggregate.js'
import { detectHighLate } from './flagging.js'
import { buildComparisons } from './comparison.js'

/**
 * Full pipeline: normalized records → processed records → per-employee/month
 * summaries → high-late flagging → historical comparison. This is the
 * convenient entry point for the UI — call it once with the validated dataset
 * and get everything the dashboard needs.
 *
 * @param {object[]} records - NormalizedRecord[] from the attendance store
 * @param {object} [ruleOverrides]
 * @returns {{
 *   records: object[],          // processed (enriched) records
 *   summaries: object[],        // per employee+month stats
 *   employees: object[],        // unique employees
 *   months: string[],           // sorted 'YYYY-MM'
 *   flaggedEmployees: object[], // Phase 5: late% > threshold on reporting month
 *   comparisons: object[],      // Phase 6: month-by-month trend per flagged employee
 *   reportingMonth: string,     // latest month (the one being reported on)
 *   rules: object,
 *   counts: object,
 * }}
 */
export function buildReport(records, ruleOverrides = {}) {
  const { records: processed, rules, counts } = runEngine(records, ruleOverrides)
  const { summaries, employees, months } = aggregateByEmployeeMonth(processed)

  // Reporting month = the latest uploaded month.
  const reportingMonth = months.length ? months[months.length - 1] : null

  // Phase 5 — flag employees above the high-late threshold.
  const { flaggedEmployees, threshold } = detectHighLate(summaries, {
    reportingMonth,
    threshold: ruleOverrides.highLateThreshold,
  })

  // Phase 6 — historical comparison for flagged employees only.
  const { comparisons } = buildComparisons(flaggedEmployees, summaries, months)

  return {
    records: processed,
    summaries,
    employees,
    months,
    flaggedEmployees,
    comparisons,
    reportingMonth,
    rules: { ...rules, highLateThreshold: threshold },
    counts,
  }
}

export default buildReport
