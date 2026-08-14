/**
 * Attendance engine configuration.
 *
 * All rules are data-driven so Phase 12 (Settings) can override them without
 * touching engine code. See doc Phase 3 + the decisions in memory.
 */

/**
 * Default attendance rules.
 * Times are in minutes since midnight.
 *   10:00 AM = 600,  7:00 PM = 1140
 */
export const DEFAULT_RULES = {
  // Time rules
  onTimeCutoff: 600, // Clock In <= 10:00 AM → On Time
  earlyLeaveCutoff: 1140, // Clock Out < 7:00 PM → Early Leave

  // Weekend detection
  weekendDays: [5, 6], // JS getDay(): 5 = Friday, 6 = Saturday

  // Late detection threshold for Phase 5 flagging
  highLateThreshold: 50, // Late % > 50 → flagged

  // Departments never flagged for Needs Review regardless of late rate.
  // Values are matched case-insensitively (trim + lowercase).
  reviewExcludedDepartments: ['bkash', 'exabyting remote'],

  // How a department is categorized when an employee has NO clock-in on a
  // working day. See DEPARTMENT_CATEGORIES below.
}

/**
 * Map raw department strings to a canonical category, and define what
 * "no clock-in on a working day" means for each category.
 *
 *   absent    → counts as Absent
 *   noRecord  → counts as No Attendance Record
 *
 * Departments not listed here default to 'absent' (safest assumption for
 * an unconfigured office department). Add mappings in Settings (Phase 12).
 */
export const DEPARTMENT_CATEGORIES = {
  // bKash → No Record
  bKash: { category: 'bKash', missingClockIn: 'noRecord' },

  // Exabyting Office and bare "Exabyting" → Absent
  'Exabyting Office': { category: 'Exabyting Office', missingClockIn: 'absent' },
  Exabyting: { category: 'Exabyting Office', missingClockIn: 'absent' },

  // Exabyting Remote → No Record
  'Exabyting Remote': { category: 'Exabyting Remote', missingClockIn: 'noRecord' },

  // Support Staff (incl. sub-types like "Support Staff Cleaner") → Absent
  'Support Staff': { category: 'Support Staff', missingClockIn: 'absent' },
}

/** Full weekday names that mean "weekend". Matches the Weekday CSV column. */
export const WEEKEND_NAMES = ['Friday', 'Saturday']

export default DEFAULT_RULES
