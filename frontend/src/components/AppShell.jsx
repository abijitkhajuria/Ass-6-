import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  GraduationCap,
  LayoutDashboard,
  Moon,
  PencilLine,
  Sun,
  Users,
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { EASE } from './Primitives'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/marks', label: 'Marks entry', icon: PencilLine },
  { to: '/marksheet', label: 'Marksheet', icon: FileText },
]

export function AppShell({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />

        <main className="print-root mx-auto w-full max-w-[1240px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            {children}
          </motion.div>
        </main>

        <footer className="no-print mx-auto w-full max-w-[1240px] px-4 pb-8 sm:px-6 lg:px-10">
          <p className="border-t pt-6 text-xs text-ink-faint">
            Grades and SGPA are computed on the server from the official scale. Semester 5 ·
            Computer Engineering.
          </p>
        </footer>
      </div>

      <MobileNav />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Wordmark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white"
        style={{
          backgroundImage: 'linear-gradient(140deg, #6366f1, #4f46e5)',
          boxShadow: '0 8px 24px -10px rgba(99,102,241,0.9)',
        }}
      >
        <GraduationCap size={19} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block font-display text-[0.95rem] font-semibold leading-tight text-ink">
            VIT Results
          </span>
          <span className="block text-[0.7rem] leading-tight text-ink-faint">
            Semester portal
          </span>
        </span>
      )}
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-[264px] shrink-0 border-r px-5 py-7 lg:flex lg:flex-col">
      <div className="px-1.5">
        <Wordmark />
      </div>

      <nav aria-label="Primary" className="mt-9 flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-accent/[0.10] text-ink'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent"
                    transition={{ duration: 0.22, ease: EASE }}
                  />
                )}
                <Icon
                  size={17}
                  aria-hidden="true"
                  className={isActive ? 'text-accent-soft' : 'text-ink-faint group-hover:text-ink-muted'}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 border-t pt-5">
        <ThemeToggle full />
      </div>
    </aside>
  )
}

function MobileHeader() {
  return (
    <header className="app-header no-print sticky top-0 z-30 flex items-center justify-between border-b bg-[rgb(var(--page))]/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:hidden">
      <Wordmark />
      <ThemeToggle />
    </header>
  )
}

function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t bg-[rgb(var(--page))]/92 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="flex items-stretch justify-around">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[0.68rem] font-medium transition-colors duration-150',
                isActive ? 'text-accent-soft' : 'text-ink-faint',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'grid h-8 w-12 place-items-center rounded-lg transition-colors duration-150',
                    isActive ? 'bg-accent/[0.12]' : '',
                  ].join(' ')}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function ThemeToggle({ full = false }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const Icon = isDark ? Sun : Moon
  const nextLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  if (full) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={nextLabel}
        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-muted
                   transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
      >
        <Icon size={17} aria-hidden="true" className="text-ink-faint" />
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={nextLabel}
      className="grid h-10 w-10 place-items-center rounded-xl border text-ink-muted
                 transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  )
}
