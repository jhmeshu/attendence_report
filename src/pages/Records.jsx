import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  X,
  UploadCloud,
  FilterX,
  Download,
} from 'lucide-react'

import { Card, Table, Badge, Button, EmptyState } from '../components/ui'
import { statusToTone } from '../lib/statusTone'
import { formatMonth } from '../lib/csv'
import { toCsv, downloadCsv } from '../lib/export'
import { useAttendance } from '../store/attendanceContext'

const PAGE_SIZES = [25, 50, 100, 250]

const SORT_FIELDS = {
  name: { label: 'Employee' },
  employeeId: { label: 'Employee ID' },
  date: { label: 'Date' },
  clockIn: { label: 'Clock In' },
  clockOut: { label: 'Clock Out' },
  status: { label: 'Status' },
  late: { label: 'Late' },
  earlyLeave: { label: 'Early Leave' },
  hours: { label: 'Hours' },
}

/** Value extractor per sort key. Missing punches sort last. */
function sortValue(r, key) {
  switch (key) {
    case 'name':
      return r.name.toLowerCase()
    case 'employeeId':
      return r.employeeId
    case 'date':
      return r.date
    case 'clockIn':
      return r.clockInMinutes ?? -1
    case 'clockOut':
      return r.clockOutMinutes ?? -1
    case 'status':
      return r.attendanceStatus ?? ''
    case 'late':
      return r.isLate ? 1 : 0
    case 'earlyLeave':
      return r.isEarlyLeave ? 1 : 0
    case 'hours':
      return r.workedMinutes ?? -1
    default:
      return r.date
  }
}

/**
 * Detailed attendance table (doc Phase 10).
 *
 * Search, sort, filter (month / status / late / early-leave) and pagination
 * over the full daily log. Reads from the store's processed records.
 */
export function Records() {
  const { status, report } = useAttendance()

  const [query, setQuery] = useState('')
  const [month, setMonth] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lateOnly, setLateOnly] = useState(false)
  const [earlyOnly, setEarlyOnly] = useState(false)
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Available statuses across the dataset, for the filter dropdown.
  const statusOptions = useMemo(() => {
    const set = new Set()
    for (const r of report?.records ?? []) {
      if (r.attendanceStatus) set.add(r.attendanceStatus)
    }
    return [...set].sort()
  }, [report])

  // Reset to the reporting month whenever a fresh dataset is loaded.
  useEffect(() => {
    if (report?.reportingMonth) {
      setMonth(report.reportingMonth)
      setPage(1)
    }
  }, [report])

  const filtered = useMemo(() => {
    let list = report?.records ?? []

    if (month !== 'all') list = list.filter((r) => r.month === month)
    if (statusFilter !== 'all')
      list = list.filter((r) => r.attendanceStatus === statusFilter)
    if (lateOnly) list = list.filter((r) => r.isLate)
    if (earlyOnly) list = list.filter((r) => r.isEarlyLeave)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          `${r.name} ${r.employeeId}`.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q),
      )
    }
    return list
  }, [report, month, statusFilter, lateOnly, earlyOnly, query])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1)
  }, [query, month, statusFilter, lateOnly, earlyOnly, pageSize, sortKey, sortDir])

  const hasFilters =
    query.trim() ||
    month !== 'all' ||
    statusFilter !== 'all' ||
    lateOnly ||
    earlyOnly

  const clearFilters = () => {
    setQuery('')
    setMonth(report?.reportingMonth ?? 'all')
    setStatusFilter('all')
    setLateOnly(false)
    setEarlyOnly(false)
  }

  /** Export the currently filtered+sorted rows (doc Phase 11). */
  const handleExport = () => {
    const headers = [
      'Employee', 'Employee ID', 'Department', 'Date', 'Weekday',
      'Clock In', 'Clock Out', 'Status', 'Late Minutes', 'Early Leave', 'Total Hours',
    ]
    const rows = sorted.map((r) => [
      r.name,
      r.employeeId,
      r.department,
      r.date,
      r.weekday ?? '',
      r.clockIn ?? '',
      r.clockOut ?? '',
      r.attendanceStatus ?? '',
      r.isLate ? r.lateMinutes : '',
      r.isEarlyLeave ? 'Yes' : '',
      r.workedHours ?? '',
    ])
    const monthTag = month === 'all' ? 'all-months' : month
    downloadCsv(`attendance-records-${monthTag}.csv`, toCsv(headers, rows))
  }

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  if (status !== 'ready' || !report) {
    return (
      <EmptyState
        icon={UploadCloud}
        title="No attendance data yet"
        description="Upload your monthly attendance CSV files to see the detailed daily log."
      />
    )
  }

  const rangeStart = sorted.length ? (safePage - 1) * pageSize + 1 : 0
  const rangeEnd = Math.min(safePage * pageSize, sorted.length)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or employee ID…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-surface pl-9 pr-9 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-100"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-faint hover:text-ink-soft"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="all">All months</option>
              {report.months.map((m) => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <ToggleChip
              active={lateOnly}
              onClick={() => setLateOnly((v) => !v)}
              tone="amber"
            >
              Late only
            </ToggleChip>
            <ToggleChip
              active={earlyOnly}
              onClick={() => setEarlyOnly((v) => !v)}
              tone="violet"
            >
              Early leave only
            </ToggleChip>

            {hasFilters && (
              <Button variant="ghost" size="sm" leftIcon={FilterX} onClick={clearFilters}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Card.Header>
          <div>
            <Card.Title>Daily Attendance Records</Card.Title>
            <p className="mt-0.5 text-xs text-ink-muted">
              {sorted.length.toLocaleString()} records
              {month !== 'all' ? ` · ${formatMonth(month)}` : ''}
            </p>
          </div>
          {sorted.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge tone="info">{safePage} / {pageCount}</Badge>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Download}
                onClick={handleExport}
              >
                Export CSV
              </Button>
            </div>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {sorted.length === 0 ? (
            <div className="p-10">
              <EmptyState
                title="No attendance records match your filters"
                description="Try clearing the search or selecting a different month."
              />
            </div>
          ) : (
            <>
              <Table>
                <Table.Head>
                  <Table.Row hoverable={false}>
                    {Object.entries(SORT_FIELDS).map(([key, { label }]) => (
                      <SortableTh
                        key={key}
                        label={label}
                        active={key === sortKey}
                        dir={key === sortKey ? sortDir : null}
                        onClick={() => toggleSort(key)}
                        align={key === 'name' || key === 'employeeId' ? 'left' : 'right'}
                      />
                    ))}
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {paged.map((r) => (
                    <Table.Row key={`${r.employeeId}-${r.date}-${r.clockIn ?? r.clockOut}`}>
                      <Table.Td className="font-medium text-ink">{r.name}</Table.Td>
                      <Table.Td>
                        <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-ink-soft">
                          {r.employeeId}
                        </code>
                      </Table.Td>
                      <Table.Td align="right" className="whitespace-nowrap">
                        {r.date}
                      </Table.Td>
                      <Table.Td align="right">{r.clockIn ?? '—'}</Table.Td>
                      <Table.Td align="right">{r.clockOut ?? '—'}</Table.Td>
                      <Table.Td align="right">
                        <Badge tone={statusToTone(r.attendanceStatus)} dot>
                          {r.attendanceStatus}
                        </Badge>
                      </Table.Td>
                      <Table.Td align="right">
                        {r.isLate ? (
                          <span className="font-medium text-amber-600">
                            {r.lateMinutes}m
                          </span>
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

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row">
                <p className="text-xs text-ink-muted">
                  Showing{' '}
                  <span className="font-medium text-ink-soft">
                    {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
                  </span>{' '}
                  of <span className="font-medium text-ink-soft">{sorted.length.toLocaleString()}</span>
                </p>

                <div className="flex items-center gap-3">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 rounded-lg border border-slate-200 bg-surface px-2 text-xs text-ink outline-none focus:border-brand"
                    aria-label="Rows per page"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      disabled={safePage <= 1}
                      onClick={() => setPage(safePage - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 text-xs font-medium text-ink-soft">
                      {safePage} / {pageCount}
                    </span>
                    <Button
                      variant="secondary"
                      size="icon"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage(safePage + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

/* --------------------------------- pieces -------------------------------- */

function SortableTh({ label, active, dir, onClick, align = 'left' }) {
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <Table.Th align={align}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-wide transition-colors ${
          active ? 'text-brand' : 'text-ink-muted hover:text-ink'
        } ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </Table.Th>
  )
}

function ToggleChip({ active, onClick, tone, children }) {
  const tones = {
    amber: active ? 'bg-amber-100 text-amber-800 ring-amber-600/30' : '',
    violet: active ? 'bg-violet-100 text-violet-800 ring-violet-600/30' : '',
  }
  return (
    <button
      onClick={onClick}
      className={`h-10 rounded-lg border border-slate-200 bg-surface px-3 text-sm font-medium transition-colors ${
        active ? tones[tone] : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export default Records