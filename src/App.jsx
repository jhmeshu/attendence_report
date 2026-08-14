import { lazy, Suspense, useState } from 'react'
import { AppShell } from './components/layout/AppShell.jsx'
import { AttendanceProvider, useAttendance } from './store/attendanceContext.jsx'
import { formatMonth } from './lib/csv'

// Pages are code-split so the chart-heavy Dashboard (recharts) loads as its
// own chunk instead of bloating the initial bundle (Phase 14: performance).
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Review = lazy(() => import('./pages/Review.jsx'))
const Records = lazy(() => import('./pages/Records.jsx'))
const Employees = lazy(() => import('./pages/Employees.jsx'))
const Upload = lazy(() => import('./pages/Upload.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const SearchResults = lazy(() => import('./pages/SearchResults.jsx'))

/** Centered loading fallback shown while a page chunk is fetched. */
function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  )
}

const PAGE_META = {
  dashboard: { title: 'Dashboard' },
  review: { title: 'Needs Review', subtitle: 'Employees flagged for attendance review' },
  employees: { title: 'Employees', subtitle: 'All employee attendance summaries' },
  records: { title: 'Attendance Records', subtitle: 'Detailed daily attendance log' },
  upload: { title: 'Upload Data', subtitle: 'Import monthly attendance CSV files' },
  settings: { title: 'Settings', subtitle: 'Configure attendance rules and thresholds' },
  search: { title: 'Search Results', subtitle: 'Employee records and percentages' },
}

function App() {
  const [active, setActive] = useState('dashboard')
  const [reviewEmployeeId, setReviewEmployeeId] = useState(null)
  const [globalQuery, setGlobalQuery] = useState('')
  const { status, reportingMonth, crossFile, report } = useAttendance()

  // Sidebar live status: flagged count badge + loaded dataset summary.
  const flagCount = report?.flaggedEmployees?.length ?? 0
  const statusText =
    status === 'ready' && crossFile?.months?.length
      ? `Loaded: ${crossFile.months.map(formatMonth).join(' · ')}`
      : null

  // Dashboard subtitle reflects the actual reporting month once data is loaded.
  const baseMeta = PAGE_META[active] ?? PAGE_META.dashboard
  const meta = {
    ...baseMeta,
    subtitle:
      active === 'dashboard'
        ? status === 'ready' && reportingMonth
          ? `${formatMonth(reportingMonth)} — reporting month overview`
          : 'Upload attendance data to begin'
        : active === 'search' && globalQuery.trim()
          ? `Records and percentages for "${globalQuery.trim()}"`
          : baseMeta.subtitle,
  }

  // Header search: value/onChange keep the box editable; onSubmit jumps to the
  // Search Results page with the query applied.
  const headerSearch = {
    value: globalQuery,
    onChange: setGlobalQuery,
    onSubmit: (q) => {
      setGlobalQuery(q)
      setActive('search')
    },
  }

  const renderPage = () => {
    const page = (() => {
      switch (active) {
        case 'dashboard':
          return (
            <Dashboard
              onNavigate={setActive}
              onSelectEmployee={setReviewEmployeeId}
            />
          )
        case 'review':
          return (
            <Review
              selectedEmployeeId={reviewEmployeeId}
              onClearSelection={() => setReviewEmployeeId(null)}
            />
          )
        case 'employees':
          return <Employees />
        case 'records':
          return <Records />
        case 'upload':
          return <Upload onNavigate={setActive} />
        case 'settings':
          return <Settings />
        case 'search':
          return <SearchResults query={globalQuery} />
        default:
          return (
            <Dashboard
              onNavigate={setActive}
              onSelectEmployee={setReviewEmployeeId}
            />
          )
      }
    })()

    return <Suspense fallback={<PageFallback />}>{page}</Suspense>
  }

  return (
    <AppShell
      active={active}
      onNavigate={setActive}
      title={meta.title}
      subtitle={meta.subtitle}
      flagCount={flagCount}
      statusText={statusText}
      headerSearch={headerSearch}
    >
      {renderPage()}
    </AppShell>
  )
}

export default function AppWithProvider() {
  return (
    <AttendanceProvider>
      <App />
    </AttendanceProvider>
  )
}
