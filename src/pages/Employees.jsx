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
  AlertTriangle,
  Download,
} from 'lucide-react'

import { Card, Table, Badge, Button, EmptyState } from '../components/ui'
import { formatMonth } from '../lib/csv'
import { toCsv, downloadCsv } from '../lib/export'
import { isExcludedReviewDepartment } from '../lib/engine/flagging'
import { useAttendance } from '../store/attendanceContext'

const PAGE_SIZES = [20, 50, 100]

const SORT_FIELDS = {
  name: { label: 'Employee' },
  employeeId: { label: 'Employee ID' },
  department: { label: 'Department' },
  attendancePct: { label: 'Attendance' },
  latePct: { label: 'Late %' },
  late: { label: 'Late Days' },
  earlyLeave: { label: 'Early Leave' },
  avgLateMinutes: { label: 'Avg Late' },
  totalWorkedHours: { label: 'Total Hours' },
  avgWorkedHours: { label: 'Avg Hours' },
  weekendWork: { label: 'Wknd Work' },
}

/** Value extractor per sort key. Missing/string-safe. */
function sortValue(s, key) {
  switch (key) {
    case 'name':
      return s.name.toLowerCase()
    case 'employeeId':
      return s.employeeId
    case 'department':
      return s.department?.toLowerCase() ?? ''
    case 'totalWorkedHours':
      return s.totalWorkedMinutes ?? -1
    case 'avgWorkedHours':
      return s.avgWorkedMinutes ?? -1
    case 'avgLateMinutes':
      return s.avgLateMinutes ?? -1
    case 'attendancePct':
    case 'latePct':
    case 'late':
    case 'earlyLeave':
    case 'weekendWork':
      return s[key] ?? -1
    default:
      return s.name.toLowerCase()
  }
}

/**
 * Employee summaries (doc Phase 4).
 *
 * One row per employee for the selected month, with the full monthly
 * statistic set. Search, sort, month filter and pagination included.
 * Employees above the high-late threshold are highlighted for follow-up.
 */
export function Employees() {
  const { status, report } = useAttendance()

  const [query, setQuery] = useState('')
  const [month, setMonth] = useState('all')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const threshold = report?.rules?.highLateThreshold ?? 50

  // Default the month to the reporting month once data is loaded.
  useEffect(() => {
    if (report?.reportingMonth) {
      setMonth(report.reportingMonth)
      setPage(1)
    }
  }, [report])

  const filtered = useMemo(() => {
    let list = report?.summaries ?? []

    if (month !== 'all') list = list.filter((s) => s.month === month)
    if (flaggedOnly)
      list = list.filter(
        (s) => s.latePct > threshold && !isExcludedReviewDepartment(s.department),
      )

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.employeeId.toLowerCase().includes(q),
      )
    }
    return list
  }, [report, month, flaggedOnly, query, threshold])

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

  useEffect(() => {
    setPage(1)
  }, [query, month, flaggedOnly, pageSize, sortKey, sortDir])

  const hasFilters = query.trim() || month !== 'all' || flaggedOnly

  const clearFilters = () => {
    setQuery('')
    setMonth(report?.reportingMonth ?? 'all')
    setFlaggedOnly(false)
  }

  /** Export the currently filtered summaries (doc Phase 11). */
  const handleExport = () => {
    const headers = [
      'Employee', 'Employee ID', 'Department', 'Month', 'Scheduled Days',
      'Present', 'Absent', 'No Record', 'Late Days', 'Early Leave',
      'Weekend Work', 'Attendance %', 'Late %', 'Early Leave %',
      'Avg Late (min)', 'Total Hours', 'Avg Hours',
    ]
    const rows = sorted.map((s) => [
      s.name,
      s.employeeId,
      s.department,
      s.month,
      s.scheduledWorkingDays,
      s.present,
      s.absent,
      s.noRecord,
      s.late,
      s.earlyLeave,
      s.weekendWork,
      s.attendancePct,
      s.latePct,
      s.earlyLeavePct,
      s.avgLateMinutes,
      s.totalWorkedHours ?? '',
      s.avgWorkedHours ?? '',
    ])
    const monthTag = month === 'all' ? 'all-months' : month
    downloadCsv(`employee-summaries-${monthTag}.csv`, toCsv(headers, rows))
  }

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  if (status !== 'ready' || !report) {
    return (
      <EmptyState
        icon={UploadCloud}
        title="No attendance data yet"
        description="Upload your monthly attendance CSV files to see per-employee summaries."
      />
    )
  }

  const rangeStart = sorted.length ? (safePage - 1) * pageSize + 1 : 0
  const rangeEnd = Math.min(safePage * pageSize, sorted.length)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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

          <button
            onClick={() => setFlaggedOnly((v) => !v)}
            className={`flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3 text-sm font-medium transition-colors ${
              flaggedOnly
                ? 'bg-red-50 text-red-700 ring-1 ring-red-600/30'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Needs review only
          </button>

          {hasFilters && (
            <Button variant="ghost" size="sm" leftIcon={FilterX} onClick={clearFilters}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <Card.Header>
          <div>
            <Card.Title>Employee Summaries</Card.Title>
            <p className="mt-0.5 text-xs text-ink-muted">
              {sorted.length.toLocaleString()} employees
              {month !== 'all' ? ` · ${formatMonth(month)}` : ' · all months'}
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
                title="No employees match your filters"
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
                        align={
                          key === 'name' ||
                          key === 'employeeId' ||
                          key === 'department'
                            ? 'left'
                            : 'right'
                        }
                      />
                    ))}
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {paged.map((s) => {
                    const flagged = s.latePct > threshold
                    return (
                      <Table.Row key={`${s.employeeId}-${s.month}`}>
                        <Table.Td className="font-medium text-ink">
                          <span className="flex items-center gap-2">
                            {s.name}
                            {flagged && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-50 text-red-600" title="Above high-late threshold">
                                <AlertTriangle className="h-3 w-3" />
                              </span>
                            )}
                          </span>
                        </Table.Td>
                        <Table.Td>
                          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-ink-soft">
                            {s.employeeId}
                          </code>
                        </Table.Td>
                        <Table.Td className="text-ink-muted">
                          {s.department}
                        </Table.Td>
                        <Table.Td align="right">{s.attendancePct}%</Table.Td>
                        <Table.Td align="right">
                          <Badge tone={flagged ? 'danger' : 'success'} size="sm">
                            {s.latePct}%
                          </Badge>
                        </Table.Td>
                        <Table.Td align="right">{s.late}</Table.Td>
                        <Table.Td align="right">{s.earlyLeave}</Table.Td>
                        <Table.Td align="right">
                          {s.avgLateMinutes ? `${s.avgLateMinutes}m` : '0m'}
                        </Table.Td>
                        <Table.Td align="right">{s.totalWorkedHours ?? '—'}</Table.Td>
                        <Table.Td align="right">{s.avgWorkedHours ?? '—'}</Table.Td>
                        <Table.Td align="right">{s.weekendWork}</Table.Td>
                      </Table.Row>
                    )
                  })}
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

export default Employees