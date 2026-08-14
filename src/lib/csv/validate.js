import { parseCsv } from './parse.js'
import { mapColumns, REQUIRED_FIELDS } from './columns.js'

/**
 * Per-file validation + normalization.
 *
 * Pipeline: parse → map columns → normalize rows → detect month
 *           → validate employee ids → dedupe by (id|name|date).
 *
 * Produces a structured result the UI renders directly. "errors" are fatal
 * (the file can't be processed); "warnings" are shown but don't block.
 */

/** Build an issue object. */
function issue(code, message, sampleRows = []) {
  return { code, message, sampleRows }
}

/** Parse "H:MM" / "HH:MM" / blank into minutes-since-midnight (null if blank/invalid). */
function timeToMinutes(value) {
  if (!value) return null
  const m = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/**
 * Validate a single CSV file's text content.
 *
 * @param {string} text
 * @param {{ name?: string, size?: number }} fileMeta
 * @returns {import('./types.js').ValidationResult}
 */
export function validateFile(text, fileMeta = {}) {
  const errors = []
  const warnings = []

  // --- 1. Parse -----------------------------------------------------------
  const { headers, rows } = parseCsv(text)

  if (headers.length === 0 || rows.length === 0) {
    errors.push(issue('empty_file', 'The file is empty or contains no data rows.'))
    return resultShell(fileMeta, { errors, warnings })
  }

  // --- 2. Column mapping --------------------------------------------------
  const { map, missing, recognized } = mapColumns(headers)

  if (missing.length > 0) {
    const list = missing
      .map((f) => {
        // Surface a human-friendly column name in the message.
        const display = REQUIRED_FIELD_LABELS[f] ?? f
        return display
      })
      .join(', ')
    errors.push(
      issue(
        'missing_columns',
        `Missing required column${missing.length > 1 ? 's' : ''}: ${list}`,
      ),
    )
    // Without required columns we can't normalize meaningfully.
    return resultShell(fileMeta, {
      errors,
      warnings,
      columns: { recognized, missing },
      rowCount: rows.length,
    })
  }

  // --- 3. Row normalization ----------------------------------------------
  const records = []
  let badDateCount = 0

  for (const row of rows) {
    const get = (field) => (field in map ? row[map[field]] ?? '' : '')

    const rawDate = get('date')
    const parsedDate = normalizeDate(rawDate)
    if (rawDate && !parsedDate) badDateCount++

    const clockInRaw = get('clockIn')
    const clockOutRaw = get('clockOut')

    records.push({
      name: get('name'),
      employeeId: get('employeeId'),
      department: get('department'),
      position: get('position'),
      date: parsedDate, // ISO YYYY-MM-DD or null
      month: parsedDate ? parsedDate.slice(0, 7) : null, // YYYY-MM
      weekday: get('weekday'),
      clockIn: clockInRaw || null,
      clockOut: clockOutRaw || null,
      clockInMinutes: timeToMinutes(clockInRaw),
      clockOutMinutes: timeToMinutes(clockOutRaw),
      totalHours: get('totalHours') || null,
      perks: get('perks') || null,
    })
  }

  if (badDateCount > 0) {
    warnings.push(
      issue(
        'bad_dates',
        `${badDateCount} record${badDateCount > 1 ? 's have' : ' has'} an unparseable date and will be skipped.`,
      ),
    )
  }

  // --- 4. Month detection (from Date column, NOT filename) ----------------
  const monthSet = new Set(
    records.filter((r) => r.month).map((r) => r.month),
  )
  const months = [...monthSet].sort()

  let detectedMonth = null
  if (months.length === 0) {
    errors.push(issue('no_dates', 'No valid dates found in the Date column.'))
  } else if (months.length > 1) {
    errors.push(
      issue(
        'multiple_months',
        `File contains multiple months: ${months.join(', ')}. Each file must contain a single month.`,
      ),
    )
  } else {
    detectedMonth = months[0]
  }

  // --- 5. Employee ID validation -----------------------------------------
  const missingId = records.filter((r) => !r.employeeId).length
  if (missingId > 0) {
    warnings.push(
      issue(
        'missing_employee_id',
        `${missingId} record${missingId > 1 ? 's are' : ' is'} missing an Employee ID.`,
      ),
    )
  }

  // --- 6. Duplicate detection (key = employeeId|name|date) ----------------
  let duplicateCount = 0
  const deduped = []
  const seen = new Set()
  for (const r of records) {
    if (!r.date) {
      // Keep undated records through (they're warned about above) but don't
      // dedupe them since the key requires a date.
      deduped.push(r)
      continue
    }
    const key = `${r.employeeId}|${r.name}|${r.date}`
    if (seen.has(key)) {
      duplicateCount++
    } else {
      seen.add(key)
      deduped.push(r)
    }
  }

  if (duplicateCount > 0) {
    warnings.push(
      issue(
        'duplicates',
        `${duplicateCount} duplicate attendance record${duplicateCount > 1 ? 's' : ''} detected and merged.`,
      ),
    )
  }

  // --- Assemble -----------------------------------------------------------
  const hasFatal = errors.length > 0

  const dateSpan = deduped
    .filter((r) => r.date)
    .reduce(
      (acc, r) => ({
        min: acc.min ? (r.date < acc.min ? r.date : acc.min) : r.date,
        max: acc.max ? (r.date > acc.max ? r.date : acc.max) : r.date,
      }),
      { min: null, max: null },
    )

  return {
    ok: !hasFatal,
    file: { name: fileMeta.name ?? 'unknown', size: fileMeta.size ?? 0 },
    rowCount: rows.length,
    columns: { recognized, missing },
    month: detectedMonth,
    dateSpan,
    records: hasFatal ? [] : deduped,
    duplicates: duplicateCount,
    errors,
    warnings,
  }
}

/** Friendly column names for error messages. */
const REQUIRED_FIELD_LABELS = {
  name: 'Employee Name',
  employeeId: 'Employee ID',
  department: 'Department',
  date: 'Date',
}

/** Normalize a date value to ISO YYYY-MM-DD, or null if unparseable. */
function normalizeDate(value) {
  if (!value) return null
  const v = value.trim()

  // Already ISO: 2026-07-01
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  // DD/MM/YYYY or MM/DD/YYYY — assume DD/MM/YYYY (non-US locale) when first > 12.
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    let [d, mo] = [Number(m[1]), Number(m[2])]
    if (d > 12) {
      // first part must be day
    } else if (mo > 12) {
      ;[d, mo] = [mo, d]
    }
    return `${m[3]}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  return null
}

/** Shorthand to build a fatal-error shell early in the pipeline. */
function resultShell(fileMeta, { errors, warnings, columns, rowCount } = {}) {
  return {
    ok: false,
    file: { name: fileMeta.name ?? 'unknown', size: fileMeta.size ?? 0 },
    rowCount: rowCount ?? 0,
    columns: columns ?? { recognized: [], missing: [] },
    month: null,
    dateSpan: { min: null, max: null },
    records: [],
    duplicates: 0,
    errors,
    warnings,
  }
}

export default validateFile
