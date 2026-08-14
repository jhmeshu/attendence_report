/**
 * Minimal dependency-free CSV parser.
 *
 * The attendance files have no quoted fields, but we handle quotes
 * and embedded newlines/commas defensively so the parser is robust
 * to slightly different exports in the future.
 *
 * @param {string} text — raw CSV file contents
 * @returns {{ headers: string[], rows: string[][] }}
 */
export function parseCsv(text) {
  // Normalize line endings; strip a leading BOM if present.
  const src = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const rows = []
  let field = ''
  let row = []
  let inQuotes = false

  for (let i = 0; i < src.length; i++) {
    const char = src[i]

    if (inQuotes) {
      if (char === '"') {
        // Doubled quote inside a quoted field → literal quote.
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  // Flush the last field/row if the file didn't end with a newline
  // (and only if there's actually pending content).
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  // Drop fully-empty trailing rows (common from a final blank line).
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''))

  if (nonEmpty.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = nonEmpty[0].map((h) => h.trim())
  const dataRows = nonEmpty.slice(1).map((r) => r.map((c) => c.trim()))

  return { headers, rows: dataRows }
}

export default parseCsv
