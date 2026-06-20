import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

/** Bottom sheet modal — slide up, neumorphic background. */
export function Sheet({ open, onClose, children, title }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 no-scrollbar dark:bg-[#221519]"
            style={{ boxShadow: '0 -8px 40px rgba(114,40,58,0.18)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            {/* Grip indicator */}
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-maroon-200 dark:bg-maroon-700/60" />
            {title && (
              <h2 className="mb-4 text-center text-base font-bold text-maroon-800 dark:text-maroon-200">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
