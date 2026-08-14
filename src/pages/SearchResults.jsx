import { useMemo } from 'react'
import { Users, SearchX, UploadCloud, CalendarCheck2 } from 'lucide-react'

import { Card, Table, Badge, EmptyState } from '../components/ui'
import { formatMonth } from '../lib/csv'
import { statusToTone } from '../lib/statusTone'
import { useAttendance } from '../store/attendanceContext'

/**
 * Search Results — global search destination (doc header search).
 *
 * The header search box submits a query that lands here: every employee whose
 * name or employee ID matches is shown with their attendance percentages and
 * a table of all their daily records.
 *
 * Props:
 *   query: the submitted search string
 */
export function SearchResults({ query }) {
  const { status, report } = useAttendance()

  const q = (query ?? '').trim().toLowerCase()

  const matches = useMemo(() => {
    if (!report || !q) return []
    const { employees, summaries, records, flaggedEmployees } = report
    const flaggedIds = new Set(flaggedEmployees.map((e) => e.employeeId))

    const matched = employees.filter(
      (e) =>
        `${e.name} ${e.employeeId}`.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q),
    )
    if (!matched.length) return []

    const summaryByKey = new Map()
    for (const s of summaries) {
      const key = `${s.employeeId}\u0000${s.name}`
      if (!summaryByKey.has(key)) summaryByKey.set(key, [])
      summaryByKey.get(key).push(s)
    }

    return matched.map((emp) => {
      const key = `${emp.employeeId}\u0000${emp.name}`
      const empSummaries = summaryByKey.get(key) ?? []
      const empRecords = records.filter(
        (r) => r.employeeId === emp.employeeId && r.name === emp.name,
      )
      return {
        ...emp,
        flagged: flaggedIds.has(emp.employeeId),
        summaries: empSummaries,
        records: [...empRecords].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
      }
    })
  }, [report, q])

  if (status !== 'ready' || !report) {
    return (
      <EmptyState
        icon={UploadCloud}
        title="No attendance data yet"
        description="Upload your monthly attendance CSV files to search employees."
      />
    )
  }

  if (!q) {
    return (
      <EmptyState
        icon={Users}
        title="Search employees"
        description="Type a name or employee ID in the search box at the top and press Enter to see their records and percentages."
      />
    )
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No employees match your search"
        description={`Nothing found for "${query.trim()}". Try a different name or employee ID.`}
      />
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        {matches.length} employee{matches.length > 1 ? 's' : ''} match{' '}
        <span className="font-medium text-ink-soft">"{query.trim()}"</span>
      </p>

      {matches.map((emp) => (
        <EmployeeResult key={emp.employeeId} emp={emp} />
      ))}
    </div>
  )
}

function EmployeeResult({ emp }) {
  const { summaries, records } = emp

  // Overall percentages across all months (summed raw counts, same formulas
  // the engine uses per month).
  const total = summaries.reduce(
    (a, s) => ({
      present: a.present + s.present,
      absent: a.absent + s.absent,
      late: a.late + s.late,
      earlyLeave: a.earlyLeave + s.earlyLeave,
      scheduled: a.scheduled + s.scheduledWorkingDays,
      lateMin: a.lateMin + s.totalLateMinutes,
    }),
    { present: 0, absent: 0, late: 0, earlyLeave: 0, scheduled: 0, lateMin: 0 },
  )
  const expected = total.present + total.absent
  const attendancePct = expected ? Math.round((total.present / expected) * 1000) / 10 : 0
  const latePct = expected ? Math.round((total.late / expected) * 1000) / 10 : 0
  const earlyLeavePct = total.present
    ? Math.round((total.earlyLeave / total.present) * 1000) / 10
    : 0

  return (
    <Card>
      <Card.Header>
        <div className="min-w-0">
          <Card.Title>
            <span className="flex items-center gap-2">
              {emp.name}
              {emp.flagged && <Badge tone="danger">Needs review</Badge>}
            </span>
          </Card.Title>
          <p className="mt-0.5 text-xs text-ink-muted">
            {emp.employeeId}
            {emp.department ? ` · ${emp.department}` : ''}
            {emp.position ? ` · ${emp.position}` : ''}
            {' · '}
            {emp.records.length.toLocaleString()} records
            {' · '}
            {emp.summaries.length > 0
              ? emp.summaries.map((s) => formatMonth(s.month)).join(' + ')
              : 'no summaries'}
          </p>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Percentage summary */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PctChip
            label="Attendance"
            value={`${attendancePct}%`}
            sub={`${total.present} present / ${expected} scheduled`}
            tone={attendancePct >= 80 ? 'success' : attendancePct >= 60 ? 'warning' : 'danger'}
          />
          <PctChip
            label="Late rate"
            value={`${latePct}%`}
            sub={`${total.late} late day${total.late === 1 ? '' : 's'} · ${total.lateMin}m total`}
            tone={latePct > 50 ? 'danger' : latePct > 25 ? 'warning' : 'success'}
          />
          <PctChip
            label="Early leave"
            value={`${earlyLeavePct}%`}
            sub={`${total.earlyLeave} of ${total.present} present days`}
            tone={earlyLeavePct > 25 ? 'danger' : earlyLeavePct > 10 ? 'warning' : 'success'}
          />
        </div>

        {/* Daily records */}
        {records.length > 0 ? (
          <Table>
            <Table.Head>
              <Table.Row hoverable={false}>
                <Table.Th>Date</Table.Th>
                <Table.Th align="right">Clock In</Table.Th>
                <Table.Th align="right">Clock Out</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Late min</Table.Th>
                <Table.Th align="right">Early leave</Table.Th>
                <Table.Th align="right">Hours</Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {records.map((r) => (
                <Table.Row key={`${r.date}-${r.clockIn ?? r.clockOut}`}>
                  <Table.Td className="whitespace-nowrap">
                    <span className="font-medium text-ink">{r.date}</span>
                    <span className="ml-2 text-xs text-ink-faint">{r.weekday}</span>
                  </Table.Td>
                  <Table.Td align="right">{r.clockIn ?? '—'}</Table.Td>
                  <Table.Td align="right">{r.clockOut ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge tone={statusToTone(r.attendanceStatus)} dot>
                      {r.attendanceStatus}
                    </Badge>
                  </Table.Td>
                  <Table.Td align="right">
                    {r.isLate ? (
                      <span className="font-medium text-amber-600">{r.lateMinutes}m</span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </Table.Td>
                  <Table.Td align="right">
                    {r.isEarlyLeave ? (
                      <span className="font-medium text-violet-600">Yes</span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </Table.Td>
                  <Table.Td align="right">{r.workedHours ?? '—'}</Table.Td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <EmptyState
            icon={CalendarCheck2}
            title="No records found for this employee"
            className="py-10"
          />
        )}
      </Card.Body>
    </Card>
  )
}

function PctChip({ label, value, sub, tone }) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-surface-subtle p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{sub}</p>
    </div>
  )
}

export default SearchResults