import type { ReactNode } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

/** Bottom sheet modal — slide up, geser grip ke bawah untuk menutup. */
export function Sheet({ open, onClose, children, title }: SheetProps) {
  const dragControls = useDragControls()

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
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] max-w-md touch-pan-y scroll-smooth overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] no-scrollbar dark:bg-[#221519]"
            style={{ boxShadow: '0 -8px 40px rgba(114,40,58,0.18)', WebkitOverflowScrolling: 'touch' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            // Geser ke bawah untuk menutup — hanya dari grip (dragListener=false)
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 700) onClose()
            }}
          >
            {/* Area grip — tarik ke bawah untuk menutup */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="-mx-5 -mt-5 mb-3 cursor-grab touch-none px-5 pb-1 pt-4 active:cursor-grabbing"
            >
              <div className="mx-auto h-1.5 w-14 rounded-full bg-maroon-200 dark:bg-maroon-700/60" />
              {title && (
                <h2 className="mt-3 text-center text-base font-bold text-maroon-800 dark:text-maroon-200">
                  {title}
                </h2>
              )}
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
