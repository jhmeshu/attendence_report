import {
  evaluateArrival,
  evaluateDeparture,
  lateMinutes,
  workedMinutes,
  formatDuration,
} from './time.js'
import { DEPARTMENT_CATEGORIES } from './config.js'

/**
 * The engine's central decision: classify a single normalized attendance record.
 *
 * Rules (see doc Phase 3 + memory [[engine-rules]]):
 *
 *  WEEKEND (Friday/Saturday):
 *    - has clock-in → Weekend Work (present, no penalty)
 *    - no clock-in  → Weekend (a non-working day; neither present nor absent)
 *
 *  WORKING DAY (Sun–Thu):
 *    - has clock-in → Present, plus arrival/departure evaluation
 *    - no clock-in  → depends on department category:
 *        bKash / Exabyting Remote → No Record
 *        Exabyting Office / Exabyting / Support Staff → Absent
 *
 * @param {object} record - NormalizedRecord from Phase 2
 * @param {object} rules - merged rule config
 * @returns {object} the record enriched with calculated fields
 */
export function processRecord(record, rules) {
  const hasClockIn = record.clockInMinutes != null
  const isWeekend = isWeekendDay(record, rules)

  // Default calculated fields.
  const out = {
    ...record,
    isWeekend,
    isWeekendWork: false,
    isLate: false,
    isEarlyLeave: false,
    isPresent: false,
    isAbsent: false,
    isNoRecord: false,
    lateMinutes: 0,
    workedMinutes: null,
    workedHours: null,
    attendanceStatus: null,
    arrivalStatus: null,
    departureStatus: null,
  }

  // --- Weekend ------------------------------------------------------------
  if (isWeekend) {
    if (hasClockIn) {
      out.isWeekendWork = true
      out.isPresent = true
      out.attendanceStatus = 'Weekend Work'
      // Still evaluate arrival/departure for informational purposes.
      const arrival = evaluateArrival(record.clockInMinutes, rules.onTimeCutoff)
      out.arrivalStatus = arrival.arrivalStatus
      out.isLate = arrival.isLate
      out.lateMinutes = lateMinutes(record.clockInMinutes, rules.onTimeCutoff)
      const dep = evaluateDeparture(record.clockOutMinutes, rules.earlyLeaveCutoff)
      out.departureStatus = dep.departureStatus
      out.isEarlyLeave = dep.isEarlyLeave
      out.workedMinutes = workedMinutes(record.clockInMinutes, record.clockOutMinutes)
      out.workedHours = formatDuration(out.workedMinutes)
    } else {
      // A rest day with no work. Not counted in any denominator.
      out.attendanceStatus = 'Weekend'
    }
    return out
  }

  // --- Working day, has clock-in → Present --------------------------------
  if (hasClockIn) {
    out.isPresent = true
    out.attendanceStatus = 'Present'

    const arrival = evaluateArrival(record.clockInMinutes, rules.onTimeCutoff)
    out.arrivalStatus = arrival.arrivalStatus
    out.isLate = arrival.isLate
    out.lateMinutes = lateMinutes(record.clockInMinutes, rules.onTimeCutoff)

    const dep = evaluateDeparture(record.clockOutMinutes, rules.earlyLeaveCutoff)
    out.departureStatus = dep.departureStatus
    out.isEarlyLeave = dep.isEarlyLeave

    out.workedMinutes = workedMinutes(record.clockInMinutes, record.clockOutMinutes)
    out.workedHours = formatDuration(out.workedMinutes)
    return out
  }

  // --- Working day, no clock-in → department-driven -----------------------
  const category = categorizeDepartment(record.department)
  if (category === 'noRecord') {
    out.isNoRecord = true
    out.attendanceStatus = 'No Record'
  } else {
    // 'absent' is the default for any configured/unconfigured office dept.
    out.isAbsent = true
    out.attendanceStatus = 'Absent'
  }

  return out
}

/**
 * Is this record on a weekend? Prefer the Weekday column (already present in
 * the data); fall back to deriving from the ISO date.
 */
function isWeekendDay(record, rules) {
  if (record.weekday) {
    return rules._weekendNames?.includes(record.weekday) ?? false
  }
  if (record.date) {
    const d = new Date(record.date + 'T00:00:00')
    return rules.weekendDays.includes(d.getDay())
  }
  return false
}

/**
 * Resolve a department string to its missing-clock-in behavior.
 * Returns 'absent' | 'noRecord'. Supports sub-type matching for values
 * like "Support Staff Cleaner" → Support Staff category.
 */
function categorizeDepartment(department) {
  if (!department) return 'absent'

  // Exact match first.
  if (DEPARTMENT_CATEGORIES[department]) {
    return DEPARTMENT_CATEGORIES[department].missingClockIn
  }

  // Prefix/contains match for sub-types (e.g. "Support Staff Cleaner").
  const asCategory = Object.entries(DEPARTMENT_CATEGORIES).find(
    ([key]) => department.startsWith(key) || department.includes(key),
  )
  if (asCategory) {
    return asCategory[1].missingClockIn
  }

  // Unknown department → safest default is Absent.
  return 'absent'
}

export default processRecord
