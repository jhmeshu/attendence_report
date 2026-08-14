import { processRecord } from './processRecord.js'
import { DEFAULT_RULES, WEEKEND_NAMES } from './config.js'

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
    _weekendNames: WEEKEND_NAMES,
    ...ruleOverrides,
  }

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
