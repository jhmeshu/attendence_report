/**
 * Phase 6 — Two-Month Exception Workflow.
 *
 * Only flagged employees (Phase 5: late% > threshold on the reporting month)
 * get a historical comparison. For each flagged employee we gather their
 * per-month summaries across ALL uploaded months and build a month-by-month
 * trend, so management can see whether the high late rate is new or persistent.
 *
 * The doc describes a 3-month (May→June→July) flow; with our 2-month dataset
 * this is June→July. The logic is month-count-agnostic: it uses whatever
 * months are present, ordered chronologically.
 */

/** Fields compared per month — kept compact for the review table. */
const COMPARE_FIELDS = [
  'attendancePct',
  'latePct',
  'earlyLeavePct',
  'late',
  'earlyLeave',
  'present',
  'absent',
  'scheduledWorkingDays',
  'avgLateMinutes',
  'totalWorkedHours',
  'avgWorkedHours',
]

/**
 * Build the historical comparison for a set of flagged employees.
 *
 * @param {object[]} flaggedEmployees - from detectHighLate()
 * @param {object[]} summaries - all per employee+month summaries
 * @param {string[]} months - sorted 'YYYY-MM' (all uploaded months)
 * @returns {{ comparisons: EmployeeComparison[], months: string[] }}
 */
export function buildComparisons(flaggedEmployees, summaries, months) {
  const orderedMonths = [...months].sort()

  // Index summaries by (employeeKey + month) for O(1) lookup.
  const byKeyMonth = new Map()
  for (const s of summaries) {
    byKeyMonth.set(`${s.employeeId}|${s.name}|${s.month}`, s)
  }

  const comparisons = flaggedEmployees.map((emp) => {
    const monthly = orderedMonths.map((month) => {
      const s = byKeyMonth.get(`${emp.employeeId}|${emp.name}|${month}`)
      return {
        month,
        available: !!s,
        ...(s ? pickFields(s) : emptyFields()),
      }
    })

    return {
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department,
      position: emp.position,
      months: orderedMonths,
      monthly, // one entry per month, in chronological order
      reportingMonth: emp.month,
      // Reporting-month values (the trigger for the review).
      reportingLatePct: emp.latePct,
      reportingAttendancePct: emp.attendancePct,
      reportingLateDays: emp.lateDays,
      reportingScheduledDays: emp.scheduledWorkingDays,
      highLateFlag: true,
    }
  })

  return { comparisons, months: orderedMonths }
}

/** Extract the comparison fields from a summary. */
function pickFields(s) {
  const out = {}
  for (const f of COMPARE_FIELDS) out[f] = s[f]
  return out
}

/** Placeholder values for a month where the employee has no data. */
function emptyFields() {
  const out = {}
  for (const f of COMPARE_FIELDS) {
    out[f] = f === 'totalWorkedHours' || f === 'avgWorkedHours' ? null : 0
  }
  return out
}

export default buildComparisons
