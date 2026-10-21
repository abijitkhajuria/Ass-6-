import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Award, BarChart3, Crown, PercentCircle, Users } from 'lucide-react'
import { api } from '../lib/api'
import { formatPercent, formatSgpa, gradeColor, initials } from '../lib/format'
import { CountUp } from '../components/CountUp'
import {
  EASE,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  fadeRise,
  stagger,
} from '../components/Primitives'
import { useTheme } from '../lib/ThemeContext'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = () => {
    setStatus('loading')
    api
      .getAnalytics()
      .then((data) => {
        setSummary(data)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }

  useEffect(load, [])

  if (status === 'loading') return <DashboardSkeleton />
  if (status === 'error') {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Semester dashboard" />
        <ErrorState message={error} onRetry={load} />
      </>
    )
  }

  const hasData = summary.totalStudents > 0

  return (
    <>
      <PageHeader
        eyebrow="Semester 5 · Computer Engineering"
        title="Result dashboard"
        description="Cohort performance for the semester, computed from the recorded MSE and ESE components."
        actions={
          <Link to="/students" className="btn-ghost">
            <Users size={16} aria-hidden="true" />
            View students
          </Link>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No students yet"
          description="Seed the database or add a student, then record marks to see the cohort analytics here."
          action={
            <Link to="/marks" className="btn-primary">
              Go to marks entry
            </Link>
          }
        />
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="space-y-6">
          <StatGrid summary={summary} />

          <div className="grid gap-6 xl:grid-cols-5">
            <motion.div variants={fadeRise} className="xl:col-span-3">
              <SubjectAverageChart data={summary.subjectAverages} />
            </motion.div>
            <motion.div variants={fadeRise} className="xl:col-span-2">
              <GradeDistributionChart data={summary.gradeDistribution} />
            </motion.div>
          </div>

          <motion.div variants={fadeRise}>
            <DivisionTable rows={summary.divisionStats} />
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */

function StatGrid({ summary }) {
  const topper = summary.topper

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Users}
        label="Total students"
        value={<CountUp value={summary.totalStudents} decimals={0} duration={700} />}
        hint={`${summary.studentsWithCompleteResults} with all four subjects recorded`}
      />
      <StatCard
        icon={Award}
        label="Class average SGPA"
        value={<CountUp value={summary.classAverageSgpa} decimals={2} />}
        hint="Mean of every graded student"
      />
      <StatCard
        icon={PercentCircle}
        label="Pass percentage"
        value={<CountUp value={summary.passPercentage} decimals={1} suffix="%" />}
        hint={`${summary.passCount} passed · ${summary.failCount} failed`}
        tone={summary.passPercentage >= 60 ? 'pass' : 'warn'}
      />
      <StatCard
        icon={Crown}
        label="Topper"
        value={
          topper ? (
            <span className="block truncate text-[1.6rem] leading-tight">{topper.name}</span>
          ) : (
            <span className="text-[1.6rem] text-ink-faint">—</span>
          )
        }
        hint={
          topper
            ? `${topper.prn} · Division ${topper.division} · SGPA ${formatSgpa(topper.sgpa)}`
            : 'No student has passed every subject yet'
        }
        accentTile={topper ? initials(topper.name) : null}
      />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, hint, tone, accentTile }) {
  const toneRing =
    tone === 'pass'
      ? 'ring-pass/20'
      : tone === 'warn'
        ? 'ring-warn/20'
        : 'ring-transparent'

  return (
    <motion.div
      variants={fadeRise}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: EASE }}
      className={`card relative overflow-hidden p-5 ring-1 ring-inset ${toneRing}`}
    >
      {/* A single restrained wash, top-left, so cards read as one family. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-14 h-32 w-32 rounded-full opacity-70 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.20), transparent 70%)' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="label">{label}</p>
        {accentTile ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/12 text-xs font-bold text-accent-soft">
            {accentTile}
          </span>
        ) : (
          <Icon size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
        )}
      </div>

      <p className="relative mt-3 font-display text-[2.1rem] font-semibold leading-none text-ink">
        {value}
      </p>
      {hint ? <p className="relative mt-2.5 truncate text-xs text-ink-faint">{hint}</p> : null}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */

function ChartCard({ title, subtitle, children, footer }) {
  return (
    <div className="card flex h-full flex-col p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-ink-faint">{subtitle}</p> : null}
      </div>
      <div className="flex-1">{children}</div>
      {footer ? <div className="mt-4 border-t pt-4">{footer}</div> : null}
    </div>
  )
}

function useChartColors() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return {
    axis: dark ? '#64748b' : '#94a3b8',
    grid: dark ? 'rgba(226,232,240,0.08)' : 'rgba(15,23,42,0.07)',
    tooltipBg: dark ? '#171b24' : '#ffffff',
    tooltipBorder: dark ? 'rgba(226,232,240,0.12)' : 'rgba(15,23,42,0.10)',
    tooltipText: dark ? '#e2e8f0' : '#0f172a',
  }
}

function ChartTooltip({ active, payload, label, formatter }) {
  const c = useChartColors()
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-lift"
      style={{ background: c.tooltipBg, borderColor: c.tooltipBorder, color: c.tooltipText }}
    >
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="tnum text-ink-muted">
          {formatter ? formatter(entry) : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  )
}

function SubjectAverageChart({ data }) {
  const c = useChartColors()
  const rows = data.map((s) => ({ ...s, name: s.shortName }))

  return (
    <ChartCard
      title="Subject-wise average"
      subtitle="Mean total out of 100 across the cohort"
      footer={
        <ul className="grid gap-2 sm:grid-cols-2">
          {data.map((s) => (
            <li key={s.subjectId} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-ink-muted">
                <span className="font-semibold text-ink">{s.shortName}</span> · {s.name}
              </span>
              <span className="tnum shrink-0 text-ink-faint">{s.credits} cr</span>
            </li>
          ))}
        </ul>
      }
    >
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -18, bottom: 0 }} barSize={38}>
            <defs>
              <linearGradient id="barAccent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke={c.axis}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              domain={[0, 100]}
              stroke={c.axis}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              width={44}
            />
            <Tooltip
              cursor={{ fill: c.grid }}
              content={
                <ChartTooltip
                  formatter={(entry) => `Average total: ${entry.value} / 100`}
                />
              }
            />
            <Bar dataKey="averageTotal" name="Average" fill="url(#barAccent)" radius={[8, 8, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

function GradeDistributionChart({ data }) {
  const c = useChartColors()
  const total = data.reduce((sum, g) => sum + g.count, 0)

  return (
    <ChartCard
      title="Grade distribution"
      subtitle={`${total} subject grades awarded`}
      footer={
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {data
            .filter((g) => g.count > 0)
            .map((g) => (
              <span key={g.grade} className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: gradeColor(g.grade) }}
                  aria-hidden="true"
                />
                {g.grade}
                <span className="tnum text-ink-faint">({g.count})</span>
              </span>
            ))}
        </div>
      }
    >
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: -16, bottom: 0 }}
            barSize={18}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="grade"
              stroke={c.axis}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fontWeight: 600 }}
              width={48}
            />
            <Tooltip
              cursor={{ fill: c.grid }}
              content={
                <ChartTooltip
                  formatter={(entry) =>
                    `${entry.value} ${entry.value === 1 ? 'subject' : 'subjects'}`
                  }
                />
              }
            />
            <Bar dataKey="count" name="Subjects" radius={[4, 8, 8, 4]}>
              {data.map((g) => (
                <Cell key={g.grade} fill={gradeColor(g.grade)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

function DivisionTable({ rows }) {
  if (!rows?.length) return null

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="mb-5 text-base font-semibold text-ink">Division breakdown</h2>

      {/* Below sm the table becomes stacked label/value cards. */}
      <div className="grid gap-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.division} className="card-flat p-4">
            <p className="font-display text-sm font-semibold text-ink">Division {row.division}</p>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Stat label="Students" value={row.studentCount} />
              <Stat label="Avg SGPA" value={formatSgpa(row.averageSgpa)} />
              <Stat label="Pass" value={formatPercent(row.passPercentage)} />
            </dl>
          </div>
        ))}
      </div>

      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-semibold text-ink-faint">Division</th>
              <th className="pb-3 text-right font-semibold text-ink-faint">Students</th>
              <th className="pb-3 text-right font-semibold text-ink-faint">Average SGPA</th>
              <th className="pb-3 text-right font-semibold text-ink-faint">Pass %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.division} className="border-b last:border-0">
                <td className="py-3 font-semibold text-ink">Division {row.division}</td>
                <td className="tnum py-3 text-right text-ink-muted">{row.studentCount}</td>
                <td className="tnum py-3 text-right text-ink">{formatSgpa(row.averageSgpa)}</td>
                <td className="tnum py-3 text-right text-ink-muted">
                  {formatPercent(row.passPercentage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-ink-faint">{label}</dt>
      <dd className="tnum mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-4 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <div className="card space-y-4 p-6 xl:col-span-3">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-[290px] w-full" />
        </div>
        <div className="card space-y-4 p-6 xl:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-[290px] w-full" />
        </div>
      </div>
    </>
  )
}
