import { addDays } from '../lib/dates'
import { tr } from '../i18n'

interface Props {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  maxDays?: number
}

const field = 'w-full rounded-xl bg-slate-800 px-3 py-2 text-base text-fg outline-none ring-2 ring-transparent focus:ring-indigo-500'

/** Two date inputs for a free interval; keeps "to" on or after "from" and within `maxDays`. */
export function RangePicker({ from, to, onChange, maxDays = 366 }: Props) {
  const fix = (f: string, t: string, changed: 'from' | 'to') => {
    if (!f || !t) return
    if (t < f) changed === 'from' ? (t = f) : (f = t)
    const limit = addDays(f, maxDays - 1)
    if (t > limit) changed === 'from' ? (t = limit) : (f = addDays(t, -(maxDays - 1)))
    onChange(f, t)
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-[11px] text-slate-400">{tr('Από')}
        <input type="date" value={from} onChange={(e) => fix(e.target.value, to, 'from')} className={`${field} mt-0.5`} />
      </label>
      <label className="text-[11px] text-slate-400">{tr('Έως')}
        <input type="date" value={to} onChange={(e) => fix(from, e.target.value, 'to')} className={`${field} mt-0.5`} />
      </label>
    </div>
  )
}
