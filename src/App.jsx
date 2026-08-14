import { useState } from 'react'
import { AlertTriangle, Users, Table2, Upload as UploadIcon, Settings } from 'lucide-react'
import { AppShell } from './components/layout/AppShell.jsx'
import { AttendanceProvider, useAttendance } from './store/attendanceContext.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Upload } from './pages/Upload.jsx'
import { Placeholder } from './pages/Placeholder.jsx'
import { formatMonth } from './lib/csv'

const PAGE_META = {
  dashboard: { title: 'Dashboard' },
  review: { title: 'Needs Review', subtitle: 'Employees flagged for attendance review' },
  employees: { title: 'Employees', subtitle: 'All employee attendance summaries' },
  records: { title: 'Attendance Records', subtitle: 'Detailed daily attendance log' },
  upload: { title: 'Upload Data', subtitle: 'Import monthly attendance CSV files' },
  settings: { title: 'Settings', subtitle: 'Configure attendance rules and thresholds' },
}

function App() {
  const [active, setActive] = useState('dashboard')
  const { status, reportingMonth } = useAttendance()

  // Dashboard subtitle reflects the actual reporting month once data is loaded.
  const baseMeta = PAGE_META[active] ?? PAGE_META.dashboard
  const meta = {
    ...baseMeta,
    subtitle:
      active === 'dashboard'
        ? status === 'ready' && reportingMonth
          ? `${formatMonth(reportingMonth)} — reporting month overview`
          : 'Upload attendance data to begin'
        : baseMeta.subtitle,
  }

  const renderPage = () => {
    switch (active) {
      case 'dashboard':
        return <Dashboard onNavigate={setActive} />
      case 'review':
        return (
          <Placeholder
            icon={AlertTriangle}
            title="Employees Requiring Review"
            description="The 50% late detection and drill-down review live here once the engine is wired in."
            phase="Phase 5 & 8"
          />
        )
      case 'employees':
        return (
          <Placeholder
            icon={Users}
            title="Employee Summaries"
            description="Per-employee monthly statistics will appear here."
            phase="Phase 4"
          />
        )
      case 'records':
        return (
          <Placeholder
            icon={Table2}
            title="Attendance Records"
            description="The full searchable, sortable attendance table."
            phase="Phase 10"
          />
        )
      case 'upload':
        return <Upload onNavigate={setActive} />
      case 'settings':
        return (
          <Placeholder
            icon={Settings}
            title="Attendance Settings"
            description="Configure on-time cutoff, early-leave threshold, and working days."
            phase="Phase 12"
          />
        )
      default:
        return <Dashboard onNavigate={setActive} />
    }
  }

  return (
    <AppShell active={active} onNavigate={setActive} title={meta.title} subtitle={meta.subtitle}>
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
