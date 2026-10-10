import { useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'
import { Sheet } from './Sheet'
import { addDays, formatShort, parseISO, periodRange, todayISO, toISO, weekdayIndex, weekdaysShort } from '../lib/dates'
import { locale, tr } from '../i18n'

interface Props {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  maxDays?: number
}

/** One button that shows the chosen interval and opens a calendar: tap the first day, then the last. */
export function RangePicker({ from, to, onChange, maxDays = 366 }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex w-full items-center justify-between gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-left active:scale-[.99]">
        <span className="flex items-center gap-2 text-sm font-semibold text-fg"><CalendarRange size={18} className="text-indigo-300" /> {tr('Επέλεξε ημερομηνίες')}</span>
        <span className="text-sm text-slate-300">{from === to ? formatShort(from) : `${formatShort(from)} – ${formatShort(to)}`}</span>
      </button>
      {open && <Calendar from={from} to={to} maxDays={maxDays} onClose={() => setOpen(false)} onApply={(f, t) => { onChange(f, t); setOpen(false) }} />}
    </>
  )
}

function Calendar({ from, to, maxDays, onClose, onApply }: { from: string; to: string; maxDays: number; onClose: () => void; onApply: (f: string, t: string) => void }) {
  const today = todayISO()
  const [a, setA] = useState<string>(from)
  const [b, setB] = useState<string | null>(to) // null while the second day is still to be picked
  const [view, setView] = useState(() => parseISO(from))

  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const startPad = weekdayIndex(toISO(first))
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(view.getFullYear(), view.getMonth(), i + 1))),
  ]

  const pick = (d: string) => {
    if (b !== null) {
      setA(d)
      setB(null)
      return
    }
    let [x, y] = d < a ? [d, a] : [a, d]
    if (parseISO(y).getTime() - parseISO(x).getTime() > (maxDays - 1) * 86400000) y = addDays(x, maxDays - 1)
    setA(x)
    setB(y)
  }
  const preset = (f: string, t: string) => {
    setA(f)
    setB(t)
    setView(parseISO(f))
  }
  const lo = b ? a : a
  const hi = b ?? a
  const month = (delta: number) => setView(new Date(view.getFullYear(), view.getMonth() + delta, 1))
  const presets: [string, string, string][] = [
    [tr('Τελευταίες 7 ημέρες'), addDays(today, -6), today],
    [tr('Τελευταίες 30 ημέρες'), addDays(today, -29), today],
    [tr('Αυτός ο μήνας'), periodRange('month', today).from, periodRange('month', today).to],
    [tr('Προηγούμενος μήνας'), periodRange('month', addDays(periodRange('month', today).from, -1)).from, periodRange('month', addDays(periodRange('month', today).from, -1)).to],
  ]

  return (
    <Sheet title={tr('Επέλεξε ημερομηνίες')} onClose={onClose}>
      <div className="mb-3 flex flex-wrap gap-2">
        {presets.map(([label, f, t]) => (
          <button key={label} onClick={() => preset(f, t)} className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 active:scale-95">{label}</button>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => month(-1)} aria-label={tr('Προηγούμενη')} className="rounded-full bg-slate-800 p-2 active:scale-95"><ChevronLeft size={18} /></button>
        <p className="text-sm font-semibold capitalize text-fg">{view.toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}</p>
        <button onClick={() => month(1)} aria-label={tr('Επόμενη')} className="rounded-full bg-slate-800 p-2 active:scale-95"><ChevronRight size={18} /></button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] text-slate-500">
        {weekdaysShort().map((w) => <span key={w} className="py-1">{w}</span>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <span key={`p${i}`} />
          const inRange = d >= lo && d <= hi
          const edge = d === lo || d === hi
          return (
            <button
              key={d}
              onClick={() => pick(d)}
              className={`my-0.5 h-10 text-sm active:scale-95 ${edge ? 'mx-auto w-10 rounded-full bg-indigo-500 font-semibold text-white' : inRange ? 'bg-indigo-500/20 text-fg' : d === today ? 'mx-auto w-10 rounded-full text-indigo-400 ring-1 ring-indigo-400/60' : 'rounded-full text-slate-200'}`}
            >
              {Number(d.slice(8))}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        {b === null ? tr('Διάλεξε και την τελευταία ημέρα') : lo === hi ? formatShort(lo) : `${formatShort(lo)} – ${formatShort(hi)}`}
      </p>
      <button onClick={() => onApply(lo, hi)} className="mt-3 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 font-semibold text-white active:scale-[.98]">{tr('Εφαρμογή')}</button>
    </Sheet>
  )
}
