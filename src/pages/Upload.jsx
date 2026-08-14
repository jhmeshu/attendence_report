import { useCallback, useMemo, useRef, useState } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
  CalendarDays,
  Users,
  Layers,
  LayoutDashboard,
} from 'lucide-react'

import { Card, Button, Badge } from '../components/ui'
import { validateFile, validateFiles, formatMonth } from '../lib/csv'
import { useAttendance } from '../store/attendanceContext'

/** Read a File object as text (Promise wrapper). */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function Upload({ onNavigate }) {
  const { load } = useAttendance()

  const [items, setItems] = useState([]) // { id, file, result }
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processed, setProcessed] = useState(false)
  const inputRef = useRef(null)

  // Aggregate per-file results for cross-file checks.
  const fileResults = useMemo(
    () => items.map((i) => i.result).filter(Boolean),
    [items],
  )
  const cross = useMemo(
    () => (fileResults.length ? validateFiles(fileResults) : null),
    [fileResults],
  )

  const allFilesValid = items.length > 0 && items.every((i) => i.result?.ok)
  const canProcess =
    allFilesValid && cross?.ok && !isProcessing && !processed

  /** Handle newly selected/dropped files: validate each. */
  const handleFiles = useCallback(async (fileList) => {
    const csvFiles = Array.from(fileList).filter(
      (f) => f.type === 'text/csv' || f.name.toLowerCase().endsWith('.csv'),
    )
    if (csvFiles.length === 0) return

    // Start each slot in a "reading" state.
    const pending = csvFiles.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}`,
      file: f,
      result: null,
      reading: true,
      error: null,
    }))

    setItems((prev) => mergeItems(prev, pending))
    setProcessed(false)

    // Read + validate each file.
    for (const p of pending) {
      try {
        const text = await readFile(p.file)
        const result = validateFile(text, {
          name: p.file.name,
          size: p.file.size,
        })
        setItems((prev) =>
          prev.map((it) =>
            it.id === p.id ? { ...it, result, reading: false } : it,
          ),
        )
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === p.id
              ? {
                  ...it,
                  reading: false,
                  result: {
                    ok: false,
                    file: { name: p.file.name, size: p.file.size },
                    rowCount: 0,
                    columns: { recognized: [], missing: [] },
                    month: null,
                    dateSpan: { min: null, max: null },
                    records: [],
                    duplicates: 0,
                    errors: [
                      {
                        code: 'read_error',
                        message: `Could not read file: ${err?.message ?? 'unknown error'}`,
                      },
                    ],
                    warnings: [],
                  },
                }
              : it,
          ),
        )
      }
    }
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setProcessed(false)
  }

  const handleProcess = () => {
    setIsProcessing(true)
    // Synchronous: results already computed. Brief delay is just for UX.
    setTimeout(() => {
      load(fileResults, cross)
      setIsProcessing(false)
      setProcessed(true)
    }, 500)
  }

  const totalRecords = useMemo(
    () => fileResults.filter((r) => r.ok).reduce((sum, r) => sum + r.records.length, 0),
    [fileResults],
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
            <UploadCloud className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Upload Attendance Data</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Upload monthly attendance CSV files. Months are detected from the{' '}
              <span className="font-medium text-ink-soft">Date column</span>, not
              filenames.
            </p>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            isDragging
              ? 'border-brand bg-brand-50/60'
              : 'border-slate-300 bg-surface-subtle hover:border-brand-400 hover:bg-brand-50/30'
          }`}
        >
          <UploadCloud
            className={`h-8 w-8 ${isDragging ? 'text-brand' : 'text-ink-faint'}`}
          />
          <p className="mt-2 text-sm font-medium text-ink">
            Drop CSV files here, or <span className="text-brand">browse</span>
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Multiple files supported · .csv format
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = '' // allow re-selecting the same file
            }}
          />
        </div>
      </Card>

      {/* Per-file status list */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <FileStatusCard
              key={item.id}
              item={item}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      )}

      {/* Cross-file errors */}
      {cross && !cross.ok && (
        <div className="space-y-2">
          {cross.errors.map((e, i) => (
            <IssueRow key={i} type="error" message={e.message} />
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {items.length === 0 && (
        <Card className="border-dashed bg-transparent p-6 text-center shadow-none">
          <p className="text-sm text-ink-muted">
            Upload attendance files to generate your report.
          </p>
        </Card>
      )}

      {/* Process action */}
      {items.length > 0 && (
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            {allFilesValid && cross?.ok
              ? `${items.length} file${items.length > 1 ? 's' : ''} ready · ${totalRecords.toLocaleString()} records`
              : 'Resolve the issues above before processing.'}
          </p>
          <div className="flex items-center gap-2">
            {processed && (
              <Badge tone="success" dot>
                Processed
              </Badge>
            )}
            <Button
              onClick={handleProcess}
              disabled={!canProcess}
              isLoading={isProcessing}
              leftIcon={processed ? CheckCircle2 : Sparkles}
            >
              {processed ? 'Reprocess' : 'Process Attendance'}
            </Button>
          </div>
        </div>
      )}

      {/* Success summary */}
      {processed && cross && (
        <Card className="border-emerald-200 bg-emerald-50/50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink">
                Attendance data processed
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <SummaryStat
                  icon={Layers}
                  label="Months"
                  value={cross.months.map(formatMonth).join(', ')}
                />
                <SummaryStat
                  icon={Users}
                  label="Records"
                  value={totalRecords.toLocaleString()}
                />
                <SummaryStat
                  icon={CalendarDays}
                  label="Reporting month"
                  value={formatMonth(cross.reportingMonth)}
                />
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                KPIs, charts, and alerts are now live on the dashboard.
              </p>
              <Button
                className="mt-3"
                size="sm"
                leftIcon={LayoutDashboard}
                onClick={() => onNavigate?.('dashboard')}
              >
                View Dashboard
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

/* --------------------------------- pieces -------------------------------- */

/** Merge new pending items into an existing list without duplicating by id. */
function mergeItems(prev, pending) {
  const existing = new Set(prev.map((p) => p.id))
  const fresh = pending.filter((p) => !existing.has(p.id))
  return [...prev, ...fresh]
}

function FileStatusCard({ item, onRemove }) {
  const { file, result, reading } = item

  let state = 'reading'
  if (result) state = result.ok ? (result.warnings.length ? 'warning' : 'ok') : 'error'

  const ICON = {
    reading: Loader2,
    ok: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  }[state]

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            {
              reading: 'bg-slate-100 text-ink-faint',
              ok: 'bg-emerald-50 text-emerald-600',
              warning: 'bg-amber-50 text-amber-600',
              error: 'bg-red-50 text-red-600',
            }[state]
          }`}
        >
          <ICON className={`h-5 w-5 ${reading ? 'animate-spin' : ''}`} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-ink-faint" />
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            {result && (
              <Badge
                tone={
                  state === 'ok'
                    ? 'success'
                    : state === 'warning'
                      ? 'warning'
                      : 'danger'
                }
                size="sm"
              >
                {state === 'ok'
                  ? 'Valid'
                  : state === 'warning'
                    ? `${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`
                    : 'Error'}
              </Badge>
            )}
          </div>

          {reading && (
            <p className="mt-1 text-xs text-ink-faint">Reading & validating…</p>
          )}

          {result?.ok && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
              <span>
                <span className="text-ink-faint">Month:</span>{' '}
                <span className="font-medium text-ink-soft">
                  {formatMonth(result.month)}
                </span>
              </span>
              <span>
                <span className="text-ink-faint">Rows:</span>{' '}
                {result.records.length}
              </span>
              {result.duplicates > 0 && (
                <span className="text-amber-600">
                  {result.duplicates} duplicates merged
                </span>
              )}
            </div>
          )}

          {/* Issues */}
          {result && (
            <div className="mt-2 space-y-1.5">
              {result.errors.map((e, i) => (
                <IssueRow key={`e${i}`} type="error" message={e.message} compact />
              ))}
              {result.warnings.map((w, i) => (
                <IssueRow key={`w${i}`} type="warning" message={w.message} compact />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onRemove}
          className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink-soft"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Card>
  )
}

function IssueRow({ type, message, compact = false }) {
  const isError = type === 'error'
  const Icon = isError ? AlertCircle : AlertTriangle
  const tone = isError
    ? 'bg-red-50 text-red-700'
    : 'bg-amber-50 text-amber-700'
  return (
    <div
      className={`flex items-start gap-2 rounded-lg ${tone} ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
      <p>{message}</p>
    </div>
  )
}

function SummaryStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="flex items-center gap-1.5 text-ink-faint">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

export default Upload
