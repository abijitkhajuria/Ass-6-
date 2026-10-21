/** Presentation-only helpers. No grading logic lives here. */

export function formatSgpa(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toFixed(2)
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(1)}%`
}

export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) return '—'
  return Number(value).toFixed(decimals)
}

export function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Colour per grade, used for chart bars and grade chips.
 * Semantics only: F is rose, everything else steps down the accent ramp.
 */
export const GRADE_COLORS = {
  O: '#6366f1',
  'A+': '#818cf8',
  A: '#22d3ee',
  'B+': '#38bdf8',
  B: '#2dd4bf',
  C: '#f59e0b',
  P: '#fb923c',
  F: '#f43f5e',
}

export function gradeColor(grade) {
  return GRADE_COLORS[grade] ?? '#94a3b8'
}

/** Tailwind classes for a grade chip. */
export function gradeChipClass(grade) {
  if (grade === 'F') return 'bg-fail/10 text-fail ring-1 ring-inset ring-fail/25'
  if (grade === 'O' || grade === 'A+') {
    return 'bg-accent/12 text-accent-soft ring-1 ring-inset ring-accent/30'
  }
  if (grade === 'C' || grade === 'P') {
    return 'bg-warn/10 text-warn ring-1 ring-inset ring-warn/25'
  }
  return 'bg-ink/[0.06] text-ink-muted ring-1 ring-inset ring-ink/10'
}

export function statusLabel(status) {
  if (status === 'PASS') return 'Pass'
  if (status === 'FAIL') return 'Fail'
  return 'Incomplete'
}
