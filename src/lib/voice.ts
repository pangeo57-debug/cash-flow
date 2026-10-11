import type { TxType } from '../types'
import { guessCategory, norm } from './autocat'
import { getLang, type Lang } from '../i18n'

export interface Spoken {
  type: TxType
  amount: number
  note: string
  category: string
}

const CUR = '(?:€|eur|euro|euros|ευρώ|ευρω|ευρο)'
const NUM = '(\\d{1,3}(?:[.\\s]\\d{3})+(?:,\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)'

const INCOME_WORDS = [
  'ΕΣΟΔΟ', 'ΕΙΣΠΡΑΞΑ', 'ΠΗΡΑ', 'ΜΟΥ ΕΔΩΣΕ', 'ΜΟΥ ΕΣΤΕΙΛΕ', 'ΠΛΗΡΩΘΗΚΑ', 'ΕΛΑΒΑ', 'ΚΕΡΔΙΣΑ',
  'EARNED', 'RECEIVED', 'GOT PAID', 'INCOME', 'ERHALTEN', 'VERDIENT', 'EINNAHME', 'RECU', 'GAGNE', 'REVENU', 'RICEVUTO', 'GUADAGNATO', 'ENTRATA', 'INCASSATO',
]
const LEAD_WORDS = new Set('ΞΟΔΕΨΑ ΠΛΗΡΩΣΑ ΕΔΩΣΑ ΕΒΑΛΑ ΓΙΑ ΕΞΟΔΟ ΕΣΟΔΟ ΕΙΠΑ ΕΙΣΠΡΑΞΑ ΠΗΡΑ ΕΛΑΒΑ ΚΕΡΔΙΣΑ ΠΛΗΡΩΘΗΚΑ ΜΟΥ ΕΔΩΣΕ ΕΣΤΕΙΛΕ SPENT PAID FOR ON EXPENSE INCOME I RECEIVED EARNED GOT AUSGABE EINNAHME ICH HABE FUR DEPENSE POUR DE J AI JE REÇU RECU GAGNE REVENU SPESA ENTRATA PER HO SPESO PAGATO RICEVUTO GUADAGNATO ERHALTEN VERDIENT BEZAHLT AUSGEGEBEN DEPENSE PAYE'.split(' '))

const CATEGORY_HINTS: [string, string[]][] = [
  ['Tips', ['TIP', 'ΦΙΛΟΔΩΡΗΜΑ', 'ΤΙΠ', 'TRINKGELD', 'POURBOIRE', 'MANCIA']],
  ['Επίδομα', ['ΕΠΙΔΟΜΑ', 'ΤΑΜΕΙΟ ΑΝΕΡΓΙΑΣ', 'ΔΥΠΑ', 'BENEFIT', 'ARBEITSLOSENGELD', 'ALLOCATION', 'SUSSIDIO']],
  ['Μάθημα', ['ΜΑΘΗΜΑ', 'LESSON', 'STUNDE', 'COURS', 'LEZIONE']],
]

/** "150 ευρώ ρουλεμάν αυτοκίνητο" → expense 150, note "ρουλεμάν αυτοκίνητο", category guessed from the words. */
export function parseSpoken(raw: string, learned: Record<string, string> = {}): Spoken | null {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return null
  const withCur = text.match(new RegExp(`${NUM}\\s*${CUR}(?=\\s|$|[.,;!?])`, 'i')) ?? text.match(new RegExp(`${CUR}\\s*${NUM}`, 'i'))
  const m = withCur ?? text.match(new RegExp(NUM))
  if (!m) return null
  const numStr = withCur && /^[^\d]/.test(m[0]) ? m[1] : m[1]
  let s = numStr.replace(/\s/g, '')
  if (/,/.test(s) && /\./.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else if (/,\d{1,2}$/.test(s)) s = s.replace(',', '.')
  else s = s.replace(/[.,](?=\d{3}\b)/g, '')
  const amount = Math.round(parseFloat(s) * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) return null

  const rest = (text.slice(0, m.index) + ' ' + text.slice((m.index ?? 0) + m[0].length)).replace(/\s+/g, ' ').trim()
  const n = ` ${norm(rest)} `
  const income = INCOME_WORDS.some((w) => n.includes(` ${w}`))
  // leading verbs/prepositions ("ξόδεψα 12 € για …") are not part of the description
  const words = rest.split(' ')
  while (words.length > 1 && LEAD_WORDS.has(norm(words[0]))) words.shift()
  let note = words.join(' ').replace(/^[,.;:\-–\s]+|[,.;:\-–\s]+$/g, '')
  note = note.charAt(0).toUpperCase() + note.slice(1)

  let category: string
  if (income) category = CATEGORY_HINTS.find(([, ws]) => ws.some((w) => n.includes(` ${w}`)))?.[0] ?? 'Άλλο Έσοδο'
  else category = guessCategory(rest, learned)
  return { type: income ? 'income' : 'expense', amount, note, category }
}

/* ---------- speech recognition (Web Speech API; availability depends on browser/OS) ---------- */

const LOCALES: Record<Lang, string> = { el: 'el-GR', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT' }

interface Rec {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

const ctor = (): (new () => Rec) | undefined => {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const speechSupported = () => typeof window !== 'undefined' && !!ctor()

/** Starts listening; `onText` gets the running transcript. Returns a stop function. */
export function listen(onText: (t: string, final: boolean) => void, onEnd: (error?: string) => void): () => void {
  const R = ctor()
  if (!R) {
    onEnd('unsupported')
    return () => {}
  }
  const rec = new R()
  rec.lang = LOCALES[getLang()]
  rec.interimResults = true
  rec.continuous = false
  let err: string | undefined
  rec.onresult = (e) => {
    let t = ''
    let final = false
    for (let i = 0; i < e.results.length; i++) {
      t += e.results[i][0].transcript
      final = final || e.results[i].isFinal
    }
    onText(t, final)
  }
  rec.onerror = (e) => { err = e.error }
  rec.onend = () => onEnd(err)
  try {
    rec.start()
  } catch {
    onEnd('start')
  }
  return () => { try { rec.stop() } catch { /* ignore */ } }
}
