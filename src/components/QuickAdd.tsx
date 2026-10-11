import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { Sheet } from './Sheet'
import { categoriesFor, findCategory } from '../constants'
import { listen, parseSpoken, speechSupported } from '../lib/voice'
import { money } from '../lib/dates'
import { tr } from '../i18n'
import type { TxType } from '../types'

interface Props {
  learned: Record<string, string>
  onSave: (v: { type: TxType; category: string; amount: number; note: string }) => void
  onClose: () => void
}

/** Say or type "150 euros wheel bearing car" → the app finds amount, description and category. */
export function QuickAdd({ learned, onSave, onClose }: Props) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [msg, setMsg] = useState('')
  const [catOverride, setCatOverride] = useState<string | null>(null)
  const stop = useRef<() => void>(() => {})
  const supported = speechSupported()
  const parsed = useMemo(() => parseSpoken(text, learned), [text, learned])
  const category = catOverride ?? parsed?.category

  useEffect(() => setCatOverride(null), [text])
  useEffect(() => () => stop.current(), [])

  const toggle = () => {
    if (listening) {
      stop.current()
      return
    }
    if (!supported) {
      setMsg(tr('Η αναγνώριση φωνής δεν δουλεύει εδώ. Πάτα το μικρόφωνο του πληκτρολογίου σου και υπαγόρευσε.'))
      return
    }
    setMsg('')
    setText('')
    setListening(true)
    stop.current = listen(
      (t) => setText(t),
      (err) => {
        setListening(false)
        if (err === 'not-allowed' || err === 'service-not-allowed') setMsg(tr('Δεν επιτράπηκε το μικρόφωνο. Δώσε την άδεια στις ρυθμίσεις του browser.'))
        else if (err === 'unsupported' || err === 'start') setMsg(tr('Η αναγνώριση φωνής δεν δουλεύει εδώ. Πάτα το μικρόφωνο του πληκτρολογίου σου και υπαγόρευσε.'))
      },
    )
  }

  const inc = parsed?.type === 'income'
  return (
    <Sheet title={tr('Γρήγορη καταγραφή')} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-400">{tr('Πάτα το μικρόφωνο και πες το ποσό και τι αγόρασες, ή γράψε το.')}</p>
      <div className="mb-3 flex gap-2">
        <input
          autoFocus={!supported}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr('π.χ. 150 ευρώ ρουλεμάν αυτοκίνητο')}
          className="min-w-0 flex-1 rounded-2xl bg-slate-800 px-4 py-3 text-base text-fg outline-none ring-2 ring-transparent placeholder:text-slate-500 focus:ring-indigo-500"
        />
        <button onClick={toggle} aria-label={tr('Φωνητική καταγραφή')} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white active:scale-95 ${listening ? 'animate-pulse bg-rose-500' : 'bg-indigo-500'}`}>
          <Mic size={22} />
        </button>
      </div>
      {listening && <p className="mb-2 text-sm font-medium text-rose-400">{tr('Ακούω…')}</p>}
      {msg && <p className="mb-2 text-xs text-amber-400">{msg}</p>}

      {text.trim() && (
        parsed ? (
          <div className="mb-3 rounded-2xl bg-slate-800 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-sm text-slate-200">{parsed.note || findCategory(category!).label}</span>
              <span className={`text-xl font-bold ${inc ? 'text-emerald-400' : 'text-rose-400'}`}>{inc ? '+' : '−'}{money(parsed.amount)}</span>
            </div>
            <label className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
              {tr('Κατηγορία')}
              <select value={category} onChange={(e) => setCatOverride(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-slate-900 px-3 py-2 text-base text-fg outline-none">
                {categoriesFor(parsed.type).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
          </div>
        ) : (
          <p className="mb-3 text-xs text-slate-400">{tr('Δεν βρέθηκε ποσό. Πες π.χ. «150 ευρώ …».')}</p>
        )
      )}

      <button
        disabled={!parsed}
        onClick={() => parsed && onSave({ type: parsed.type, category: category!, amount: parsed.amount, note: parsed.note })}
        className={`w-full rounded-2xl py-3.5 text-base font-semibold text-white active:scale-[.98] disabled:opacity-40 ${inc ? 'bg-emerald-500' : 'bg-rose-500'}`}
      >
        {tr('Καταγραφή')}
      </button>
    </Sheet>
  )
}
