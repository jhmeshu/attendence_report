import { createContext, useContext, useMemo, useState } from 'react'
import { buildReport } from '../lib/engine'
import {
  deriveKpis,
  deriveTrend,
  deriveLateAnalysis,
  deriveAlerts,
} from '../lib/dashboard'

/**
 * In-memory attendance store.
 *
 * Holds the validated CSV dataset for the session (no backend / persistence).
 * The Upload page populates this; the dashboard/tables read from `report`,
 * which is the memoized buildReport() output.
 */

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

  // The full report — recomputed only when records change.
  const report = useMemo(
    () => (records.length ? buildReport(records) : null),
    [records],
  )

  // Dashboard-ready datasets, derived from the report.
  const dashboard = useMemo(() => {
    if (!report) return null
    return {
      ...deriveKpis(report),
      trend: deriveTrend(report),
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
      load,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileResults, crossFile, records, status, report, dashboard],
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
