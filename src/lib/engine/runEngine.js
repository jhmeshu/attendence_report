import { processRecord } from './processRecord.js'
import { DEFAULT_RULES } from './config.js'

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

/**
 * Run the attendance engine over a full dataset.
 *
 * Takes the normalized records from Phase 2 and returns each record enriched
 * with calculated status fields (Phase 3). This is the engine independent of
 * the UI — Phase 4 aggregates these into per-employee/month summaries.
 *
 * @param {object[]} records - NormalizedRecord[] from the attendance store
 * @param {object} [ruleOverrides] - partial overrides merged onto DEFAULT_RULES
 * @returns {{ records: object[], rules: object, counts: object }}
 */
export function runEngine(records, ruleOverrides = {}) {
  const rules = {
    ...DEFAULT_RULES,
    ...ruleOverrides,
  }

  // The Weekday column uses names ("Friday"), so derive the name set from the
  // numeric weekendDays config. Keeps both the weekday-name and date fallback
  // paths consistent when Settings (Phase 12) changes the weekend.
  rules._weekendNames = (rules.weekendDays ?? DEFAULT_RULES.weekendDays)
    .map((n) => DAY_NAMES[n])
    .filter(Boolean)

  const processed = records.map((r) => processRecord(r, rules))

  const counts = tallyStatuses(processed)

  return { records: processed, rules, counts }
}

/** Count records by status — a quick sanity check / debug aid. */
function tallyStatuses(records) {
  const counts = {
    Present: 0,
    Absent: 0,
    'No Record': 0,
    'Weekend Work': 0,
    Weekend: 0,
    late: 0,
    earlyLeave: 0,
  }
  for (const r of records) {
    if (r.attendanceStatus in counts) counts[r.attendanceStatus]++
    if (r.isLate) counts.late++
    if (r.isEarlyLeave) counts.earlyLeave++
  }
  return counts
}

export default runEngine
