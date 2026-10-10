import {
  Apple, Landmark, Bus, Coffee, Dices, Fuel, GraduationCap, HandCoins, ListChecks, PartyPopper, Pill,
  Plane, Plus, Route, Shuffle, ShoppingBag, ShoppingCart, Utensils, Zap,
  type LucideIcon,
} from 'lucide-react'
import type { TxType } from './types'
import { tr } from './i18n'

export interface Category {
  id: string
  label: string
  icon: LucideIcon
  color: string
}

// labels are getters so they follow the current language; ids stay Greek because they are stored in the data
const cat = (id: string, label: string, icon: LucideIcon, color: string): Category => ({
  id,
  get label() {
    return tr(label)
  },
  icon,
  color,
})

export const LESSON_CATEGORY = 'Μάθημα'

export const INCOME_CATEGORIES: Category[] = [
  cat('Μάθημα', 'Μάθημα', GraduationCap, '#34d399'),
  cat('Tips', 'Tips / Φιλοδώρημα', HandCoins, '#2dd4bf'),
  cat('Τζόγος', 'Τζόγος / Στοίχημα', Dices, '#a3e635'),
  cat('Επίδομα', 'Ταμείο ανεργίας / Επίδομα', Landmark, '#60a5fa'),
  cat('Άλλο Έσοδο', 'Άλλο Έσοδο', Plus, '#38bdf8'),
]

export const EXPENSE_CATEGORIES: Category[] = [
  cat('Τρόφιμα', 'Τρόφιμα', Apple, '#f43f5e'),
  cat('Μετακινήσεις', 'Μετακινήσεις', Bus, '#f97316'),
  cat('Βενζίνη', 'Βενζίνη', Fuel, '#f59e0b'),
  cat('Διόδια', 'Διόδια', Route, '#eab308'),
  cat('Ταξίδια', 'Ταξίδια', Plane, '#38bdf8'),
  cat('Φαγητό', 'Φαγητό', Utensils, '#fb7185'),
  cat('Καφές', 'Καφές', Coffee, '#a16207'),
  cat('Σούπερ Μάρκετ', 'Σούπερ Μάρκετ', ShoppingCart, '#22c55e'),
  cat('Ρεύμα', 'Ρεύμα', Zap, '#facc15'),
  cat('Τα απαραίτητα', 'Τα απαραίτητα', ListChecks, '#818cf8'),
  cat('Αγορές', 'Αγορές', ShoppingBag, '#c084fc'),
  cat('Διασκέδαση', 'Διασκέδαση', PartyPopper, '#e879f9'),
  cat('Υγεία', 'Υγεία / Φαρμακείο', Pill, '#2dd4bf'),
  cat('Κουλουλού', 'Κουλουλού (διάφορα)', Shuffle, '#94a3b8'),
]

export const categoriesFor = (t: TxType) => (t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)

export const findCategory = (id: string): Category =>
  [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find((c) => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]

// Categories counted as "transport" for the fuel/tolls insight.
export const TRANSPORT_CATEGORIES = ['Βενζίνη', 'Διόδια', 'Μετακινήσεις']
export const EATING_OUT_CATEGORIES = ['Φαγητό', 'Καφές']

/** Display name for a category id (also handles the synthetic "Άλλα" bucket used in charts). */
export const catLabel = (id: string): string => (id === 'Άλλα' ? tr('Άλλα') : findCategory(id).label)
