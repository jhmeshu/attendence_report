import {
  CheckCircle2,
  Users,
  UserX,
  Clock,
  LogOut,
  AlertTriangle,
  CalendarClock,
  Flag,
  Eye,
  UploadCloud,
  TrendingDown,
  Timer,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { Card, Button, Badge, Table, StatCard, EmptyState } from '../components/ui'
import { AttendanceCalendar } from '../components/AttendanceCalendar'
import { HistoricalNotice } from '../components/HistoricalNotice'
import { statusToTone } from '../lib/statusTone'
import { useAttendance } from '../store/attendanceContext'
import { formatMonth } from '../lib/csv'

const ALERT_META = {
  danger: { icon: AlertTriangle, chip: 'bg-red-50 text-red-600' },
  warning: { icon: CalendarClock, chip: 'bg-amber-50 text-amber-600' },
}

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-ink-soft">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: p.color || p.fill }}
          />
          {p.name}: {p.value}
          {suffix}
        </p>
      ))}
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg bg-surface-subtle p-3 text-center">
      <span
        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 text-lg font-bold tracking-tight text-ink">{value}</p>
      <p className="text-[11px] font-medium text-ink-muted">{label}</p>
    </div>
  )
}

export function Dashboard({ onNavigate, onSelectEmployee }) {
  const { status, report, dashboard } = useAttendance()

  // Empty state — no CSV uploaded yet.
  if (status !== 'ready' || !report || !dashboard) {
    return (
      <EmptyState
        icon={UploadCloud}
        title="No attendance data yet"
        description="Upload your monthly attendance CSV files to generate the dashboard report."
        action={
          <Button onClick={() => onNavigate?.('upload')} leftIcon={UploadCloud}>
            Upload Attendance Data
          </Button>
        }
      />
    )
  }

  const { kpis, statusBreakdown, trend, calendar, lateAnalysis, alerts } = dashboard
  const reportingLabel = formatMonth(report.reportingMonth)

  // Recent records: latest 8 processed records in the reporting month.
  const recentRecords = report.records
    .filter((r) => r.month === report.reportingMonth)
    .slice(-8)
    .reverse()

  return (
    <div className="space-y-6">
      {/* Reporting-month banner */}
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <CalendarClock className="h-4 w-4 text-brand" />
        Reporting month:{' '}
        <span className="font-semibold text-ink">{reportingLabel}</span>
      </div>

      <HistoricalNotice months={report.months} reportingMonth={report.reportingMonth} />

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Overall Attendance"
          value={`${kpis.overallAttendance}%`}
          icon={CheckCircle2}
          tone="info"
          trend={
            kpis.trend
              ? {
                  direction: kpis.trend.isGood ? 'up' : 'down',
                  value: kpis.trend.value,
                  label: kpis.trend.label,
                }
              : undefined
          }
        />
        <StatCard label="Present" value={kpis.present} icon={Users} tone="success" />
        <StatCard label="Absent" value={kpis.absent} icon={UserX} tone="danger" />
        <StatCard label="Late" value={kpis.late} icon={Clock} tone="warning" />
        <StatCard label="Early Leave" value={kpis.earlyLeave} icon={LogOut} tone="neutral" />
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Attendance Trend — {reportingLabel}</Card.Title>
            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" /> Attendance %
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Late count
              </span>
            </div>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#008DFF" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#008DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Area type="monotone" dataKey="attendance" name="Attendance" stroke="#008DFF" strokeWidth={2} fill="url(#attGrad)" />
                <Area type="monotone" dataKey="late" name="Late" stroke="#F59E0B" strokeWidth={2} fill="url(#lateGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>

        {/* Status breakdown pie */}
        <Card>
          <Card.Header>
            <Card.Title>Status Breakdown</Card.Title>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.tone} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {statusBreakdown.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.tone }} />
                  <span className="text-ink-muted">{s.name}</span>
                  <span className="ml-auto font-medium text-ink">{s.value}</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </section>

      {/* Attendance calendar + Late analysis */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Attendance Calendar — {reportingLabel}</Card.Title>
            <Badge tone="info">day-by-day attendance count</Badge>
          </Card.Header>
          <Card.Body>
            <AttendanceCalendar month={calendar.month} days={calendar.days} />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Late Arrival Analysis</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                icon={Clock}
                label="Total late"
                value={lateAnalysis.stats.totalLate}
                tone="bg-amber-50 text-amber-600"
              />
              <MiniStat
                icon={Timer}
                label="Avg duration"
                value={`${lateAnalysis.stats.avgLateMinutes}m`}
                tone="bg-violet-50 text-violet-600"
              />
              <MiniStat
                icon={TrendingDown}
                label="Frequency"
                value={`${lateAnalysis.stats.lateFrequencyPct}%`}
                tone="bg-brand-50 text-brand"
              />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={lateAnalysis.buckets} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="count" name="Late arrivals" fill="#008DFF" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      </section>

      {/* Management alerts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <Card.Header>
            <Card.Title>Management Alerts</Card.Title>
            {alerts.length > 0 && (
              <Badge tone="danger" dot>
                {alerts.length} active
              </Badge>
            )}
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {alerts.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3.5 lg:col-span-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm text-emerald-700">
                    No alerts — all attendance metrics within normal range.
                  </p>
                </div>
              ) : (
                alerts.map((a, i) => {
                  const meta = ALERT_META[a.tone]
                  const Icon = meta.icon
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 bg-surface-subtle p-3.5"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.chip}`}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{a.title}</p>
                        <p className="text-xs text-ink-muted">{a.detail}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card.Body>
        </Card>
      </section>

      {/* Flagged employees */}
      {report.flaggedEmployees.length > 0 && (
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Flag className="h-[18px] w-[18px] text-danger" />
              <Card.Title>Employees Requiring Review</Card.Title>
            </div>
            <Badge tone="danger">{report.flaggedEmployees.length} flagged</Badge>
          </Card.Header>
          <Card.Body className="p-0">
            <Table>
              <Table.Head>
                <Table.Row hoverable={false}>
                  <Table.Th>Employee</Table.Th>
                  <Table.Th>Employee ID</Table.Th>
                  <Table.Th>Department</Table.Th>
                  <Table.Th align="right">Attendance</Table.Th>
                  <Table.Th align="right">Late %</Table.Th>
                  <Table.Th align="right">Late Days</Table.Th>
                  <Table.Th align="right">Action</Table.Th>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {report.flaggedEmployees.map((e) => (
                  <Table.Row key={`${e.employeeId}-${e.name}`}>
                    <Table.Td className="font-medium text-ink">{e.name}</Table.Td>
                    <Table.Td>
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-ink-soft">
                        {e.employeeId}
                      </code>
                    </Table.Td>
                    <Table.Td className="text-ink-muted">{e.department}</Table.Td>
                    <Table.Td align="right">{e.attendancePct}%</Table.Td>
                    <Table.Td align="right">
                      <Badge tone="danger">{e.latePct}%</Badge>
                    </Table.Td>
                    <Table.Td align="right">{e.lateDays}</Table.Td>
                    <Table.Td align="right">
                      <Button
                        variant="subtle"
                        size="sm"
                        rightIcon={Eye}
                        onClick={() => {
                          onSelectEmployee?.(e.employeeId)
                          onNavigate?.('review')
                        }}
                      >
                        View
                      </Button>
                    </Table.Td>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Recent records */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Attendance Records — {reportingLabel}</Card.Title>
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('records')}>
            View all
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Head>
              <Table.Row hoverable={false}>
                <Table.Th>Employee</Table.Th>
                <Table.Th>Employee ID</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Clock In</Table.Th>
                <Table.Th>Clock Out</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Hours</Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {recentRecords.map((r, i) => (
                <Table.Row key={`${r.employeeId}-${r.date}-${i}`}>
                  <Table.Td className="font-medium text-ink">{r.name}</Table.Td>
                  <Table.Td>
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-ink-soft">
                      {r.employeeId}
                    </code>
                  </Table.Td>
                  <Table.Td>{r.date}</Table.Td>
                  <Table.Td>{r.clockIn ?? '—'}</Table.Td>
                  <Table.Td>{r.clockOut ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge tone={statusToTone(r.attendanceStatus)} dot>
                      {r.attendanceStatus}
                    </Badge>
                  </Table.Td>
                  <Table.Td align="right">{r.workedHours ?? '—'}</Table.Td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Dashboard
