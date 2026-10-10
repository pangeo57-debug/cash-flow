import { useEffect, useState } from 'react'
import { Cloud, CalendarHeart, ShieldCheck, FileSpreadsheet, Gauge, X, Palette, Smartphone, Target, ClipboardPaste, Copy, Download, Pencil, Plus, Repeat } from 'lucide-react'
import type { ThemePref } from '../theme'
import { validateBackup } from '../storage/repository'
import type { SyncState } from '../useSync'
import { SETUP_SQL, genToken, isConfigured, loadCfg, saveCfg } from '../lib/cloud'
import type { AppData, RecurringTx, Settings as SettingsT } from '../types'
import { REGIONS, holidaysFor } from '../lib/holidays'
import { EXPENSE_CATEGORIES, findCategory } from '../constants'
import { bioAvailable, disableBio, enrollBio, loadLock, removeLock, setPin, setTimeoutSec, verifyPin } from '../lib/lock'
import { exportMonthly, exportTransactions } from '../lib/export'
import { formatShort, money, parseISO, todayISO } from '../lib/dates'
import { LANGS, locale, setLang, tr, useLang } from '../i18n'

interface Props {
  data: AppData
  onSettings: (p: Partial<SettingsT>) => void
  onAdd: () => void
  onEdit: (r: RecurringTx) => void
  onImport: (d: AppData) => Promise<void>
  onImportInbox: (text: string) => Promise<{ added: number; skipped: number; invalid: number }>
  onSync: () => Promise<{ added: number; invalid?: number; error?: string }>
  onPasteMessage: (text: string, day: string) => Promise<{ ok: boolean; summary?: string }>
  sync: SyncState
  onSyncNow: () => Promise<void>
  theme: ThemePref
  onTheme: (t: ThemePref) => void
}

function Security() {
  const [cfg, setCfg] = useState(loadLock)
  const [bioOk, setBioOk] = useState(false)
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [cur, setCur] = useState('')
  const [msg, setMsg] = useState('')
  const [mode, setMode] = useState<'idle' | 'change' | 'remove'>('idle')
  useEffect(() => { void bioAvailable().then(setBioOk) }, [])
  const refresh = () => setCfg(loadLock())
  const field = 'w-full rounded-xl bg-slate-900 px-3 py-2.5 text-base text-fg outline-none placeholder:text-slate-500'
  const valid = /^\d{4,6}$/.test(pin1) && pin1 === pin2

  const activate = async () => {
    await setPin(pin1, cfg ? { timeout: cfg.timeout, bio: cfg.bio } : undefined)
    setPin1(''); setPin2(''); setMode('idle'); refresh()
    setMsg(tr('Ο κωδικός ορίστηκε.'))
  }
  const remove = async () => {
    if (!(await verifyPin(cur))) { setMsg(tr('Λάθος κωδικός.')); return }
    removeLock(); setCur(''); setMode('idle'); refresh(); setMsg(tr('Το κλείδωμα απενεργοποιήθηκε.'))
  }
  const toggleBio = async (on: boolean) => {
    if (!on) { disableBio(); refresh(); return }
    setMsg((await enrollBio()) ? tr('Το Face ID ενεργοποιήθηκε.') : tr('Δεν ενεργοποιήθηκε το Face ID.'))
    refresh()
  }

  return (
    <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><ShieldCheck size={16} className="text-indigo-300" /> {tr('Κλείδωμα εφαρμογής')}</h2>
      {!cfg || mode === 'change' ? (
        <>
          <p className="text-xs text-slate-400">{tr('Κωδικός 4 έως 6 ψηφίων που ζητείται όταν ανοίγεις την εφαρμογή.')}</p>
          <input inputMode="numeric" type="password" maxLength={6} placeholder={tr('Νέος κωδικός')} value={pin1} onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))} className={field} />
          <input inputMode="numeric" type="password" maxLength={6} placeholder={tr('Επανάληψη κωδικού')} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} className={field} />
          <button disabled={!valid} onClick={() => void activate()} className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-40">{cfg ? tr('Αλλαγή κωδικού') : tr('Ενεργοποίηση κλειδώματος')}</button>
        </>
      ) : (
        <>
          <label className="flex items-center justify-between gap-3 text-sm text-slate-200">{tr('Κλείδωμα μετά από')}<select value={cfg.timeout} onChange={(e) => { setTimeoutSec(Number(e.target.value)); refresh() }} className="rounded-xl bg-slate-900 px-3 py-2 text-base text-fg outline-none">
              <option value={0}>{tr('Αμέσως')}</option><option value={60}>{tr('1 λεπτό')}</option><option value={300}>{tr('5 λεπτά')}</option><option value={900}>{tr('15 λεπτά')}</option>
            </select>
          </label>
          {bioOk && (
            <label className="flex items-center justify-between gap-3 text-sm text-slate-200">Face ID / Touch ID
              <input type="checkbox" checked={!!cfg.bio} onChange={(e) => void toggleBio(e.target.checked)} className="h-5 w-5 accent-indigo-500" />
            </label>
          )}
          {mode === 'remove' ? (
            <div className="flex gap-2">
              <input inputMode="numeric" type="password" maxLength={6} placeholder={tr('Τρέχων κωδικός')} value={cur} onChange={(e) => setCur(e.target.value.replace(/\D/g, ''))} className={field} />
              <button onClick={() => void remove()} className="rounded-xl bg-rose-500 px-3 text-sm font-semibold text-white">OK</button>
            </div>
          ) : (
            <div className="flex gap-2 text-sm">
              <button onClick={() => setMode('change')} className="flex-1 rounded-xl bg-slate-700 py-2 text-slate-100 active:scale-95">{tr('Αλλαγή κωδικού')}</button>
              <button onClick={() => setMode('remove')} className="flex-1 rounded-xl bg-slate-700 py-2 text-rose-300 active:scale-95">{tr('Απενεργοποίηση')}</button>
            </div>
          )}
        </>
      )}
      {msg && <p className="text-xs text-indigo-300">{msg}</p>}
      <p className="text-[11px] text-slate-500">{tr('Το κλείδωμα κρύβει την εφαρμογή, δεν κρυπτογραφεί τα δεδομένα στη συσκευή. Αν ξεχάσεις τον κωδικό, η μόνη λύση είναι διαγραφή των δεδομένων της συσκευής (κράτα αντίγραφο ή συγχρονισμό).')}</p>
    </section>
  )
}

function Budgets({ data, onSettings }: { data: AppData; onSettings: (p: Partial<SettingsT>) => void }) {
  const [cat, setCat] = useState(EXPENSE_CATEGORIES[0].id)
  const [amount, setAmount] = useState('')
  const budgets = data.settings.budgets
  const set = (next: Record<string, number>) => onSettings({ budgets: next })
  const add = () => {
    const v = parseFloat(amount.replace(',', '.'))
    if (!Number.isFinite(v) || v <= 0) return
    set({ ...budgets, [cat]: v })
    setAmount('')
  }
  return (
    <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><Gauge size={16} className="text-indigo-300" /> {tr('Όρια εξόδων (ανά μήνα)')}</h2>
      <div className="flex gap-2">
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-base text-fg outline-none">
          {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <input inputMode="decimal" placeholder="€" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-20 rounded-xl bg-slate-900 px-3 py-2.5 text-base text-fg outline-none placeholder:text-slate-500" />
        <button onClick={add} className="rounded-xl bg-indigo-500 px-3 text-sm font-semibold text-white active:scale-95">+</button>
      </div>
      {Object.keys(budgets).length === 0 && <p className="text-[11px] text-slate-500">{tr('π.χ. Καφές 40 €, Βενζίνη 150 €. Θα δεις μπάρες και προειδοποιήσεις στα Στατιστικά.')}</p>}
      <ul className="space-y-1.5">
        {Object.entries(budgets).map(([c, v]) => (
          <li key={c} className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-sm">
            <span className="text-slate-200">{findCategory(c).label}</span>
            <span className="flex items-center gap-2 font-medium text-fg">{money(v)}
              <button onClick={() => { const { [c]: _drop, ...rest } = budgets; void _drop; set(rest) }} aria-label={tr('Αφαίρεση')} className="text-slate-500"><X size={14} /></button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PasteMessage({ onPasteMessage }: { onPasteMessage: Props['onPasteMessage'] }) {
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [day, setDay] = useState(todayISO)
  const go = async () => {
    const r = await onPasteMessage(text, day)
    if (r.ok) {
      setMsg(tr('Καταγράφηκε: {0}. Πάτησέ την στη λίστα της ημέρας για να τη διορθώσεις.', r.summary))
      setText('')
    } else setMsg(tr('Δεν βρέθηκε ποσό στο μήνυμα. Πρέπει να περιέχει κάτι σαν «12,50€».'))
  }
  return (
    <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><ClipboardPaste size={16} className="text-indigo-300" /> {tr('Καταγραφή από μήνυμα τράπεζας')}</h2>
      <p className="text-xs text-slate-400">{tr('Αντίγραψε το μήνυμα (π.χ. από το Viber) και επικόλλησέ το εδώ. Η εφαρμογή βρίσκει μόνη της ποσό, μαγαζί και κατηγορία.')}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={tr('π.χ. Χρέωση κάρτας 12,50€ στο ΕΚΟ ΠΑΤΡΑΣ')} className="w-full rounded-2xl bg-slate-900 px-3 py-2 text-base text-fg outline-none placeholder:text-slate-500" />
      <label className="flex items-center justify-between gap-3 text-xs text-slate-400">{tr('Ημερομηνία κίνησης')}<input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="rounded-xl bg-slate-900 px-3 py-2 text-base text-fg outline-none" />
      </label>
      <button disabled={!text.trim() || !day} onClick={go} className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-40">{tr('Καταγραφή')}</button>
      {msg && <p className="text-xs text-indigo-300">{msg}</p>}
    </section>
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false)
  return (
    <div>
      <p className="mb-0.5 text-[11px] text-slate-400">{label}</p>
      <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2">
        <code className="min-w-0 flex-1 truncate text-xs text-slate-200">{value || '—'}</code>
        <button disabled={!value} onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500) } catch { /* ignore */ } }} className="shrink-0 text-xs font-semibold text-indigo-300 disabled:opacity-40">{done ? '✓' : tr('Αντιγραφή')}</button>
      </div>
    </div>
  )
}

function CloudSync({ onSync, sync, onSyncNow }: { onSync: Props['onSync']; sync: SyncState; onSyncNow: Props['onSyncNow'] }) {
  const [cfg, setCfg] = useState(loadCfg)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = isConfigured(cfg)
  const edit = (patch: Partial<typeof cfg>) => {
    const next = { ...cfg, ...patch }
    setCfg(next)
    saveCfg(next)
  }
  const test = async () => {
    setBusy(true)
    const r = await onSync()
    setBusy(false)
    setMsg(r.error ? tr('Αποτυχία σύνδεσης ({0}). Έλεγξε URL, κλειδί και ότι έτρεξες το SQL.', r.error) : r.invalid ? tr('Συνδέθηκε. Προστέθηκαν {0} πληρωμές· {1} άκυρες εγγραφές έμειναν στη θυρίδα για έλεγχο.', r.added, r.invalid) : r.added ? tr('Συνδέθηκε! Προστέθηκαν {0} πληρωμές.', r.added) : tr('Συνδέθηκε! Δεν υπάρχουν νέες πληρωμές αυτή τη στιγμή.'))
  }
  const input = 'w-full rounded-xl bg-slate-900 px-3 py-2.5 text-base text-fg outline-none ring-2 ring-transparent placeholder:text-slate-500 focus:ring-indigo-500'
  const step = 'flex gap-2 text-xs text-slate-300'
  const num = 'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300'
  const base = cfg.url.trim().replace(/\/+$/, '')
  return (
    <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><Cloud size={16} className="text-indigo-300" /> {tr('Πλήρως αυτόματη καταγραφή (Supabase)')}</h2>
      <p className="text-xs text-slate-400">{tr('Η Συντόμευση του iPhone στέλνει κάθε πληρωμή σε μια δωρεάν online «θυρίδα» και η εφαρμογή την παίρνει μόνη της όταν την ανοίγεις. Χωρίς αρχεία, χωρίς εισαγωγή.')}</p>
      <input value={cfg.url} onChange={(e) => edit({ url: e.target.value })} placeholder="Project URL (https://xxxx.supabase.co)" autoCapitalize="off" autoCorrect="off" className={input} />
      <input value={cfg.key} onChange={(e) => edit({ key: e.target.value })} placeholder="Publishable key (sb_publishable_…)" autoCapitalize="off" autoCorrect="off" className={input} />
      <div>
        <p className="mb-0.5 text-[11px] text-slate-400">{tr('Μυστικός κωδικός (δημιουργήθηκε αυτόματα). Στη δεύτερη συσκευή βάλε τον ίδιο.')}</p>
        <input value={cfg.token} onChange={(e) => edit({ token: e.target.value.trim() })} autoCapitalize="off" autoCorrect="off" spellCheck={false} className={`${input} font-mono text-xs`} />
      </div>
      <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-200">
        <span>{tr('Συγχρονισμός όλων των δεδομένων')}<span className="block text-[11px] text-slate-500">{tr('ανάμεσα στις συσκευές σου')}</span></span>
        <input type="checkbox" checked={!!cfg.sync} disabled={!ok} onChange={(e) => { edit({ sync: e.target.checked }); void onSyncNow() }} className="h-5 w-5 accent-indigo-500" />
      </label>
      {cfg.sync && (
        <p className={`text-xs ${sync.status === 'error' ? 'text-rose-400' : 'text-slate-400'}`}>
          {sync.status === 'syncing' ? tr('Συγχρονισμός…') : sync.status === 'error' ? tr('Αποτυχία συγχρονισμού ({0}). Έλεγξε ότι έτρεξες το νέο SQL.', sync.error) : sync.at ? tr('✓ Συγχρονίστηκε {0}', new Date(sync.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })) : tr('Έτοιμο')}
          {' '}<button onClick={() => void onSyncNow()} className="font-semibold text-indigo-300">{tr('Τώρα')}</button>
        </p>
      )}
      <button disabled={!ok || busy} onClick={test} className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-40">{busy ? tr('Έλεγχος…') : tr('Έλεγχος σύνδεσης / Συγχρονισμός τώρα')}</button>
      {msg && <p className="text-xs text-indigo-300">{msg}</p>}
      <details className="text-xs text-slate-400">
        <summary className="cursor-pointer py-1 font-medium text-slate-200">{tr('Οδηγίες εγκατάστασης (μία φορά)')}</summary>
        <ol className="mt-2 space-y-2">
          <li className={step}><span className={num}>1</span><span>{tr('Φτιάξε δωρεάν λογαριασμό στο')} <b>supabase.com</b> {tr('και ένα νέο project.')}</span></li>
          <li className={step}><span className={num}>2</span><span>{tr('Μενού')} <b>SQL Editor</b> {tr('→ επικόλλησε το SQL παρακάτω →')} <b>Run</b>.</span></li>
          <li className={step}><span className={num}>3</span><span><b>Project Settings → API Keys</b>{tr(': αντίγραψε το Project URL και το')} <b>Publishable key</b> {tr('(ή το παλιό κλειδί')} <b>anon</b>{tr(') και βάλ\' τα πιο πάνω. Μην χρησιμοποιήσεις Secret/service_role.')}</span></li>
          <li className={step}><span className={num}>4</span><span>{tr('Συντομεύσεις → Αυτοματισμός →')} <b>{tr('Συναλλαγή')}</b> {tr('(Εκτέλεση αμέσως). Πρόσθεσε')} <b>{tr('Μορφοποίηση ημερομηνίας')}</b> {tr('(Τρέχουσα ημερομηνία, ISO 8601).')}</span></li>
          <li className={step}><span className={num}>5</span><span>{tr('Πρόσθεσε')} <b>{tr('Λήψη περιεχομένων URL')}</b>{tr(': Μέθοδος')} <b>POST</b>{tr(', με τα στοιχεία από κάτω.')}</span></li>
        </ol>
        <div className="mt-3 space-y-2">
          <CopyField label={tr('SQL για το Supabase (αν το έτρεξες ήδη, τρέξ\' το ξανά για να προστεθεί ο συγχρονισμός, είναι ασφαλές)')} value={SETUP_SQL} />
          <CopyField label={tr('URL για τη Συντόμευση')} value={ok ? `${base}/rest/v1/rpc/add_payment` : ''} />
          <CopyField label={tr('Κεφαλίδα  apikey')} value={cfg.key.trim()} />
          {!cfg.key.trim().startsWith('sb_publishable_') && <CopyField label={tr('Κεφαλίδα  Authorization')} value={cfg.key.trim() ? `Bearer ${cfg.key.trim()}` : ''} />}
          <p>{tr('Κεφαλίδα')} <code className="rounded bg-slate-900 px-1">Content-Type</code> = <code className="rounded bg-slate-900 px-1">application/json</code>{tr('. Σώμα αιτήματος:')} <b>JSON</b> {tr('με τέσσερα πεδία (Κείμενο):')}</p>
          <ul className="space-y-0.5">
            <li><code className="rounded bg-slate-900 px-1">p_token</code> {tr('= ο μυστικός κωδικός πιο πάνω')}</li>
            <li><code className="rounded bg-slate-900 px-1">p_date</code> {tr('= η μορφοποιημένη ημερομηνία')}</li>
            <li><code className="rounded bg-slate-900 px-1">p_amount</code> {tr('= Ποσό (Amount)')}</li>
            <li><code className="rounded bg-slate-900 px-1">p_merchant</code> {tr('= Έμπορος (Merchant)')}</li>
          </ul>
        </div>
        <div className="mt-3 rounded-xl bg-slate-900 p-3">
          <p className="mb-1.5 font-semibold text-slate-200">{tr('Για μηνύματα Viber: κοινοποίηση με ένα πάτημα')}</p>
          <ol className="space-y-1.5">
            <li className={step}><span className={num}>1</span><span>{tr('Συντομεύσεις → + νέα συντόμευση, όνομα')} <b>Cash Flow</b>{tr('. Στις ρυθμίσεις της (i) ενεργοποίησε')} <b>{tr('Εμφάνιση στο Φύλλο Κοινής Χρήσης')}</b> {tr('και δέξου μόνο')} <b>{tr('Κείμενο')}</b>.</span></li>
            <li className={step}><span className={num}>2</span><span>{tr('Πρόσθεσε')} <b>{tr('Μορφοποίηση ημερομηνίας')}</b> {tr('(Τρέχουσα ημερομηνία, ISO 8601) και μετά')} <b>{tr('Λήψη περιεχομένων URL')}</b> {tr('με τα ίδια URL και κεφαλίδες όπως πιο πάνω.')}</span></li>
            <li className={step}><span className={num}>3</span><span>JSON: <code className="rounded bg-slate-800 px-1">p_token</code> {tr('= ο κωδικός,')} <code className="rounded bg-slate-800 px-1">p_date</code> {tr('= η ημερομηνία,')} <code className="rounded bg-slate-800 px-1">p_amount</code> = <b>{tr('κενό')}</b>, <code className="rounded bg-slate-800 px-1">p_merchant</code> = <b>{tr('Είσοδος Συντόμευσης')}</b> {tr('(το κείμενο του μηνύματος).')}</span></li>
            <li className={step}><span className={num}>4</span><span>{tr('Στο Viber: πάτημα στο μήνυμα →')} <b>{tr('Κοινοποίηση')}</b> → <b>Cash Flow</b>{tr('. Την επόμενη φορά που ανοίγεις την εφαρμογή, η κίνηση θα είναι εκεί.')}</span></li>
          </ol>
        </div>
        <button onClick={() => { edit({ token: genToken() }); setMsg(tr('Νέος κωδικός. Άλλαξέ τον και στη Συντόμευση.')) }} className="mt-3 text-[11px] text-slate-500 underline">{tr('Δημιουργία νέου κωδικού')}</button>
      </details>
    </section>
  )
}

function AutoCapture({ onImportInbox }: { onImportInbox: Props['onImportInbox'] }) {
  const [msg, setMsg] = useState('')
  const pick = async (file?: File) => {
    if (!file) return
    const r = await onImportInbox(await file.text())
    setMsg(tr('Προστέθηκαν {0} νέες κινήσεις{1}{2}.', r.added, r.skipped ? tr(' · {0} ήδη υπήρχαν', r.skipped) : '', r.invalid ? tr(' · {0} γραμμές δεν διαβάστηκαν', r.invalid) : ''))
  }
  const step = 'flex gap-2 text-xs text-slate-300'
  const num = 'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300'
  return (
    <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><Smartphone size={16} className="text-indigo-300" /> {tr('Αυτόματη καταγραφή από iPhone')}</h2>
      <p className="text-xs text-slate-400">{tr('Κάθε πληρωμή με Apple Pay γράφεται αυτόματα σε ένα αρχείο. Εσύ το εισάγεις εδώ με ένα πάτημα και οι κινήσεις μπαίνουν με κατηγορία.')}</p>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white active:scale-95">{tr('Εισαγωγή αρχείου (cashflow.txt)')}<input type="file" accept=".txt,.csv,text/plain" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      {msg && <p className="text-xs text-indigo-300">{msg}</p>}
      <details className="text-xs text-slate-400">
        <summary className="cursor-pointer py-1 font-medium text-slate-200">{tr('Πώς το στήνω (μία φορά)')}</summary>
        <ol className="mt-2 space-y-2">
          <li className={step}><span className={num}>1</span><span>{tr('Συντομεύσεις →')} <b>{tr('Αυτοματισμός')}</b> → + → <b>{tr('Συναλλαγή')}</b> {tr('(Transaction). Διάλεξε τις κάρτες σου και')} <b>{tr('Εκτέλεση αμέσως')}</b>.</span></li>
          <li className={step}><span className={num}>2</span><span>{tr('Πρόσθεσε')} <b>{tr('Μορφοποίηση ημερομηνίας')}</b> {tr('(Format Date): Τρέχουσα ημερομηνία, μορφή')} <b>ISO 8601</b>.</span></li>
          <li className={step}><span className={num}>3</span><span>{tr('Πρόσθεσε')} <b>{tr('Κείμενο')}</b> {tr('με αυτή τη γραμμή, βάζοντας τις μεταβλητές:')} <code className="rounded bg-slate-900 px-1">{tr('Ημερομηνία | Ποσό | Έμπορος')}</code></span></li>
          <li className={step}><span className={num}>4</span><span>{tr('Πρόσθεσε')} <b>{tr('Προσθήκη σε αρχείο κειμένου')}</b> {tr('(Append to Text File): iCloud Drive → Συντομεύσεις →')} <code className="rounded bg-slate-900 px-1">cashflow.txt</code>{tr(', με «Νέα γραμμή» ενεργή.')}</span></li>
          <li className={step}><span className={num}>5</span><span>{tr('Όταν θες, πάτα «Εισαγωγή αρχείου» και διάλεξε το')} <code className="rounded bg-slate-900 px-1">cashflow.txt</code>{tr('. Μπορείς να το ξαναεισάγεις όσες φορές θες, οι ήδη εισηγμένες δεν διπλογράφονται.')}</span></li>
        </ol>
        <p className="mt-2">{tr('Αν αλλάξεις την κατηγορία μιας αυτόματης κίνησης (πάτημα πάνω της, ⚡), η εφαρμογή θυμάται τον έμπορο για την επόμενη φορά.')}</p>
      </details>
    </section>
  )
}

function Backup({ data, onImport }: { data: AppData; onImport: (d: AppData) => Promise<void> }) {
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const json = JSON.stringify(data)
  const btn = 'flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-700 px-3 py-2.5 text-sm text-slate-100 active:scale-95'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setMsg(tr('Αντιγράφηκε! Επικόλλησέ το κάπου ασφαλές (π.χ. Σημειώσεις).'))
    } catch {
      setMsg(tr('Η αντιγραφή δεν επιτράπηκε. Χρησιμοποίησε «Λήψη αρχείου».'))
    }
  }
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    a.download = `cashflow-backup-${todayISO()}.json`
    a.click()
  }
  const restore = async () => {
    try {
      const parsed = JSON.parse(text.trim())
      const data = validateBackup(parsed)
      if (!window.confirm(tr('Τα τρέχοντα δεδομένα θα αντικατασταθούν. Συνέχεια;'))) return
      await onImport(data)
      setText('')
      setMsg(tr('Η επαναφορά ολοκληρώθηκε.'))
    } catch (error) {
      setMsg(error instanceof Error ? tr('Η επαναφορά απέτυχε: {0}', error.message) : tr('Δεν αναγνωρίστηκαν δεδομένα. Επικόλλησε ολόκληρο το αντίγραφο.'))
    }
  }

  return (
    <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><Download size={16} className="text-indigo-300" /> {tr('Αντίγραφο ασφαλείας')}</h2>
      <p className="text-xs text-slate-400">{tr('Τα δεδομένα μένουν μόνο σε αυτή τη συσκευή. Κάνε αντίγραφο πριν σβήσεις την εφαρμογή.')}</p>
      <div className="flex gap-2">
        <button onClick={copy} className={btn}><Copy size={15} /> {tr('Αντιγραφή')}</button>
        <button onClick={download} className={btn}><Download size={15} /> {tr('Λήψη αρχείου')}</button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => exportTransactions(data)} className={btn}><FileSpreadsheet size={15} /> {tr('Κινήσεις (Excel)')}</button>
        <button onClick={() => exportMonthly(data)} className={btn}><FileSpreadsheet size={15} /> {tr('Μηνιαία σύνοψη')}</button>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tr('Επικόλλησε εδώ το αντίγραφο για επαναφορά…')} rows={3} className="w-full rounded-2xl bg-slate-900 px-3 py-2 text-base text-slate-200 outline-none placeholder:text-slate-500" />
      <button disabled={!text.trim()} onClick={restore} className={`${btn} w-full flex-none disabled:opacity-40`}><ClipboardPaste size={15} /> {tr('Επαναφορά')}</button>
      {msg && <p className="text-xs text-indigo-300">{msg}</p>}
    </section>
  )
}

export function Settings({ data, onSettings, onAdd, onEdit, onImport, onImportInbox, onSync, onPasteMessage, sync, onSyncNow, theme, onTheme }: Props) {
  const lang = useLang()
  const { region, skipHolidays } = data.settings
  const today = todayISO()
  const upcoming = [...holidaysFor(Number(today.slice(0, 4)), region), ...holidaysFor(Number(today.slice(0, 4)) + 1, region)]
    .filter(([d]) => d >= today)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-fg">{tr('Ρυθμίσεις')}</h1>
      <div className="masonry space-y-6 lg:space-y-0">

      <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><Target size={16} className="text-indigo-300" /> {tr('Μηνιαίος στόχος εσόδων')}</h2>
        <div className="relative">
          <input inputMode="decimal" placeholder={tr('π.χ. 1200')} value={data.settings.monthlyGoal || ''} onChange={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); onSettings({ monthlyGoal: Number.isFinite(v) && v > 0 ? v : 0 }) }} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-base text-fg outline-none ring-2 ring-transparent placeholder:text-slate-500 focus:ring-indigo-500" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
        </div>
        <p className="text-[11px] text-slate-500">{tr('Εμφανίζεται στα Στατιστικά με πρόβλεψη τέλους μήνα. Άφησέ το κενό για να το κρύψεις.')}</p>
        <h3 className="pt-2 text-xs font-semibold text-slate-200">{tr('Αρχικό υπόλοιπο (τι είχες πριν ξεκινήσεις)')}</h3>
        <div className="relative">
          <input inputMode="decimal" placeholder={tr('π.χ. 350')} value={data.settings.openingBalance || ''} onChange={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); onSettings({ openingBalance: Number.isFinite(v) ? v : 0 }) }} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-base text-fg outline-none ring-2 ring-transparent placeholder:text-slate-500 focus:ring-indigo-500" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
        </div>
        <p className="text-[11px] text-slate-500">{tr('Χρησιμοποιείται στα «Συνολικά» ώστε το υπόλοιπο να είναι το πραγματικό σου ταμείο και να υπολογίζεται για πόσες μέρες φτάνει.')}</p>
      </section>

      <Security />
      <Budgets data={data} onSettings={onSettings} />

      <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><Palette size={16} className="text-indigo-300" /> {tr('Εμφάνιση')}</h2>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-900 p-1">
          {([['system', tr('Συστήματος')], ['light', tr('Φωτεινό')], ['dark', tr('Σκοτεινό')]] as const).map(([id, label]) => (
            <button key={id} onClick={() => onTheme(id)} className={`rounded-xl py-2 text-sm font-medium ${theme === id ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>{label}</button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
          {tr('Γλώσσα')}
          <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="rounded-xl bg-slate-900 px-3 py-2 text-base text-fg outline-none">
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
      </section>

      <section className="space-y-3 rounded-3xl bg-slate-800/70 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg"><CalendarHeart size={16} className="text-indigo-300" /> {tr('Αργίες')}</h2>
        <label className="block text-xs text-slate-400">{tr('Περιοχή')}<select value={region} onChange={(e) => onSettings({ region: e.target.value })} className="mt-1 w-full rounded-2xl bg-slate-900 px-4 py-3 text-base text-fg outline-none">
            {REGIONS.map((r) => <option key={r.id} value={r.id}>{tr(r.label)}</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-200">{tr('Να μην δημιουργούνται πάγια μαθήματα τις αργίες')}<input type="checkbox" checked={skipHolidays} onChange={(e) => onSettings({ skipHolidays: e.target.checked })} className="h-5 w-5 accent-indigo-500" />
        </label>
        <div>
          <p className="mb-1.5 text-xs text-slate-400">{tr('Επόμενες αργίες')}</p>
          <ul className="space-y-1 text-sm">
            {upcoming.map(([d, name]) => (
              <li key={d} className="flex justify-between"><span className="text-slate-200">{name}</span><span className="text-slate-400">{parseISO(d).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' })}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">{tr('Οι τοπικές αργίες είναι ενδεικτικές, επιβεβαίωσέ τις με τον δήμο σου.')}</p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg"><Repeat size={16} className="text-indigo-300" /> {tr('Πάγια έσοδα / έξοδα')}</h2>
          <button onClick={onAdd} className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-3 py-1.5 text-sm text-indigo-300 active:scale-95"><Plus size={16} /> {tr('Νέο')}</button>
        </div>
        {data.recurring.length === 0 && <p className="rounded-2xl border border-dashed border-fg/10 py-6 text-center text-sm text-slate-500">{tr('π.χ. Ταμείο ανεργίας κάθε μήνα, ενοίκιο, λογαριασμοί.')}</p>}
        <ul className="space-y-2">
          {data.recurring.map((r) => {
            const c = findCategory(r.category)
            const Icon = c.icon
            const inc = r.type === 'income'
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-slate-800/70 p-3">
                <span className="rounded-xl p-2" style={{ background: `${c.color}22`, color: c.color }}><Icon size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{r.note || c.label}</p>
                  <p className="text-xs text-slate-400">{tr('κάθε {0} του μήνα · από {1}', r.dayOfMonth, formatShort(r.startDate))}</p>
                </div>
                <span className={`font-semibold ${inc ? 'text-emerald-400' : 'text-rose-400'}`}>{inc ? '+' : '−'}{money(r.amount)}</span>
                <button onClick={() => onEdit(r)} aria-label={tr('Επεξεργασία')} className="rounded-full bg-fg/5 p-1.5 text-slate-400 active:scale-95"><Pencil size={14} /></button>
              </li>
            )
          })}
        </ul>
      </section>
      <PasteMessage onPasteMessage={onPasteMessage} />
      <CloudSync onSync={onSync} sync={sync} onSyncNow={onSyncNow} />
      <AutoCapture onImportInbox={onImportInbox} />
      <Backup data={data} onImport={onImport} />
      </div>
      <p className="text-center text-[11px] text-slate-500">Cash Flow · {__APP_VERSION__}</p>
    </div>
  )
}
