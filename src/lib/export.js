/**
 * CSV export helpers (doc Phase 11).
 *
 * toCsv serializes a headers[] + rows[][] into RFC-4180-ish CSV text; the
 * records pages use it to export the *currently filtered* data, and the
 * employee review modal uses it to build a full per-employee report.
 */

/** Escape a single cell for CSV (quote when it contains , " or line breaks). */
export function escapeCell(value) {
  const str = value == null ? '' : String(value)
  if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"'
  return str
}

/**
 * Serialize headers + rows to CSV text (CRLF line endings).
 * @param {string[]} headers
 * @param {Array<Array<any>>} rows
 */
export function toCsv(headers, rows) {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCell).join(','),
  )
  return lines.join('\r\n')
}

/** Trigger a browser download of a CSV string. */
export function downloadCsv(filename, csv) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Build a safe, slug-ish download filename, e.g. "John Smith" → "john-smith". */
export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export default { toCsv, downloadCsv, slugify }