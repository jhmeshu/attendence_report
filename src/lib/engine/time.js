/**
 * Time-rule helpers for the attendance engine.
 *
 * All inputs are minutes-since-midnight (already parsed from HH:MM in Phase 2).
 * Cutoffs come from the rule config.
 */

/**
 * Determine arrival status from clock-in time.
 * @param {number|null} clockInMinutes - minutes since midnight, or null if no clock-in
 * @param {number} onTimeCutoff - minutes (default 600 = 10:00 AM)
 * @returns {{ isLate: boolean, arrivalStatus: 'On Time'|'Late'|null }}
 */
export function evaluateArrival(clockInMinutes, onTimeCutoff) {
  if (clockInMinutes == null) {
    return { isLate: false, arrivalStatus: null }
  }
  if (clockInMinutes > onTimeCutoff) {
    return { isLate: true, arrivalStatus: 'Late' }
  }
  return { isLate: false, arrivalStatus: 'On Time' }
}

/**
 * Determine departure status from clock-out time.
 * @param {number|null} clockOutMinutes - minutes since midnight, or null
 * @param {number} earlyLeaveCutoff - minutes (default 1140 = 7:00 PM)
 * @returns {{ isEarlyLeave: boolean, departureStatus: 'On Time'|'Early Leave'|null }}
 */
export function evaluateDeparture(clockOutMinutes, earlyLeaveCutoff) {
  if (clockOutMinutes == null) {
    return { isEarlyLeave: false, departureStatus: null }
  }
  if (clockOutMinutes < earlyLeaveCutoff) {
    return { isEarlyLeave: true, departureStatus: 'Early Leave' }
  }
  return { isEarlyLeave: false, departureStatus: 'On Time' }
}

/**
 * How many minutes late an arrival is. 0 if on-time or no clock-in.
 */
export function lateMinutes(clockInMinutes, onTimeCutoff) {
  if (clockInMinutes == null) return 0
  return Math.max(0, clockInMinutes - onTimeCutoff)
}

/**
 * Total worked minutes from clock-in to clock-out.
 * Handles overnight shifts (clock-out < clock-in → add 24h).
 * Returns null if either punch is missing.
 */
export function workedMinutes(clockInMinutes, clockOutMinutes) {
  if (clockInMinutes == null || clockOutMinutes == null) return null
  let diff = clockOutMinutes - clockInMinutes
  if (diff < 0) diff += 24 * 60 // crossed midnight
  return diff
}

/** Format a minute count as "H:MM". */
export function formatDuration(totalMinutes) {
  if (totalMinutes == null) return null
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}
