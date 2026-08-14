/**
 * Flexible CSV column mapping.
 *
 * The attendance files use misleading headers — e.g. "First Name" holds the
 * full name, "Last Name"/"Employee ID" holds the ID — and the two months have
 * different columns (July has an extra "Perks" column). Rather than trusting
 * header text, we match each header against a set of known aliases and map it
 * to a canonical field.
 */

// Canonical field → list of acceptable header aliases (lowercased, trimmed).
export const COLUMN_ALIASES = {
  name: ['first name', 'name', 'employee name', 'full name', 'employee'],
  employeeId: ['last name', 'employee id', 'id', 'emp id', 'employee code'],
  department: ['department', 'dept'],
  position: ['position', 'designation', 'title', 'role'],
  date: ['date', 'attendance date'],
  weekday: ['weekday', 'day', 'day of week'],
  clockIn: ['clock in', 'in time', 'check in', 'checkin', 'punch in', 'in'],
  clockOut: ['clock out', 'out time', 'check out', 'checkout', 'punch out', 'out'],
  totalHours: ['total hours', 'hours', 'working hours', 'duration'],
  perks: ['perks', 'transport', 'transport type', 'commute'],
}

// Fields the parser must find or the file is rejected.
export const REQUIRED_FIELDS = ['name', 'employeeId', 'department', 'date']

/**
 * Map raw header strings to canonical fields.
 *
 * @param {string[]} headers
 * @returns {{
 *   map: Record<string, number>,   // canonical field → column index
 *   missing: string[],              // required fields not found (fatal)
 *   missingOptional: string[],      // optional fields not found (informational)
 *   recognized: { field: string, header: string, index: number }[]
 * }}
 */
export function mapColumns(headers) {
  const normalized = headers.map((h) => h.toLowerCase().trim())

  const map = {}
  const recognized = []

  normalized.forEach((header, index) => {
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(header)) {
        // First match wins; ignore duplicate columns for the same field.
        if (!(field in map)) {
          map[field] = index
          recognized.push({ field, header: headers[index], index })
        }
        break
      }
    }
  })

  const missing = REQUIRED_FIELDS.filter((f) => !(f in map))
  const missingOptional = Object.keys(COLUMN_ALIASES)
    .filter((f) => !REQUIRED_FIELDS.includes(f) && !(f in map))

  return { map, missing, missingOptional, recognized }
}

export default mapColumns
