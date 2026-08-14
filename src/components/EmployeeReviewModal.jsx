import { useMemo } from 'react'
import { AlertTriangle, CalendarDays, Clock, Download, LogOut } from 'lucide-react'

import { Modal, Badge, Table, Button } from './ui'
import { statusToTone } from '../lib/statusTone'
import { formatMonth } from '../lib/csv'
import { toCsv, downloadCsv, slugify } from '../lib/export'

/**
 * Employee Attendance Review (doc Phase 8).
 *
 * Opens over a flagged employee. Shows:
 *   - high-late warning + employee meta
 *   - month-by-month comparison (May → June → July) from report.comparisons
 *   - full daily attendance history from report.records
 *
 * `comparison` comes from report.comparisons (matched by employeeId+name);
 * `records` is filtered to that employee.
 */
export function EmployeeReviewModal({ open = true, comparison, records, onClose }) {
  const daily = useMemo(() => {
    if (!comparison || !records?.length) return []
    return records
      .filter(
        (r) =>
          r.employeeId === comparison.employeeId &&
          r.name === comparison.name,
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [comparison, records])

  if (!open) return null

  if (!comparison) {
    return (
      <Modal open onClose={onClose} title="Employee Review" size="lg">
        <p className="text-sm text-ink-muted">No review data found for this employee.</p>
      </Modal>
    )
  }

  /** Build + download the full employee report (summary + daily records). */
  const handleExport = () => {
    const meta = [
      ['Employee', comparison.name],
      ['Employee ID', comparison.employeeId],
      ['Department', comparison.department ?? ''],
      ['Position', comparison.position ?? ''],
      ['Reporting Month', formatMonth(comparison.reportingMonth)],
      ['Flag Reason', `High late rate ${comparison.reportingLatePct}%`],
    ]

    const monthlyHeaders = [
      'Month', 'Attendance %', 'Late %', 'Late Days', 'Early Leave',
      'Avg Late (min)', 'Total Hours', 'Avg Hours',
    ]
    const monthlyRows = comparison.monthly.map((m) => [
      formatMonth(m.month),
      m.available ? m.attendancePct : '',
      m.available ? m.latePct : '',
      m.available ? m.late : '',
      m.available ? m.earlyLeave : '',
      m.available ? m.avgLateMinutes : '',
      m.available ? (m.totalWorkedHours ?? '') : '',
      m.available ? (m.avgWorkedHours ?? '') : '',
    ])

    const dailyHeaders = [
      'Date', 'Weekday', 'Status', 'Clock In', 'Clock Out',
      'Late (min)', 'Early Leave', 'Total Hours',
    ]
    const dailyRows = daily.map((r) => [
      r.date,
      r.weekday ?? '',
      r.attendanceStatus ?? '',
      r.clockIn ?? '',
      r.clockOut ?? '',
      r.isLate ? r.lateMinutes : '',
      r.isEarlyLeave ? 'Yes' : '',
      r.workedHours ?? '',
    ])

    const csv = [
      toCsv(['Field', 'Value'], meta),
      '',
      `Monthly Comparison${monthlyRows.length ? '' : ' (no data)'}`,
      toCsv(monthlyHeaders, monthlyRows),
      '',
      `Daily Attendance History (${daily.length} records)`,
      toCsv(dailyHeaders, dailyRows),
    ].join('\r\n')

    downloadCsv(
      `${slugify(comparison.name)}-${comparison.reportingMonth}-review.csv`,
      csv,
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={comparison.name}
      description={comparison.employeeId}
    >
      <div className="max-h-[70vh] space-y-6 overflow-y-auto">
        {/* High-late warning */}
        <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50/60 p-3.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-medium text-red-800">
              High Late Rate: {comparison.reportingLatePct}%
            </p>
            <p className="mt-0.5 text-xs text-red-600">
              {comparison.reportingLateDays} late days across{' '}
              {comparison.reportingScheduledDays} scheduled working days in{' '}
              {formatMonth(comparison.reportingMonth)}.
            </p>
          </div>
        </div>

        {/* Month-by-month comparison */}
        <section className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarDays className="h-4 w-4 text-brand" />
            Month-by-Month Comparison
          </h4>
          <Table>
            <Table.Head>
              <Table.Row hoverable={false}>
                <Table.Th>Month</Table.Th>
                <Table.Th align="right">Attendance</Table.Th>
                <Table.Th align="right">Late %</Table.Th>
                <Table.Th align="right">Late Days</Table.Th>
                <Table.Th align="right">Early Leave</Table.Th>
                <Table.Th align="right">Avg Late</Table.Th>
                <Table.Th align="right">Total Hours</Table.Th>
                <Table.Th align="right">Avg Hours</Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {comparison.monthly.map((m) =>
                m.available ? (
                  <Table.Row key={m.month}>
                    <Table.Td className="font-medium text-ink">
                      {formatMonth(m.month)}
                      {m.month === comparison.reportingMonth && (
                        <Badge tone="danger" size="sm" className="ml-2">
                          Reporting
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td align="right">{m.attendancePct}%</Table.Td>
                    <Table.Td align="right">
                      <Badge
                        tone={m.latePct > 50 ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {m.latePct}%
                      </Badge>
                    </Table.Td>
                    <Table.Td align="right">{m.late}</Table.Td>
                    <Table.Td align="right">{m.earlyLeave}</Table.Td>
                    <Table.Td align="right">
                      {m.avgLateMinutes ? `${m.avgLateMinutes}m` : '0m'}
                    </Table.Td>
                    <Table.Td align="right">{m.totalWorkedHours ?? '—'}</Table.Td>
                    <Table.Td align="right">{m.avgWorkedHours ?? '—'}</Table.Td>
                  </Table.Row>
                ) : (
                  <Table.Row key={m.month} className="opacity-50">
                    <Table.Td className="font-medium text-ink-soft">
                      {formatMonth(m.month)}
                    </Table.Td>
                    <Table.Td align="right" colSpan={7} className="text-ink-faint">
                      — no records —
                    </Table.Td>
                  </Table.Row>
                ),
              )}
            </Table.Body>
          </Table>
        </section>

        {/* Daily attendance history */}
        <section className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock className="h-4 w-4 text-brand" />
              Daily Attendance History
            </h4>
            <span className="text-xs text-ink-faint">{daily.length} records</span>
          </div>

          {daily.length === 0 ? (
            <p className="rounded-lg bg-surface-muted px-4 py-6 text-center text-sm text-ink-muted">
              No daily attendance records found.
            </p>
          ) : (
            <Table>
              <Table.Head>
                <Table.Row hoverable={false}>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Day</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Clock In</Table.Th>
                  <Table.Th>Clock Out</Table.Th>
                  <Table.Th>Late</Table.Th>
                  <Table.Th>Early Leave</Table.Th>
                  <Table.Th align="right">Hours</Table.Th>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {daily.map((r) => (
                  <Table.Row key={`${r.employeeId}-${r.date}`}>
                    <Table.Td className="whitespace-nowrap font-medium text-ink">
                      {r.date}
                    </Table.Td>
                    <Table.Td className="capitalize text-ink-muted">
                      {r.weekday ?? '—'}
                    </Table.Td>
                    <Table.Td>
                      <Badge tone={statusToTone(r.attendanceStatus)} dot>
                        {r.attendanceStatus}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{r.clockIn ?? '—'}</Table.Td>
                    <Table.Td>{r.clockOut ?? '—'}</Table.Td>
                    <Table.Td>
                      {r.isLate ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Clock className="h-3.5 w-3.5" />
                          {r.lateMinutes}m
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {r.isEarlyLeave ? (
                        <span className="inline-flex items-center gap-1 text-violet-600">
                          <LogOut className="h-3.5 w-3.5" />
                          Early
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </Table.Td>
                    <Table.Td align="right">{r.workedHours ?? '—'}</Table.Td>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" leftIcon={Download} onClick={handleExport}>
            Export Report
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EmployeeReviewModal