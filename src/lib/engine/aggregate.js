import { formatDuration } from './time.js'

/**
 * Aggregate processed records into per-employee/month summaries.
 *
 * Group key = employee (employeeId|name) + month (YYYY-MM). For each group we
 * count statuses and derive the percentages/ratios from doc Phase 4.
 *
 * Denominator decisions (important):
 *   - "Scheduled working days" = working-day records only (excludes Weekend
 *     rest days). Weekend Work days are *added on top* as a bonus and do NOT
 *     inflate the denominator — working a weekend shouldn't make attendance %
 *     look artificially high, nor should it count against you.
 *   - Attendance % = Present / ScheduledWorkingDays.
 *     "Present" includes normal Present days. Weekend Work and No Record are
 *     excluded from both numerator and denominator:
 *       - No Record → a bKash/Remote day with no expected clock-in; treated as
 *         neutral (neither attended nor missed), per the doc's distinction.
 *       - Weekend Work → tracked separately as a bonus stat.
 *
 * @param {object[]} processedRecords - output of runEngine()
 * @returns {{ summaries: EmployeeMonthSummary[], employees: Employee[], months: string[] }}
 */
export function aggregateByEmployeeMonth(processedRecords) {
  // Group records by employee+month.
  const groups = new Map()
  const monthSet = new Set()

  for (const r of processedRecords) {
    if (!r.month) continue
    monthSet.add(r.month)
    const empKey = `${r.employeeId}|${r.name}`
    const groupKey = `${empKey}|${r.month}`

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        employeeId: r.employeeId,
        name: r.name,
        department: r.department,
        position: r.position,
        month: r.month,
        records: [],
      })
    }
    groups.get(groupKey).records.push(r)
  }

  const summaries = [...groups.values()].map(summarizeGroup)
  const months = [...monthSet].sort()

  // Build a lightweight employee directory (unique employees, latest dept).
  const empMap = new Map()
  for (const s of summaries) {
    empMap.set(`${s.employeeId}|${s.name}`, {
      employeeId: s.employeeId,
      name: s.name,
      department: s.department,
      position: s.position,
    })
  }
  const employees = [...empMap.values()]

  return { summaries, employees, months }
}

/**
 * Compute the full statistic set for one employee/month group.
 */
function summarizeGroup(group) {
  const recs = group.records

  // Raw counts.
  let scheduledWorkingDays = 0 // Sun–Thu records (denominator base)
  let present = 0
  let absent = 0
  let noRecord = 0
  let late = 0
  let earlyLeave = 0
  let weekendWork = 0
  let weekendRest = 0

  // Accumulators for averages.
  let totalLateMinutes = 0
  let totalWorkedMinutes = 0
  let workedDaysWithHours = 0 // days that have a worked-minutes value

  for (const r of recs) {
    if (r.isWeekend) {
      if (r.isWeekendWork) weekendWork++
      else weekendRest++
      continue
    }

    // Working day.
    scheduledWorkingDays++

    if (r.isPresent && !r.isWeekendWork) present++
    if (r.isAbsent) absent++
    if (r.isNoRecord) noRecord++
    if (r.isLate) {
      late++
      totalLateMinutes += r.lateMinutes || 0
    }
    if (r.isEarlyLeave) earlyLeave++

    if (r.workedMinutes != null) {
      totalWorkedMinutes += r.workedMinutes
      workedDaysWithHours++
    }
  }

  // Note: weekend-work days also carry worked minutes; include them in total
  // hours but keep them out of the per-day average over scheduled days.
  const weekendWorkMins = recs
    .filter((r) => r.isWeekendWork && r.workedMinutes != null)
    .reduce((sum, r) => sum + r.workedMinutes, 0)
  totalWorkedMinutes += weekendWorkMins

  // Derived percentages. Guard against divide-by-zero.
  //
  // No Record days (bKash/Remote with no expected clock-in) are excluded from
  // these denominators, matching the doc's Phase 4 example:
  //   Present 19, Absent 2, No Record 1 → Attendance 19/21 = 90.48%
  const expectedWorkingDays = present + absent // "present + absent" base

  const attendancePct = pct(present, expectedWorkingDays)
  const latePct = pct(late, expectedWorkingDays)
  const earlyLeavePct = pct(earlyLeave, present) // early leave is % of attended days

  const avgLateMinutes = late > 0 ? Math.round(totalLateMinutes / late) : 0
  const avgWorkedMinutes =
    workedDaysWithHours > 0
      ? Math.round((totalWorkedMinutes - weekendWorkMins) / workedDaysWithHours)
      : 0

  return {
    employeeId: group.employeeId,
    name: group.name,
    department: group.department,
    position: group.position,
    month: group.month,

    // Raw counts
    scheduledWorkingDays,
    present,
    absent,
    noRecord,
    late,
    earlyLeave,
    weekendWork,
    weekendRest,

    // Percentages (0–100, 1 decimal)
    attendancePct,
    latePct,
    earlyLeavePct,

    // Time aggregates
    totalLateMinutes,
    avgLateMinutes,
    totalWorkedMinutes,
    avgWorkedMinutes,
    totalWorkedHours: formatDuration(totalWorkedMinutes),
    avgWorkedHours: formatDuration(avgWorkedMinutes),
  }
}

/** Safe percentage with 1 decimal place. Returns 0 when denominator is 0. */
function pct(numerator, denominator) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

export default aggregateByEmployeeMonth
