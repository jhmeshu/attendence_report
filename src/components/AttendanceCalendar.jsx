import { formatMonth } from '../lib/csv'

/**
 * Attendance Calendar — visual overview of attendance by date (doc Phase 7).
 *
 * A month grid where each day cell is shaded by the day's attendance % and
 * shows the present/scheduled headcount. Cells carry a dot when late arrivals
 * occurred that day. Hovering a cell shows details in the native tooltip.
 *
 * Props:
 *   month: 'YYYY-MM' of the reporting month
 *   days: deriveCalendar(report).days
 */
const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toneFor(scheduled, attendancePct) {
  if (!scheduled) return 'bg-slate-50 text-ink-faint ring-slate-100'
  if (attendancePct === 0) return 'bg-red-200 text-red-800'
  if (attendancePct < 60) return 'bg-red-300 text-red-900'
  if (attendancePct < 80) return 'bg-amber-300 text-amber-950'
  return 'bg-brand-200 text-brand-900'
}

const LEGEND = [
  { label: 'No records', className: 'bg-slate-50 ring-1 ring-slate-100' },
  { label: '0%', className: 'bg-red-200' },
  { label: '1–59%', className: 'bg-red-300' },
  { label: '60–79%', className: 'bg-amber-300' },
  { label: '80–100%', className: 'bg-brand-200' },
]

/** Legend note — cell shade = attendance %, number = present/scheduled. */

export function AttendanceCalendar({ month, days }) {
  if (!month) return null

  const leadPad = days.length ? days[0].weekday : 0
  const cells = [...Array(leadPad).fill(null), ...days]

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_HEADERS.map((w) => (
          <div
            key={w}
            className="pb-1 text-center text-[11px] font-medium text-ink-faint"
          >
            {w}
          </div>
        ))}

        {cells.map((cell, i) =>
          cell ? (
            <div
              key={cell.date}
              title={`${formatMonth(month)} ${cell.day} — ${
                cell.scheduled > 0
                  ? `${cell.present} present · ${cell.scheduled} scheduled${cell.late ? ` · ${cell.late} late` : ''}`
                  : cell.isWeekend
                    ? `Weekend — rest day${cell.weekendWork ? ` (${cell.weekendWork} weekend-work)` : ''}`
                    : 'No scheduled work'
              }`}
              className={`relative flex h-14 flex-col items-center justify-center rounded-lg ring-1 ${toneFor(cell.scheduled, cell.attendancePct)}`}
            >
              <span className="text-sm font-semibold leading-none">{cell.day}</span>
              {cell.scheduled > 0 ? (
                <span className="mt-1 text-[10px] font-medium leading-none opacity-80">
                  {cell.present}/{cell.scheduled}
                </span>
              ) : cell.isWeekend ? (
                <span className="mt-1 text-[9px] font-medium uppercase leading-none text-ink-faint">
                  {cell.weekendWork ? `Wx${cell.weekendWork}` : 'Wk'}
                </span>
              ) : null}
              {cell.weekendWork > 0 && (
                <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shadow-sm" />
              )}
              {cell.late > 0 && (
                <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shadow-sm" />
              )}
            </div>
          ) : (
            <div key={`pad-${i}`} />
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-muted">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded ${l.className}`} />
              {l.label}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          late arrival
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          weekend work
        </span>
        <span className="flex items-center gap-1.5">
          Wk
          <span>weekend rest day</span>
        </span>
      </div>

      <p className="mt-2 text-[11px] text-ink-faint">
        Cell shade = attendance %, number = present/scheduled
      </p>
    </div>
  )
}

export default AttendanceCalendar