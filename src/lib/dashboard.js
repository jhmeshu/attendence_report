import { formatMonth } from './csv/validateFiles.js'

/**
 * Derive dashboard-ready datasets from a built report.
 *
 * Pure functions — the store memoizes these over the report so the UI just
 * reads polished numbers/arrays. Kept out of the engine so the engine stays
 * a pure data layer.
 */

/**
 * KPI cards + status breakdown for the reporting month.
 * Trend compares the reporting month against the previous available month.
 *
 * @param {object} report - buildReport output
 * @returns {{ kpis: object, statusBreakdown: object[] }}
 */
export function deriveKpis(report) {
  const { summaries, reportingMonth, months } = report
  if (!reportingMonth) return emptyKpis()

  // Reporting-month totals across all employees.
  const rm = summaries.filter((s) => s.month === reportingMonth)
  const totals = sumSummaries(rm)

  // Previous month (for the trend delta).
  const idx = months.indexOf(reportingMonth)
  const prevMonth = idx > 0 ? months[idx - 1] : null
  const prevTotals = prevMonth
    ? sumSummaries(summaries.filter((s) => s.month === prevMonth))
    : null

  const attendancePct = pct(totals.present, totals.scheduledWorkingDays)
  const prevAttendancePct = prevTotals
    ? pct(prevTotals.present, prevTotals.scheduledWorkingDays)
    : null

  return {
    kpis: {
      overallAttendance: attendancePct,
      present: totals.present,
      absent: totals.absent,
      late: totals.late,
      earlyLeave: totals.earlyLeave,
      trend:
        prevAttendancePct != null
          ? {
              direction: attendancePct >= prevAttendancePct ? 'up' : 'down',
              value: `${Math.abs((attendancePct - prevAttendancePct)).toFixed(1)}%`,
              label: `vs ${formatMonth(prevMonth)}`,
              isGood: attendancePct >= prevAttendancePct,
            }
          : null,
    },
    statusBreakdown: [
      { name: 'Present', value: totals.present, tone: '#008DFF' },
      { name: 'Absent', value: totals.absent, tone: '#DC2626' },
      { name: 'No Record', value: totals.noRecord, tone: '#94A3B8' },
      { name: 'Late (of present)', value: totals.late, tone: '#F59E0B' },
      { name: 'Early Leave', value: totals.earlyLeave, tone: '#8B5CF6' },
    ],
  }
}

/**
 * Daily attendance trend for the reporting month:
 * per-date attendance % and late count.
 */
export function deriveTrend(report) {
  const { records, reportingMonth } = report
  if (!reportingMonth) return []

  const byDate = new Map()
  for (const r of records) {
    if (r.month !== reportingMonth || r.isWeekend) continue
    if (!byDate.has(r.date)) {
      byDate.set(r.date, { date: r.date, present: 0, scheduled: 0, late: 0 })
    }
    const d = byDate.get(r.date)
    d.scheduled++
    if (r.isPresent && !r.isWeekendWork) d.present++
    if (r.isLate) d.late++
  }

  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      day: formatDay(d.date),
      attendance: pct(d.present, d.scheduled),
      late: d.late,
    }))
}

/**
 * Late-arrival distribution buckets for the reporting month.
 */
export function deriveLateAnalysis(report) {
  const { records, reportingMonth } = report
  if (!reportingMonth) return []

  const buckets = [
    { range: '0–10 min', min: 1, max: 10, count: 0 },
    { range: '11–20 min', min: 11, max: 20, count: 0 },
    { range: '21–30 min', min: 21, max: 30, count: 0 },
    { range: '31–60 min', min: 31, max: 60, count: 0 },
    { range: '60+ min', min: 61, max: Infinity, count: 0 },
  ]

  for (const r of records) {
    if (r.month !== reportingMonth || !r.isLate) continue
    const m = r.lateMinutes || 0
    const b = buckets.find((bk) => m >= bk.min && m <= bk.max)
    if (b) b.count++
  }

  return buckets.map(({ range, count }) => ({ range, count }))
}

/**
 * Management alerts derived from the data (doc Phase 7 examples).
 */
export function deriveAlerts(report) {
  const { summaries, reportingMonth, flaggedEmployees } = report
  if (!reportingMonth) return []

  const rm = summaries.filter((s) => s.month === reportingMonth)
  const totals = sumSummaries(rm)
  const employeeCount = rm.length || 1

  const alerts = []

  // High late rate
  if (flaggedEmployees.length > 0) {
    alerts.push({
      tone: 'danger',
      title: `${flaggedEmployees.length} employees have late rate above 50%`,
      detail: 'Review recommended before month-end',
    })
  }

  // Frequent early leave — employees with earlyLeavePct > 25%
  const frequentEarly = rm.filter((s) => s.earlyLeavePct > 25).length
  if (frequentEarly > 0) {
    alerts.push({
      tone: 'warning',
      title: `${frequentEarly} employees have frequent early leave`,
      detail: 'Pattern detected this reporting month',
    })
  }

  // High absence — employees with absence rate > 15%
  const highAbsence = rm.filter(
    (s) => pct(s.absent, s.scheduledWorkingDays) > 15,
  ).length
  if (highAbsence > 0) {
    alerts.push({
      tone: 'danger',
      title: `${highAbsence} employees have unusually high absence`,
      detail: 'Absent rate exceeds 15% this month',
    })
  }

  return alerts
}

/* --------------------------------- helpers -------------------------------- */

function sumSummaries(list) {
  return list.reduce(
    (a, s) => ({
      scheduledWorkingDays: a.scheduledWorkingDays + s.scheduledWorkingDays,
      present: a.present + s.present,
      absent: a.absent + s.absent,
      noRecord: a.noRecord + s.noRecord,
      late: a.late + s.late,
      earlyLeave: a.earlyLeave + s.earlyLeave,
      weekendWork: a.weekendWork + s.weekendWork,
    }),
    { scheduledWorkingDays: 0, present: 0, absent: 0, noRecord: 0, late: 0, earlyLeave: 0, weekendWork: 0 },
  )
}

function pct(numerator, denominator) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

function formatDay(iso) {
  const [y, m, d] = iso.split('-')
  return `${formatMonthShort(Number(m))} ${Number(d)}`
}

function formatMonthShort(m) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]
}

function emptyKpis() {
  return {
    kpis: {
      overallAttendance: 0,
      present: 0,
      absent: 0,
      late: 0,
      earlyLeave: 0,
      trend: null,
    },
    statusBreakdown: [],
  }
}
