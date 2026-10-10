import { locale, tr } from '../i18n'
export const toISO = (d: Date): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const parseISO = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = () => toISO(new Date())

export const addDays = (iso: string, n: number): string => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

// Monday-based weekday index: Mon=0 … Sun=6
export const weekdayIndex = (iso: string): number => (parseISO(iso).getDay() + 6) % 7

const wdCache = new Map<string, string[]>()
/** Mon..Sun abbreviations in the current language. */
export function weekdaysShort(): string[] {
  const loc = locale()
  let v = wdCache.get(loc)
  if (!v) {
    v = Array.from({ length: 7 }, (_, i) => {
      const w = new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: 'short' }).replace(/\.$/, '')
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    wdCache.set(loc, v)
  }
  return v
}

export type Period = 'day' | 'week' | 'fortnight' | 'month'

export const periodLabels = (): Record<Period, string> => ({
  day: tr('Ημέρα'),
  week: tr('Εβδομάδα'),
  fortnight: tr('15ήμερο'),
  month: tr('Μήνας'),
})

export function periodRange(period: Period, anchor: string): { from: string; to: string } {
  const d = parseISO(anchor)
  switch (period) {
    case 'day':
      return { from: anchor, to: anchor }
    case 'week': {
      const from = addDays(anchor, -weekdayIndex(anchor))
      return { from, to: addDays(from, 6) }
    }
    case 'fortnight': {
      const y = d.getFullYear()
      const m = d.getMonth()
      return d.getDate() <= 15
        ? { from: toISO(new Date(y, m, 1)), to: toISO(new Date(y, m, 15)) }
        : { from: toISO(new Date(y, m, 16)), to: toISO(new Date(y, m + 1, 0)) }
    }
    case 'month':
      return { from: toISO(new Date(d.getFullYear(), d.getMonth(), 1)), to: toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }
  }
}

export const formatLong = (iso: string) =>
  parseISO(iso).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })

export const formatShort = (iso: string) =>
  parseISO(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })

const eurCache = new Map<string, Intl.NumberFormat>()
export const money = (n: number) => {
  const loc = locale()
  let f = eurCache.get(loc)
  if (!f) {
    f = new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR' })
    eurCache.set(loc, f)
  }
  return f.format(n)
}
