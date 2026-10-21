import { motion } from 'framer-motion'
import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react'
import { gradeChipClass, statusLabel } from '../lib/format'

/* ------------------------------------------------------------------ *
 * Motion presets - fast and restrained: 150-300ms, no bounce.
 * ------------------------------------------------------------------ */

export const EASE = [0.22, 1, 0.36, 1]

export const fadeRise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
}

export const stagger = (delayChildren = 0.04) => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren } },
})

/* ------------------------------------------------------------------ *
 * Status and grade chips - never colour alone, always with a label.
 * ------------------------------------------------------------------ */

export function StatusPill({ status, className = '' }) {
  const config = {
    PASS: { cls: 'bg-pass/12 text-pass ring-1 ring-inset ring-pass/30', Icon: CheckCircle2 },
    FAIL: { cls: 'bg-fail/12 text-fail ring-1 ring-inset ring-fail/30', Icon: XCircle },
    INCOMPLETE: {
      cls: 'bg-warn/10 text-warn ring-1 ring-inset ring-warn/25',
      Icon: CircleDashed,
    },
  }[status] ?? {
    cls: 'bg-ink/[0.06] text-ink-muted ring-1 ring-inset ring-ink/10',
    Icon: CircleDashed,
  }

  const { cls, Icon } = config

  return (
    <span className={`pill ${cls} ${className}`}>
      <Icon size={12} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

export function GradeChip({ grade, className = '' }) {
  return (
    <span className={`pill tnum justify-center ${gradeChipClass(grade)} ${className}`}>{grade}</span>
  )
}

/* ------------------------------------------------------------------ *
 * States
 * ------------------------------------------------------------------ */

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center">
      {Icon ? (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-surface-sunken text-ink-faint">
          <Icon size={20} aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-fail/25 bg-fail/[0.04] px-6 py-14 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-fail/10 text-fail">
        <XCircle size={20} aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-ink">Something went wrong</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-ghost mt-5">
          Try again
        </button>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Page header
 * ------------------------------------------------------------------ */

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-soft">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold leading-tight text-ink sm:text-[2.1rem]">{title}</h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div> : null}
    </motion.header>
  )
}
