import { useEffect, useMemo, useState } from 'react'
import {
  Save,
  RotateCcw,
  CheckCircle2,
  Clock,
  CalendarDays,
  Percent,
} from 'lucide-react'

import { Card, Button, Badge } from '../components/ui'
import { useAttendance } from '../store/attendanceContext'

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

/** Default rule values (the factory used by the store). */
const DEFAULTS = {
  onTimeCutoff: 600, // 10:00 AM
  earlyLeaveCutoff: 1140, // 7:00 PM
  highLateThreshold: 50,
  weekendDays: [5, 6],
}

function minutesToTime(m) {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function timeToMinutes(v) {
  const [h, m] = String(v ?? '').split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/**
 * Attendance Settings (doc Phase 12).
 *
 * Lets management change the rules without code changes. Settings are stored
 * through the attendance store, persisted to localStorage, and every derived
 * report (KPIs, flags, alerts, tables) recomputes on save.
 */
export function Settings() {
  const { settings, updateRules } = useAttendance()

  // Local draft; applied to the store on Save.
  const [draft, setDraft] = useState({
    onTimeCutoff: settings?.onTimeCutoff ?? DEFAULTS.onTimeCutoff,
    earlyLeaveCutoff: settings?.earlyLeaveCutoff ?? DEFAULTS.earlyLeaveCutoff,
    highLateThreshold: settings?.highLateThreshold ?? DEFAULTS.highLateThreshold,
    weekendDays: settings?.weekendDays ?? [...DEFAULTS.weekendDays],
  })
  const [saved, setSaved] = useState(false)

  // Any edit invalidates the "Saved" confirmation.
  useEffect(() => {
    setSaved(false)
  }, [draft])

  const workingDays = useMemo(
    () => DAYS.filter((d) => !draft.weekendDays.includes(d.value)),
    [draft.weekendDays],
  )
  const weekendDays = useMemo(
    () => DAYS.filter((d) => draft.weekendDays.includes(d.value)),
    [draft.weekendDays],
  )

  const toggleDay = (value) => {
    setDraft((prev) => {
      const has = prev.weekendDays.includes(value)
      const next = has
        ? prev.weekendDays.filter((x) => x !== value)
        : [...prev.weekendDays, value]
      // Keep at least one working day and one weekend day.
      if (next.length === 0 || next.length === 7) return prev
      return { ...prev, weekendDays: next }
    })
    setSaved(false)
  }

  const handleSave = () => {
    const onTime = timeToMinutes(draft.onTimeCutoff)
    const early = timeToMinutes(draft.earlyLeaveCutoff)
    if (onTime == null || early == null) return
    updateRules({
      onTimeCutoff: onTime,
      earlyLeaveCutoff: early,
      highLateThreshold: draft.highLateThreshold,
      weekendDays: draft.weekendDays,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    setDraft({ ...DEFAULTS, weekendDays: [...DEFAULTS.weekendDays] })
    setSaved(false)
  }

  const fieldClass =
    'h-10 rounded-lg border border-slate-200 bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-100'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Attendance Settings</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Change how attendance is calculated. Saved settings apply
              immediately to the dashboard, alerts, flags, and reports.
            </p>
          </div>
          {saved && (
            <Badge tone="success" dot>
              Saved
            </Badge>
          )}
        </div>

        {/* Time + threshold rules */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <Clock className="h-3.5 w-3.5 text-brand" />
              On-time cutoff
            </label>
            <input
              type="time"
              value={minutesToTime(draft.onTimeCutoff)}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  onTimeCutoff: timeToMinutes(e.target.value) ?? p.onTimeCutoff,
                }))
              }
              className={fieldClass}
            />
            <p className="mt-1 text-[11px] text-ink-faint">
              Clock-in at or before this is "On Time".
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <Clock className="h-3.5 w-3.5 text-brand" />
              Early-leave cutoff
            </label>
            <input
              type="time"
              value={minutesToTime(draft.earlyLeaveCutoff)}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  earlyLeaveCutoff:
                    timeToMinutes(e.target.value) ?? p.earlyLeaveCutoff,
                }))
              }
              className={fieldClass}
            />
            <p className="mt-1 text-[11px] text-ink-faint">
              Clock-out before this counts as Early Leave.
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <Percent className="h-3.5 w-3.5 text-brand" />
              High-late threshold
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={draft.highLateThreshold}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    highLateThreshold: Math.max(
                      0,
                      Math.min(100, Number(e.target.value) || 0),
                    ),
                  }))
                }
                className={fieldClass}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                %
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-faint">
              Late rate above this flags an employee for review.
            </p>
          </div>
        </div>
      </Card>

      {/* Work week */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-brand" />
          <h2 className="text-base font-semibold text-ink">Work Week</h2>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Mark which days are weekends. Everything else is a scheduled working day.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Working days
            </p>
            <div className="flex flex-wrap gap-2">
              {workingDays.length === 0 ? (
                <p className="text-sm text-ink-faint">None — at least one required.</p>
              ) : (
                workingDays.map((d) => (
                  <DayChip
                    key={d.value}
                    label={d.label}
                    weekend={false}
                    onClick={() => toggleDay(d.value)}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Weekend
            </p>
            <div className="flex flex-wrap gap-2">
              {weekendDays.map((d) => (
                <DayChip
                  key={d.value}
                  label={d.label}
                  weekend
                  onClick={() => toggleDay(d.value)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            Tip: clock-in rules use these days to determine weekends.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" leftIcon={RotateCcw} onClick={handleReset}>
              Reset defaults
            </Button>
            <Button leftIcon={Save} onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* --------------------------------- pieces -------------------------------- */

function DayChip({ label, weekend, onClick }) {
  return (
    <button
      onClick={onClick}
      title={weekend ? 'Weekend — click to make it a working day' : 'Working day — click to make it a weekend'}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
        weekend
          ? 'bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-600/30 hover:bg-violet-200'
          : 'bg-surface-muted text-ink-soft ring-1 ring-inset ring-slate-200 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

export default Settings