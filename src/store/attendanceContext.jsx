import { createContext, useContext, useMemo, useState } from 'react'
import { buildReport, DEFAULT_RULES } from '../lib/engine'
import {
  deriveKpis,
  deriveTrend,
  deriveLateAnalysis,
  deriveAlerts,
  deriveCalendar,
} from '../lib/dashboard'

/**
 * In-memory attendance store.
 *
 * Holds the validated CSV dataset for the session (no backend / persistence)
 * plus the user-configurable attendance rules (Phase 12), persisted to
 * localStorage so rule changes survive reloads. The Upload page populates the
 * data; the dashboard/tables read from `report`, which is the memoized
 * buildReport() output — recomputed whenever records or settings change.
 */

const STORAGE_KEY = 'attendance.rules.v1'

/** Factory for the default settings object (mirrors DEFAULT_RULES). */
function defaultSettings() {
  return {
    onTimeCutoff: DEFAULT_RULES.onTimeCutoff,
    earlyLeaveCutoff: DEFAULT_RULES.earlyLeaveCutoff,
    highLateThreshold: DEFAULT_RULES.highLateThreshold,
    weekendDays: [...DEFAULT_RULES.weekendDays],
  }
}

/** Read persisted settings from localStorage, defaulted when unavailable. */
function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw)
    return {
      ...defaultSettings(),
      ...parsed,
      // Guard against corrupted/absent weekendDays.
      weekendDays: Array.isArray(parsed.weekendDays)
        ? parsed.weekendDays
        : [...DEFAULT_RULES.weekendDays],
    }
  } catch {
    return defaultSettings()
  }
}

const AttendanceContext = createContext(null)

export function AttendanceProvider({ children }) {
  // fileResults: per-file ValidationResult[]
  // crossFile:  result of validateFiles()
  // records:    merged NormalizedRecord[] across all valid files
  // status:     'empty' | 'ready'
  const [fileResults, setFileResults] = useState([])
  const [crossFile, setCrossFile] = useState(null)
  const [records, setRecords] = useState([])
  const [status, setStatus] = useState('empty')
  const [settings, setSettings] = useState(loadPersistedSettings)

  /** Store processed results from the Upload page. */
  function load(results, cross) {
    const merged = results
      .filter((r) => r.ok)
      .flatMap((r) => r.records)
    setFileResults(results)
    setCrossFile(cross)
    setRecords(merged)
    setStatus('ready')
  }

  /** Clear everything back to the empty state. */
  function reset() {
    setFileResults([])
    setCrossFile(null)
    setRecords([])
    setStatus('empty')
  }

  /** Apply attendance rule changes and persist them for the next session. */
  function updateRules(next) {
    setSettings((prev) => {
      const merged = { ...prev, ...next }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // Storage may be unavailable (private mode); rules still apply in-memory.
      }
      return merged
    })
  }

  // The full report — recomputed only when records or settings change.
  const report = useMemo(
    () => (records.length ? buildReport(records, settings) : null),
    [records, settings],
  )

  // Dashboard-ready datasets, derived from the report.
  const dashboard = useMemo(() => {
    if (!report) return null
    return {
      ...deriveKpis(report),
      trend: deriveTrend(report),
      calendar: deriveCalendar(report),
      lateAnalysis: deriveLateAnalysis(report),
      alerts: deriveAlerts(report),
    }
  }, [report])

  const value = useMemo(
    () => ({
      fileResults,
      crossFile,
      records,
      status,
      months: crossFile?.months ?? [],
      reportingMonth: crossFile?.reportingMonth ?? null,
      report,
      dashboard,
      settings,
      updateRules,
      load,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      fileResults,
      crossFile,
      records,
      status,
      settings,
      report,
      dashboard,
    ],
  )

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  )
}

/** Access the attendance store. */
export function useAttendance() {
  const ctx = useContext(AttendanceContext)
  if (!ctx) {
    throw new Error('useAttendance must be used within an AttendanceProvider')
  }
  return ctx
}

export default AttendanceContext
