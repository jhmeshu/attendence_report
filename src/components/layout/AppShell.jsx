import { useState } from 'react'
import { Sidebar } from './Sidebar.jsx'
import { Header } from './Header.jsx'

/**
 * AppShell — owns navigation state and wires Sidebar + Header + content.
 * Pages are passed as a render-prop keyed off `active`.
 */
export function AppShell({ active, onNavigate, title, subtitle, flagCount = 0, statusText, headerSearch, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Sidebar
        active={active}
        onNavigate={onNavigate}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        flagCount={flagCount}
        statusText={statusText}
      />

      <div className="lg:pl-64">
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileNavOpen(true)}
          headerSearch={headerSearch}
        />
        <main
          key={active}
          className="animate-page mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
