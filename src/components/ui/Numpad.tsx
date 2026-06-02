import { Delete } from 'lucide-react'

interface NumpadProps {
  onInput: (digit: string) => void
  onBackspace: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del']

/** Keypad angka custom, ramah jempol di mobile. */
export function Numpad({ onInput, onBackspace }: NumpadProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((k) => {
        if (k === 'del') {
          return (
            <button
              key={k}
              onClick={onBackspace}
              className="flex h-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 active:scale-95 dark:bg-gray-800 dark:text-gray-300"
              aria-label="Hapus"
            >
              <Delete size={22} />
            </button>
          )
        }
        return (
          <button
            key={k}
            onClick={() => onInput(k)}
            className="h-14 rounded-2xl bg-gray-100 text-xl font-semibold text-gray-800 active:scale-95 dark:bg-gray-800 dark:text-gray-100"
          >
            {k}
          </button>
        )
      })}
    </div>
  )
}
