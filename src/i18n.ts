import { useSyncExternalStore } from 'react'
import en from './locales/en'
import de from './locales/de'
import fr from './locales/fr'
import it from './locales/it'

/**
 * The source text of the app is Greek, and Greek strings are the translation keys.
 * `tr('Αποθήκευση')` returns the string for the current language, falling back to English and then to the key itself.
 * Placeholders are positional: tr('Έμειναν {0}', money) .
 */
export type Lang = 'el' | 'en' | 'de' | 'fr' | 'it'

export const LANGS: { id: Lang; label: string; locale: string }[] = [
  { id: 'el', label: 'Ελληνικά', locale: 'el-GR' },
  { id: 'en', label: 'English', locale: 'en-GB' },
  { id: 'de', label: 'Deutsch', locale: 'de-DE' },
  { id: 'fr', label: 'Français', locale: 'fr-FR' },
  { id: 'it', label: 'Italiano', locale: 'it-IT' },
]

const DICTS: Record<Exclude<Lang, 'el'>, Record<string, string>> = { en, de, fr, it }
const KEY = 'cashflow:lang'

function detect(): Lang {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored && LANGS.some((l) => l.id === stored)) return stored as Lang
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || 'el').slice(0, 2).toLowerCase()
  return (LANGS.find((l) => l.id === nav)?.id ?? 'en') as Lang
}

let current: Lang = detect()
if (typeof document !== 'undefined') document.documentElement.lang = current
const listeners = new Set<() => void>()

export const getLang = () => current

export function setLang(l: Lang) {
  current = l
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* ignore */
  }
  document.documentElement.lang = l
  listeners.forEach((f) => f())
}

/** Re-renders the component when the language changes. */
export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}

export const locale = () => LANGS.find((l) => l.id === current)!.locale

export function tr(key: string, ...args: (string | number | undefined)[]): string {
  const raw = current === 'el' ? key : (DICTS[current][key] ?? DICTS.en[key] ?? key)
  return args.length ? raw.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? '')) : raw
}
