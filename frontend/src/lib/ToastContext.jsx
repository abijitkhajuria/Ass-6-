import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

const ACCENTS = {
  success: 'text-pass',
  error: 'text-fail',
  info: 'text-accent-soft',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, variant = 'info', duration = 5000) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, variant }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (message) => push(message, 'success'),
      // Errors linger longer: they usually carry a validation message to read.
      error: (message) => push(message, 'error', 7000),
      info: (message) => push(message, 'info'),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="toast-viewport pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col
                   items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.variant] ?? Info
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border
                           bg-surface-raised/95 px-4 py-3 shadow-lift backdrop-blur"
                role="status"
                aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
              >
                <Icon
                  className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${ACCENTS[toast.variant]}`}
                  size={18}
                  aria-hidden="true"
                />
                <p className="flex-1 text-sm leading-relaxed text-ink">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="-mr-1 -mt-1 rounded-lg p-1 text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
                  aria-label="Dismiss notification"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
